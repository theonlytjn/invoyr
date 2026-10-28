import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { computeTotals } from "@/lib/invoice-totals";
import { claimDocumentNumber, formatDocumentNumber } from "@/lib/document-number";
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

  let estimateNumber: string;
  try {
    estimateNumber = formatDocumentNumber("EST", await claimDocumentNumber(supabase, org.id, "estimate"));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not reserve an estimate number" }, { status: 500 });
  }

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

  const { error: itemsError } = await supabase.from("estimate_items").insert(
    items.map((item, i) => ({
      estimate_id: estimate.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      vat_rate: item.vat_rate,
      sort_order: i,
    }))
  );

  // An estimate with a total and no lines is worse than none. Undo the header
  // (its number stays used; a gap is better than a duplicate).
  if (itemsError) {
    await supabase.from("estimates").delete().eq("id", estimate.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    org_id: org.id,
    action: "estimate.created",
    entity_type: "estimate",
    entity_id: estimate.id,
    meta: { estimate_number: estimateNumber },
  });

  return NextResponse.json({ data: estimate }, { status: 201 });
}
