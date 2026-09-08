import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bulkIdsSchema } from "@/lib/bulk-request";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { outstandingBalance, partitionMarkPaid, summarise } from "@/lib/bulk-actions";

const schema = z.object({
  ids: bulkIdsSchema(),
  dryRun: z.boolean().optional().default(false),
  // "stripe" is a valid db value but is deliberately not offered here: Stripe payments
  // arrive via webhook, which is the source of truth for them, and letting someone
  // manually assert a Stripe payment in bulk would undermine that.
  method: z.enum(["bank_transfer", "cash", "cheque", "other"]).optional().default("bank_transfer"),
  paidAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun, method } = parsed.data;
  const paidAt = parsed.data.paidAt ?? new Date().toISOString();

  const { data: invoices, error: fetchError } = await supabase
    .from("invoices")
    // late_fee_amount and credit_applied are operands of the outstanding-balance
    // formula, so they must be selected or every balance would be computed wrong.
    .select("id, invoice_number, status, total, amount_paid, late_fee_amount, credit_applied, currency")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const partition = partitionMarkPaid(invoices ?? []);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const rows = invoices ?? [];
  const currencyOf = new Map(rows.map((i) => [i.id, i.currency as string]));

  // Computed once per invoice and reused for the payment row, the invoice update and
  // the audit meta, so the three can never disagree about how much was settled.
  const balanceOf = new Map(partition.deletable.map((inv) => [inv.id, outstandingBalance(inv)]));

  const paymentRows = partition.deletable.map((inv) => ({
    org_id: org.id,
    invoice_id: inv.id,
    amount: balanceOf.get(inv.id) ?? 0,
    currency: currencyOf.get(inv.id) ?? "GBP",
    method,
    reference: null,
    paid_at: paidAt,
  }));

  const { error: payError } = await supabase.from("payments").insert(paymentRows);
  if (payError) return NextResponse.json({ error: payError.message }, { status: 500 });

  // Status is computed here, on the server, from the invoice's own totals.
  // amount_paid accumulates the payment just recorded — it is not set to `total`,
  // which would double-count an existing part payment and swallow late fees and
  // credits. This matches RecordPaymentModal's `amount_paid + payment`.
  for (const inv of partition.deletable) {
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        amount_paid: Number(inv.amount_paid) + (balanceOf.get(inv.id) ?? 0),
        status: "paid",
        paid_at: paidAt,
      })
      .eq("id", inv.id)
      .eq("org_id", org.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: auditError } = await supabase.from("audit_logs").insert(
    partition.deletable.map((inv) => ({
      org_id: org.id,
      user_id: user.id,
      action: "invoice.paid",
      entity_type: "invoice",
      entity_id: inv.id,
      meta: {
        invoice_number: inv.invoice_number,
        amount: balanceOf.get(inv.id) ?? 0,
        method,
        bulk: true,
      },
    }))
  );

  if (auditError) {
    console.error("[bulk] audit log write failed", {
      action: "invoice.paid",
      ids: partition.deletable.map((i) => i.id),
      error: auditError.message,
    });
  }

  return NextResponse.json(result);
}
