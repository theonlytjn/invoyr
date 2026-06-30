import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createPayPalOrder } from "@/lib/paypal/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
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

  const order = await createPayPalOrder({
    invoiceId: invoice.id,
    amount: amountDue,
    currency: invoice.currency,
    payeeEmail: org.paypal_email,
    invoiceNumber: invoice.invoice_number,
  });

  if (!order.id) {
    return NextResponse.json({ error: "Failed to create PayPal order" }, { status: 500 });
  }

  return NextResponse.json({ id: order.id });
}
