import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { replaceLineItems } from "@/lib/line-items";
import { z } from "zod";

const schema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  template: z.enum(["tjn_classic", "clean_minimal", "bold_split", "modern_studio"]).optional(),
  currency: z.string().optional(),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  status: z.enum(["active", "paused", "ended"]).optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().min(0),
    vat_rate: z.number().min(0).max(100),
    sort_order: z.number().int().default(0),
  })).min(1).optional(),
});

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { items, ...fields } = parsed.data;

  // Confirm the schedule belongs to this org before touching it or its lines.
  const { data: existing } = await supabase
    .from("recurring_invoices")
    .select("id")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (Object.keys(fields).length > 0) {
    const { data: updated, error } = await supabase
      .from("recurring_invoices")
      .update(fields)
      .eq("id", id)
      .eq("org_id", org.id)
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!updated?.length) {
      return NextResponse.json({ error: "This schedule couldn't be saved. Please reload and try again." }, { status: 500 });
    }
  }

  if (items) {
    const itemsError = await replaceLineItems(
      supabase,
      "recurring_invoice_items",
      "recurring_invoice_id",
      id,
      items.map(({ sort_order: _sortOrder, ...item }) => item)
    );
    if (itemsError) return NextResponse.json({ error: itemsError }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { error } = await supabase
    .from("recurring_invoices")
    .delete()
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
