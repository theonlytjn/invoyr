import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { PaymentFailedEmail } from "@/emails/transactional/PaymentFailedEmail";
import { PaymentReceivedEmail } from "@/emails/transactional/PaymentReceivedEmail";
import { SubscriptionActivatedEmail } from "@/emails/transactional/SubscriptionActivatedEmail";
import { InvoicePaidOwnerEmail } from "@/emails/transactional/InvoicePaidOwnerEmail";
import { getPlanByPriceId } from "@/config/plans";
import { formatDate } from "@/lib/utils";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "payment") {
        await handleInvoiceCheckout(session);
      } else if (session.mode === "subscription") {
        await handleSubscriptionCheckout(session);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    }
    case "invoice.payment_failed": {
      await handleSubscriptionPaymentFailed(event.data.object as Stripe.Invoice);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handleInvoiceCheckout(session: Stripe.Checkout.Session) {
  const invoiceId = session.metadata?.invoice_id;
  const orgId = session.metadata?.org_id;
  if (!invoiceId || !orgId) return;

  const supabase = await createServiceClient();
  const amountPaid = (session.amount_total ?? 0) / 100;
  const currency = (session.currency ?? "gbp").toUpperCase();

  await supabase.from("payments").insert({
    org_id: orgId,
    invoice_id: invoiceId,
    amount: amountPaid,
    currency,
    method: "stripe",
    stripe_payment_intent_id: session.payment_intent as string | null,
    paid_at: new Date().toISOString(),
  });

  await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString(), amount_paid: amountPaid })
    .eq("id", invoiceId);

  await supabase.from("audit_logs").insert({
    org_id: orgId,
    action: "invoice.paid",
    entity_type: "invoice",
    entity_id: invoiceId,
    meta: { stripe_session: session.id, amount: amountPaid },
  });

  // Send receipt email to client + payment notification to org owner
  const [{ data: invoice }, { data: org }, { data: members }] = await Promise.all([
    supabase
      .from("invoices")
      .select("invoice_number, public_token, paid_at, clients(name, email)")
      .eq("id", invoiceId)
      .single(),
    supabase
      .from("organisations")
      .select("name, logo_url, accent_color")
      .eq("id", orgId)
      .single(),
    supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("role", "owner")
      .limit(1),
  ]);

  if (invoice) {
    const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
    const formattedAmount = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toLowerCase() === "gbp" ? "GBP" : currency,
    }).format(amountPaid);
    const logoUrl = org?.logo_url ? org.logo_url.split("?")[0] : null;

    await Promise.allSettled([
      // Client receipt
      client?.email
        ? sendTransactionalEmail({
            orgId,
            invoiceId,
            to: client.email,
            subject: `Payment received — Invoice ${invoice.invoice_number}`,
            templateName: "payment-received",
            react: createElement(PaymentReceivedEmail, {
              clientName: client.name,
              orgName: org?.name ?? "",
              logoUrl,
              accentColor: org?.accent_color ?? "#111827",
              invoiceNumber: invoice.invoice_number,
              amountPaid: formattedAmount,
              receiptUrl: `${appUrl}/pay/${invoice.public_token}?paid=1`,
            }),
          })
        : Promise.resolve(),

      // Owner notification
      (async () => {
        const ownerId = members?.[0]?.user_id;
        if (!ownerId) return;
        const { data: authUser } = await supabase.auth.admin.getUserById(ownerId);
        const ownerEmail = authUser?.user?.email;
        if (!ownerEmail || ownerEmail === client?.email) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", ownerId)
          .single();

        await sendTransactionalEmail({
          orgId,
          invoiceId,
          to: ownerEmail,
          subject: `Payment received — ${formattedAmount} for invoice ${invoice.invoice_number}`,
          templateName: "invoice-paid-owner",
          react: createElement(InvoicePaidOwnerEmail, {
            firstName: profile?.first_name ?? org?.name ?? "there",
            orgName: org?.name ?? "",
            logoUrl,
            accentColor: org?.accent_color ?? "#111827",
            invoiceNumber: invoice.invoice_number,
            clientName: client?.name ?? "Your client",
            amountPaid: formattedAmount,
            paidAt: invoice.paid_at ? formatDate(invoice.paid_at) : formatDate(new Date().toISOString()),
            viewUrl: `${appUrl}/invoices/${invoiceId}`,
          }),
        });
      })(),
    ]);
  }
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.org_id;
  const planId = session.metadata?.plan_id ?? null;
  if (!orgId) return;

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  if (!stripeSubscriptionId) return;

  const stripe = getStripe();
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  await upsertSubscription(orgId, stripeSub, planId);

  // Send subscription activated email to org owner
  const supabase = await createServiceClient();
  const [{ data: members }] = await Promise.all([
    supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("role", "owner")
      .limit(1),
  ]);

  const ownerId = members?.[0]?.user_id;
  if (!ownerId) return;

  const [{ data: authUser }, { data: profile }] = await Promise.all([
    supabase.auth.admin.getUserById(ownerId),
    supabase.from("profiles").select("first_name").eq("id", ownerId).single(),
  ]);

  const ownerEmail = authUser?.user?.email;
  if (!ownerEmail) return;

  const resolvedPlan = planId ?? "Pro";
  const planLabel = `${resolvedPlan.charAt(0).toUpperCase()}${resolvedPlan.slice(1)}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  await sendTransactionalEmail({
    orgId,
    to: ownerEmail,
    subject: `You're now on Invoyr ${planLabel}`,
    templateName: "subscription-activated",
    react: createElement(SubscriptionActivatedEmail, {
      firstName: profile?.first_name ?? "there",
      planName: `Invoyr ${planLabel}`,
      ctaUrl: `${appUrl}/dashboard`,
    }),
  });
}

async function handleSubscriptionUpsert(stripeSub: Stripe.Subscription) {
  const orgId = stripeSub.metadata?.org_id;
  const planId = stripeSub.metadata?.plan_id ?? null;
  if (!orgId) return;
  await upsertSubscription(orgId, stripeSub, planId);
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const orgId = stripeSub.metadata?.org_id;
  if (!orgId) return;

  const supabase = await createServiceClient();
  await supabase
    .from("subscriptions")
    .update({ status: "canceled", cancel_at_period_end: false })
    .eq("org_id", orgId);

  await supabase.from("audit_logs").insert({
    org_id: orgId,
    action: "subscription.canceled",
    entity_type: "subscription",
    entity_id: stripeSub.id,
    meta: {},
  });
}

async function handleSubscriptionPaymentFailed(stripeInvoice: Stripe.Invoice) {
  const subRef = stripeInvoice.parent?.subscription_details?.subscription;
  const subId =
    typeof subRef === "string" ? subRef : (subRef as Stripe.Subscription | null)?.id ?? null;

  if (!subId) return;

  const supabase = await createServiceClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("org_id, organisations(name, email)")
    .eq("stripe_subscription_id", subId)
    .single();

  if (!sub) return;

  await supabase
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subId);

  const org = Array.isArray(sub.organisations) ? sub.organisations[0] : sub.organisations;
  if (!org?.email) return;

  const { data: members } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("org_id", sub.org_id)
    .eq("role", "owner")
    .limit(1);

  const ownerId = members?.[0]?.user_id;
  if (!ownerId) return;

  const { data: authUser } = await supabase.auth.admin.getUserById(ownerId);
  const toEmail = authUser?.user?.email;
  if (!toEmail) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", ownerId)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  await sendTransactionalEmail({
    orgId: sub.org_id,
    to: toEmail,
    subject: "Payment failed for your Invoyr subscription",
    templateName: "payment-failed",
    react: createElement(PaymentFailedEmail, {
      firstName: profile?.first_name ?? org.name,
      ctaUrl: `${appUrl}/settings/billing`,
    }),
  });
}

async function upsertSubscription(
  orgId: string,
  stripeSub: Stripe.Subscription,
  planIdOverride: string | null
) {
  const supabase = await createServiceClient();

  const firstItem = stripeSub.items.data[0];
  const priceId = firstItem?.price?.id ?? null;
  const resolvedPlan = planIdOverride ?? (priceId ? getPlanByPriceId(priceId) : null);

  const statusMap: Record<string, string> = {
    trialing: "trialing",
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    incomplete: "incomplete",
    incomplete_expired: "canceled",
    unpaid: "past_due",
    paused: "past_due",
  };

  await supabase.from("subscriptions").upsert(
    {
      org_id: orgId,
      stripe_subscription_id: stripeSub.id,
      stripe_price_id: priceId,
      plan: resolvedPlan,
      status: (statusMap[stripeSub.status] ?? "active") as never,
      trial_ends_at: stripeSub.trial_end
        ? new Date(stripeSub.trial_end * 1000).toISOString()
        : null,
      current_period_start: firstItem?.current_period_start
        ? new Date(firstItem.current_period_start * 1000).toISOString()
        : null,
      current_period_end: firstItem?.current_period_end
        ? new Date(firstItem.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: stripeSub.cancel_at_period_end,
    },
    { onConflict: "org_id" }
  );

  await supabase.from("audit_logs").insert({
    org_id: orgId,
    action: "subscription.updated",
    entity_type: "subscription",
    entity_id: stripeSub.id,
    meta: { status: stripeSub.status, plan: resolvedPlan },
  });
}
