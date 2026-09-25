import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { outstandingBalance } from "@/lib/bulk-actions";
import { applyInvoicePaymentState } from "@/lib/payments/apply-invoice-payment-state";

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

  // Recalculate invoice amount_paid and status.
  //
  // This used to compute the threshold inline as
  //   newAmountPaid + creditApplied >= (total + lateFee - creditApplied)
  // which counts the credit note twice, so the bar for "paid" sat one credit too
  // low. A £1,000 invoice with a £500 credit and £500 paid, refunded by £100, has
  // £100 genuinely outstanding — the old form marked it paid. Harmless when no
  // credit note exists, which is why it went unnoticed.
  //
  // outstandingBalance is the canonical formula used by every other payment path:
  // total + late_fee_amount - amount_paid - credit_applied, with each operand
  // coerced, since Postgres numerics can arrive as strings.
  const newAmountPaid = Math.max(0, Number(invoice.amount_paid) - amount);
  const creditApplied = Number((invoice as { credit_applied?: number }).credit_applied ?? 0);
  const remaining = outstandingBalance({ ...invoice, amount_paid: newAmountPaid });

  let newStatus = invoice.status;
  if (remaining <= 0.001) {
    newStatus = "paid";
  } else if (newAmountPaid + creditApplied > 0) {
    newStatus = "partial";
  } else {
    // Revert to appropriate active status
    const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date();
    newStatus = isOverdue ? "overdue" : "sent";
  }

  const { applied, error: stateError } = await applyInvoicePaymentState(
    supabase,
    {
      orgId: org.id,
      invoiceId: payment.invoice_id,
      state: {
        amount_paid: newAmountPaid,
        status: newStatus,
        paid_at: newStatus === "paid" ? undefined : null,
      },
    },
    { payment_id: id, refund_amount: amount }
  );

  // The refund itself is already recorded, so this reports the discrepancy
  // rather than pretending the invoice was recalculated.
  if (!applied) {
    return NextResponse.json(
      { error: `The refund was recorded but the invoice total wasn't updated (${stateError}).` },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    org_id: org.id,
    action: "payment.refunded",
    entity_type: "invoice",
    entity_id: payment.invoice_id,
    meta: { payment_id: id, amount, reason: reason ?? null, new_status: newStatus },
  });

  return NextResponse.json({ ok: true });
}
