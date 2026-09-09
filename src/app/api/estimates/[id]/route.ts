import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { computeTotals } from "@/lib/invoice-totals";
import { partitionEstimates } from "@/lib/bulk-actions";
import { z } from "zod";

const schema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  template: z.enum(["tjn_classic", "clean_minimal", "bold_split", "modern_studio"]).optional(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  currency: z.string().optional(),
  po_number: z.string().nullable().optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().min(0),
    vat_rate: z.number().min(0).max(100),
    sort_order: z.number().int().default(0),
  })).min(1).optional(),
});

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("estimates")
    .select("*, clients(*), estimate_items(*)")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { items, discount, ...fields } = parsed.data;

  if (items !== undefined) {
    const totals = computeTotals(items, discount ?? 0);
    const { error } = await supabase
      .from("estimates")
      .update({ ...fields, discount: totals.discount, subtotal: totals.subtotal, vat_amount: totals.vat_amount, total: totals.total })
      .eq("id", id)
      .eq("org_id", org.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("estimate_items").delete().eq("estimate_id", id);
    await supabase.from("estimate_items").insert(
      items.map((item, i) => ({
        estimate_id: id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        sort_order: i,
      }))
    );
  } else {
    const updateFields = { ...fields, ...(discount !== undefined ? { discount } : {}) };
    if (Object.keys(updateFields).length > 0) {
      const { error } = await supabase
        .from("estimates")
        .update(updateFields)
        .eq("id", id)
        .eq("org_id", org.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  // The same rule bulk delete enforces, applied through the same pure function
  // rather than restated here — otherwise the row action would delete a converted
  // estimate that the bulk bar refuses to touch.
  const { data: estimate, error: fetchError } = await supabase
    .from("estimates")
    .select("id, estimate_number, converted_invoice_id")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const partition = partitionEstimates([estimate]);
  if (partition.deletable.length === 0) {
    return NextResponse.json(
      { error: partition.skips.map((s) => s.reason).join(". ") },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("estimates")
    .delete()
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();

  // Capture and log, but do not fail: the estimate is already gone, so a 500 here
  // would tell the caller the delete failed when it succeeded.
  const { error: auditError } = await supabase.from("audit_logs").insert({
    org_id: org.id,
    user_id: user?.id ?? null,
    action: "estimate.deleted",
    entity_type: "estimate",
    entity_id: id,
    meta: { estimate_number: estimate.estimate_number },
  });

  if (auditError) {
    console.error("audit log write failed", {
      action: "estimate.deleted",
      ids: [id],
      error: auditError.message,
    });
  }

  return NextResponse.json({ ok: true });
}
