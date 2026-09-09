import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { bulkIdsSchema } from "@/lib/bulk-request";
import { buildExpenseEditPatch, partitionExpenseEdit, summarise } from "@/lib/bulk-actions";

const schema = z
  .object({
    ids: bulkIdsSchema(),
    dryRun: z.boolean().optional().default(false),
    // Absent = leave unchanged. No .default() anywhere here: a default would
    // erase the difference between "not sent" and "sent as null".
    category: z
      .enum(["travel", "software", "office", "meals", "marketing", "professional", "equipment", "other"])
      .optional(),
    client_id: z.string().uuid().nullable().optional(),
    is_billable: z.boolean().optional(),
  })
  .refine(
    // A dry run is asking "what would be eligible?", which needs only the ids — so the
    // at-least-one-field rule applies to real writes only. Requiring a field on dry runs
    // would force the client to invent a placeholder value it never intends to save.
    (v) => v.dryRun || v.category !== undefined || v.client_id !== undefined || v.is_billable !== undefined,
    { message: "Choose at least one field to change" }
  );

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { ids, dryRun, category, client_id, is_billable } = parsed.data;

  // A client id from the body must belong to this org, or a caller could link
  // their expenses to another organisation's client.
  if (client_id) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", client_id)
      .eq("org_id", org.id)
      .maybeSingle();

    if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 400 });
  }

  const { data: expenses, error: fetchError } = await supabase
    .from("expenses")
    .select("id, title, invoice_id")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const partition = partitionExpenseEdit(expenses ?? []);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const updateIds = partition.deletable.map((e) => e.id);
  // Pure, and tested as such (`buildExpenseEditPatch` in bulk-actions.test.ts):
  // `false` and `null` are real values that must be written, and an absent field
  // must produce no key at all. `updated_at` is added here because it is neither
  // a user field nor pure.
  const fieldPatch = buildExpenseEditPatch({ category, client_id, is_billable });
  const patch = { ...fieldPatch, updated_at: new Date().toISOString() };

  const { error: updateError } = await supabase
    .from("expenses")
    .update(patch)
    .in("id", updateIds)
    .eq("org_id", org.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { error: auditError } = await supabase.from("audit_logs").insert(
    partition.deletable.map((exp) => ({
      org_id: org.id,
      user_id: user.id,
      action: "expense.updated",
      entity_type: "expense",
      entity_id: exp.id,
      meta: { title: exp.title, changed: Object.keys(fieldPatch), bulk: true },
    }))
  );

  if (auditError) {
    console.error("[bulk] audit log write failed", {
      action: "expense.updated",
      ids: updateIds,
      error: auditError.message,
    });
  }

  return NextResponse.json(result);
}
