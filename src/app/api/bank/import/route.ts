import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";

const schema = z.object({
  transactions: z.array(
    z.object({
      id: z.string().uuid(),
      category: z.enum(["travel", "software", "office", "meals", "marketing", "professional", "equipment", "other"]),
      notes: z.string().max(500).optional(),
    }),
  ).min(1, "Select at least one transaction"),
});

export async function POST(req: NextRequest) {
  const org = await requireOrg();

  const plan = await getOrgPlan(org.id);
  if (!canAccess(plan, "open_banking")) {
    return NextResponse.json({ error: "Open Banking requires the Pro plan." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const supabase = await createClient();
  const { transactions } = parsed.data;
  const ids = transactions.map((t) => t.id);

  // Fetch the raw bank transactions — must belong to this org
  const { data: bankTxns, error: fetchErr } = await supabase
    .from("bank_transactions")
    .select("*")
    .in("id", ids)
    .eq("org_id", org.id)
    .is("expense_id", null);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!bankTxns?.length) return NextResponse.json({ error: "No valid transactions found" }, { status: 400 });

  const catMap = Object.fromEntries(transactions.map((t) => [t.id, t]));
  const imported: string[] = [];

  for (const txn of bankTxns) {
    const overrides = catMap[txn.id];

    const { data: expense, error: expErr } = await supabase
      .from("expenses")
      .insert({
        org_id: org.id,
        title: txn.merchant_name ?? txn.description,
        category: overrides.category,
        amount: txn.amount,
        currency: txn.currency,
        date: txn.date,
        notes: overrides.notes ?? txn.description,
        is_billable: false,
      })
      .select("id")
      .single();

    if (expErr || !expense) continue;

    // Link the bank transaction to the new expense
    await supabase
      .from("bank_transactions")
      .update({ expense_id: expense.id })
      .eq("id", txn.id);

    imported.push(expense.id);
  }

  return NextResponse.json({ ok: true, imported: imported.length });
}
