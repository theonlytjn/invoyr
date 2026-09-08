import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { partitionExpenses } from "@/lib/bulk-actions";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  category: z.enum(["travel","software","office","meals","marketing","professional","equipment","other"]).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  client_id: z.string().uuid().nullable().optional(),
  receipt_url: z.string().url().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  is_billable: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const org = await requireOrg();
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", org.id)
    .select("*, clients(id, name, company_name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ expense: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  // The same rule bulk delete enforces, applied through the same pure function
  // rather than restated here — otherwise the trash icon on a row would delete a
  // billed expense that the bulk bar refuses to touch.
  const { data: expense, error: fetchError } = await supabase
    .from("expenses")
    .select("id, title, amount, invoice_id")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const partition = partitionExpenses([expense]);
  if (partition.deletable.length === 0) {
    return NextResponse.json(
      { error: partition.skips.map((s) => s.reason).join(". ") },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();

  // Capture and log, but do not fail: the expense is already gone, so a 500 here
  // would tell the caller the delete failed when it succeeded.
  const { error: auditError } = await supabase.from("audit_logs").insert({
    org_id: org.id,
    user_id: user?.id ?? null,
    action: "expense.deleted",
    entity_type: "expense",
    entity_id: id,
    meta: { title: expense.title, amount: expense.amount },
  });

  if (auditError) {
    console.error("audit log write failed", {
      action: "expense.deleted",
      ids: [id],
      error: auditError.message,
    });
  }

  return NextResponse.json({ ok: true });
}
