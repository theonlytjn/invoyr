import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
import { z } from "zod";

const schema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  template: z.enum(["tjn_classic", "clean_minimal", "bold_split", "modern_studio"]).default("tjn_classic"),
  currency: z.string().default("GBP"),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().min(0),
    vat_rate: z.number().min(0).max(100),
    sort_order: z.number().int().default(0),
  })).min(1),
});

function calcNextRun(frequency: string, from: Date): string {
  const d = new Date(from);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (frequency === "quarterly") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

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

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { items, ...fields } = parsed.data;
  const nextRun = calcNextRun(fields.frequency, new Date(fields.start_date));

  const { data: rec, error } = await supabase
    .from("recurring_invoices")
    .insert({ ...fields, org_id: org.id, next_run_at: nextRun })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("recurring_invoice_items").insert(
    items.map((item, i) => ({ ...item, recurring_invoice_id: rec.id, sort_order: i }))
  );

  return NextResponse.json({ data: rec }, { status: 201 });
}
