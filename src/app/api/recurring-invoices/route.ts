import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
import { createRecurringSchema, firstIssue } from "@/lib/recurring/schema";
import { firstRunOnOrAfter } from "@/lib/recurring/schedule";

export async function GET() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recurring_invoices")
    .select("*, clients(name), recurring_invoice_items(*)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const org = await requireOrg();
  const plan = await getOrgPlan(org.id);
  if (!canAccess(plan, "recurring_invoices")) {
    return NextResponse.json({ error: "Recurring invoices require the Business plan or above." }, { status: 403 });
  }

  const supabase = await createClient();

  const body = await req.json().catch(() => null);
  const parsed = createRecurringSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  const { items, ...fields } = parsed.data;

  if (fields.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", fields.client_id)
      .eq("org_id", org.id)
      .maybeSingle();
    if (!client) return NextResponse.json({ error: "Client not found." }, { status: 400 });
  }

  // The first invoice is made on the start date itself, not one period later.
  const nextRun = firstRunOnOrAfter(fields.start_date, fields.frequency, new Date().toISOString().slice(0, 10));

  const { data: rec, error } = await supabase
    .from("recurring_invoices")
    .insert({ ...fields, org_id: org.id, next_run_at: nextRun })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: itemsError } = await supabase.from("recurring_invoice_items").insert(
    items.map((item, i) => ({ ...item, recurring_invoice_id: rec.id, sort_order: i }))
  );

  // A schedule with no lines would generate empty invoices. Undo it.
  if (itemsError) {
    await supabase.from("recurring_invoices").delete().eq("id", rec.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ data: rec }, { status: 201 });
}
