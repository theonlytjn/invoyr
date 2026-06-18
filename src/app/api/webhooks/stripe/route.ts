import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutComplete(session);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const invoiceId = session.metadata?.invoice_id;
  const orgId = session.metadata?.org_id;
  if (!invoiceId || !orgId) return;

  const supabase = await createServiceClient();

  const amountPaid = (session.amount_total ?? 0) / 100;

  await supabase.from("payments").insert({
    org_id: orgId,
    invoice_id: invoiceId,
    amount: amountPaid,
    currency: (session.currency ?? "gbp").toUpperCase(),
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
}
