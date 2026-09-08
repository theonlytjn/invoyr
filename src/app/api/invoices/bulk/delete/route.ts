import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { partitionInvoices, summarise, type InvoiceRow } from "@/lib/bulk-actions";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun } = parsed.data;

  // Rows outside this org simply do not come back, and summarise() counts them as skipped.
  const { data: invoices, error: fetchError } = await supabase
    .from("invoices")
    .select("id, invoice_number, status")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const candidateIds = (invoices ?? []).map((i) => i.id);

  // A voided invoice can still carry payment history. Deleting it would cascade
  // through payments, refunds and credit_notes and destroy those records.
  const encumbered = new Set<string>();
  if (candidateIds.length > 0) {
    const [payments, refunds, creditNotes] = await Promise.all([
      supabase.from("payments").select("invoice_id").in("invoice_id", candidateIds),
      supabase.from("refunds").select("invoice_id").in("invoice_id", candidateIds),
      supabase.from("credit_notes").select("invoice_id").in("invoice_id", candidateIds),
    ]);
    for (const set of [payments.data, refunds.data, creditNotes.data]) {
      for (const row of set ?? []) encumbered.add(row.invoice_id as string);
    }
  }

  const rows: InvoiceRow[] = (invoices ?? []).map((i) => ({
    id: i.id,
    invoice_number: i.invoice_number,
    status: i.status,
    hasFinancialRecords: encumbered.has(i.id),
  }));

  const partition = partitionInvoices(rows);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const deleteIds = partition.deletable.map((i) => i.id);

  // expenses.invoice_id is ON DELETE SET NULL, so without this an expense billed to a
  // deleted invoice would keep invoiced_at set while pointing at nothing.
  const { error: expenseError } = await supabase
    .from("expenses")
    .update({ invoice_id: null, invoiced_at: null })
    .in("invoice_id", deleteIds)
    .eq("org_id", org.id);

  if (expenseError) return NextResponse.json({ error: expenseError.message }, { status: 500 });

  const { error: deleteError } = await supabase
    .from("invoices")
    .delete()
    .in("id", deleteIds)
    .eq("org_id", org.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const { error: auditError } = await supabase.from("audit_logs").insert(
    partition.deletable.map((inv) => ({
      org_id: org.id,
      user_id: user.id,
      action: "invoice.deleted",
      entity_type: "invoice",
      entity_id: inv.id,
      meta: { invoice_number: inv.invoice_number, status: inv.status, bulk: true },
    }))
  );

  if (auditError) {
    console.error("[bulk] audit log write failed", {
      action: "invoice.deleted",
      ids: deleteIds,
      error: auditError.message,
    });
  }

  return NextResponse.json(result);
}
