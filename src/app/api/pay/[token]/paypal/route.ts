import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
import { createPayPalOrder } from "@/lib/paypal/client";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { success } = await rateLimit("pay-paypal", clientIp(req), 10, 60);
  if (!success) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });

  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, org_id, invoice_number, total, amount_paid, currency, status, late_fee_amount, credit_applied")
    .eq("public_token", token)
    .single();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "paid") return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
  if (invoice.status === "void") return NextResponse.json({ error: "Invoice is void" }, { status: 400 });

  if (!canAccess(await getOrgPlan(invoice.org_id), "paypal_payments")) {
    return NextResponse.json({ error: "PayPal payments require the Business plan." }, { status: 403 });
  }

  const { data: org } = await supabase
    .from("organisations")
    .select("paypal_email")
    .eq("id", invoice.org_id)
    .single();

  if (!org?.paypal_email) {
    return NextResponse.json({ error: "PayPal is not configured for this organisation" }, { status: 400 });
  }

  const lateFee = (invoice as { late_fee_amount?: number }).late_fee_amount ?? 0;
  const creditApplied = (invoice as { credit_applied?: number }).credit_applied ?? 0;
  const amountDue = invoice.total + lateFee - invoice.amount_paid - creditApplied;

  if (amountDue <= 0) return NextResponse.json({ error: "Nothing due" }, { status: 400 });

  // An uncaught throw here returned a 500 with an empty body, so the payer saw a
  // generic failure and the cause never reached the logs in a readable form. The
  // payer still gets a calm message — they cannot act on a credentials fault — but
  // the reason is now recorded where it can be found.
  let order: { id?: string };
  try {
    order = await createPayPalOrder({
      invoiceId: invoice.id,
      amount: amountDue,
      currency: invoice.currency,
      payeeEmail: org.paypal_email,
      invoiceNumber: invoice.invoice_number,
    });
  } catch (error) {
    console.error("[paypal] could not create order", {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "PayPal is unavailable right now. Please try another payment method." },
      { status: 502 }
    );
  }

  if (!order.id) {
    console.error("[paypal] order created without an id", { invoiceId: invoice.id });
    return NextResponse.json({ error: "Failed to create PayPal order" }, { status: 500 });
  }

  return NextResponse.json({ id: order.id });
}
