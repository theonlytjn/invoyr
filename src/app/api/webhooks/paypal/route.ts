import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyPayPalWebhook } from "@/lib/paypal/client";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { PaymentReceivedEmail } from "@/emails/transactional/PaymentReceivedEmail";
import { InvoicePaidOwnerEmail } from "@/emails/transactional/InvoicePaidOwnerEmail";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const verified = await verifyPayPalWebhook({
    transmissionId: req.headers.get("paypal-transmission-id") ?? "",
    transmissionTime: req.headers.get("paypal-transmission-time") ?? "",
    certUrl: req.headers.get("paypal-cert-url") ?? "",
    authAlgo: req.headers.get("paypal-auth-algo") ?? "",
    transmissionSig: req.headers.get("paypal-transmission-sig") ?? "",
    body,
  });

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
    return NextResponse.json({ received: true });
  }

  const resource = event.resource;
  const invoiceId = resource?.custom_id;
  const captureId = resource?.id;
  const capturedAmount = parseFloat(resource?.amount?.value ?? "0");
  const currency = resource?.amount?.currency_code ?? "GBP";

  if (!invoiceId || !captureId || capturedAmount <= 0) {
    return NextResponse.json({ received: true });
  }

  const supabase = await createServiceClient();

  // Idempotency: skip if already recorded
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_payment_intent_id", captureId)
    .maybeSingle();

  if (existing) return NextResponse.json({ received: true });

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, org_id, invoice_number, total, amount_paid, currency, status, late_fee_amount, credit_applied, public_token, paid_at, clients(name, email)")
    .eq("id", invoiceId)
    .single();

  if (!invoice || invoice.status === "paid" || invoice.status === "void") {
    return NextResponse.json({ received: true });
  }

  const newAmountPaid = (invoice.amount_paid ?? 0) + capturedAmount;
  const lateFee = (invoice as { late_fee_amount?: number }).late_fee_amount ?? 0;
  const creditApplied = (invoice as { credit_applied?: number }).credit_applied ?? 0;
  const totalOwed = invoice.total + lateFee - creditApplied;
  const newStatus = newAmountPaid >= totalOwed - 0.001 ? "paid" : "partial";
  const now = new Date().toISOString();

  await supabase.from("payments").insert({
    org_id: invoice.org_id,
    invoice_id: invoiceId,
    amount: capturedAmount,
    currency,
    method: "paypal",
    stripe_payment_intent_id: captureId,
    paid_at: now,
  });

  await supabase
    .from("invoices")
    .update({
      status: newStatus,
      amount_paid: newAmountPaid,
      paid_at: newStatus === "paid" ? now : invoice.paid_at,
    })
    .eq("id", invoiceId);

  await supabase.from("audit_logs").insert({
    org_id: invoice.org_id,
    action: newStatus === "paid" ? "invoice.paid" : "invoice.partial_payment",
    entity_type: "invoice",
    entity_id: invoiceId,
    meta: { paypal_capture: captureId, amount: capturedAmount, source: "webhook" },
  });

  if (newStatus === "paid") {
    const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
    const { data: org } = await supabase
      .from("organisations")
      .select("name, logo_url, accent_color")
      .eq("id", invoice.org_id)
      .single();

    const { data: members } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", invoice.org_id)
      .eq("role", "owner")
      .limit(1);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
    const logoUrl = org?.logo_url ? org.logo_url.split("?")[0] : null;
    const formattedAmount = formatCurrency(capturedAmount, currency);

    await Promise.allSettled([
      client?.email
        ? sendTransactionalEmail({
            orgId: invoice.org_id,
            invoiceId,
            to: client.email,
            subject: `Payment received — Invoice ${invoice.invoice_number}`,
            templateName: "payment-received",
            react: createElement(PaymentReceivedEmail, {
              clientName: client.name ?? "there",
              orgName: org?.name ?? "",
              logoUrl,
              accentColor: org?.accent_color ?? "#111827",
              invoiceNumber: invoice.invoice_number,
              amountPaid: formattedAmount,
              receiptUrl: `${appUrl}/pay/${invoice.public_token}?paid=1`,
            }),
          })
        : Promise.resolve(),

      (async () => {
        const ownerId = members?.[0]?.user_id;
        if (!ownerId) return;
        const { data: authUser } = await supabase.auth.admin.getUserById(ownerId);
        const ownerEmail = authUser?.user?.email;
        if (!ownerEmail || ownerEmail === client?.email) return;
        await sendTransactionalEmail({
          orgId: invoice.org_id,
          invoiceId,
          to: ownerEmail,
          subject: `Payment received — ${formattedAmount} for invoice ${invoice.invoice_number}`,
          templateName: "invoice-paid-owner",
          react: createElement(InvoicePaidOwnerEmail, {
            firstName: org?.name ?? "there",
            orgName: org?.name ?? "",
            logoUrl,
            accentColor: org?.accent_color ?? "#111827",
            invoiceNumber: invoice.invoice_number,
            clientName: client?.name ?? "Your client",
            amountPaid: formattedAmount,
            paidAt: formatDate(now),
            viewUrl: `${appUrl}/invoices/${invoiceId}`,
          }),
        });
      })(),
    ]);
  }

  return NextResponse.json({ received: true });
}
