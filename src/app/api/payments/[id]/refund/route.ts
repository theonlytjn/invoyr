import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

const schema = z.object({
  amount: z.number().positive(),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { amount, reason } = parsed.data;

  // Verify payment belongs to this org
  const { data: payment } = await supabase
    .from("payments")
    .select("id, org_id, invoice_id, amount, currency")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  // Amount can't exceed payment amount
  if (amount > payment.amount + 0.001) {
    return NextResponse.json(
      { error: `Refund cannot exceed the payment amount of ${payment.amount}` },
      { status: 400 }
    );
  }

  // Fetch invoice for status recalculation
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, total, amount_paid, late_fee_amount, credit_applied, due_date, status")
    .eq("id", payment.invoice_id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  // Insert refund record
  const { error: refundError } = await supabase.from("refunds").insert({
    org_id: org.id,
    payment_id: id,
    invoice_id: payment.invoice_id,
    amount,
    reason: reason ?? null,
  });

  if (refundError) return NextResponse.json({ error: refundError.message }, { status: 500 });

  // Recalculate invoice amount_paid and status
  const newAmountPaid = Math.max(0, invoice.amount_paid - amount);
  const lateFee = (invoice as { late_fee_amount?: number }).late_fee_amount ?? 0;
  const creditApplied = (invoice as { credit_applied?: number }).credit_applied ?? 0;
  const totalOwed = invoice.total + lateFee - creditApplied;

  let newStatus = invoice.status;
  if (newAmountPaid + creditApplied >= totalOwed - 0.001) {
    newStatus = "paid";
  } else if (newAmountPaid + creditApplied > 0) {
    newStatus = "partial";
  } else {
    // Revert to appropriate active status
    const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date();
    newStatus = isOverdue ? "overdue" : "sent";
  }

  await supabase
    .from("invoices")
    .update({
      amount_paid: newAmountPaid,
      status: newStatus,
      paid_at: newStatus === "paid" ? undefined : null,
    })
    .eq("id", payment.invoice_id);

  await supabase.from("audit_logs").insert({
    org_id: org.id,
    action: "payment.refunded",
    entity_type: "invoice",
    entity_id: payment.invoice_id,
    meta: { payment_id: id, amount, reason: reason ?? null, new_status: newStatus },
  });

  return NextResponse.json({ ok: true });
}
