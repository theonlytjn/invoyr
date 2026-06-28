import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { computeTotals } from "@/lib/invoice-totals";
import { z } from "zod";

const schema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  template: z.enum(["tjn_classic", "clean_minimal", "bold_split", "modern_studio"]).default("tjn_classic"),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  currency: z.string().default("GBP"),
  po_number: z.string().nullable().optional(),
  discount: z.number().min(0).default(0),
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

export async function GET() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("estimates")
    .select("*, clients(id, name, email, company_name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const org = await requireOrg();
  const supabase = await createClient();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { items, discount, ...fields } = parsed.data;

  // Atomic number increment
  const { data: orgData, error: orgErr } = await supabase
    .from("organisations")
    .select("next_estimate_number, invoice_prefix")
    .eq("id", org.id)
    .single();

  if (orgErr || !orgData) return NextResponse.json({ error: "Could not fetch org" }, { status: 500 });

  const estimateNumber = `EST-${String(orgData.next_estimate_number).padStart(4, "0")}`;

  await supabase
    .from("organisations")
    .update({ next_estimate_number: orgData.next_estimate_number + 1 })
    .eq("id", org.id);

  const totals = computeTotals(items, discount);

  const { data: estimate, error } = await supabase
    .from("estimates")
    .insert({
      ...fields,
      org_id: org.id,
      estimate_number: estimateNumber,
      discount: totals.discount,
      subtotal: totals.subtotal,
      vat_amount: totals.vat_amount,
      total: totals.total,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("estimate_items").insert(
    items.map((item, i) => ({
      estimate_id: estimate.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      vat_rate: item.vat_rate,
      sort_order: i,
    }))
  );

  await supabase.from("audit_logs").insert({
    org_id: org.id,
    action: "estimate.created",
    entity_type: "estimate",
    entity_id: estimate.id,
    meta: { estimate_number: estimateNumber },
  });

  return NextResponse.json({ data: estimate }, { status: 201 });
}
