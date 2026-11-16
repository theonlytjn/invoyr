import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { replaceLineItems } from "@/lib/line-items";
import { checkSchedule, firstIssue, updateRecurringSchema } from "@/lib/recurring/schema";
import { firstRunOnOrAfter, nextRunAfter } from "@/lib/recurring/schedule";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const body = await req.json().catch(() => null);
  const parsed = updateRecurringSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });

  const { items, ...fields } = parsed.data;

  // Confirm the schedule belongs to this org before touching it or its lines.
  const { data: existing } = await supabase
    .from("recurring_invoices")
    .select("id, client_id, auto_send, start_date, end_date, frequency, last_run_at, next_run_at, status")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check the cross-field rules against the schedule as it will be after this edit.
  const merged = { ...existing, ...fields };
  const problem = checkSchedule(merged);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  if (fields.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", fields.client_id)
      .eq("org_id", org.id)
      .maybeSingle();
    if (!client) return NextResponse.json({ error: "Client not found." }, { status: 400 });
  }

  // Changing when it runs moves the next invoice to match: the start date if
  // nothing has been generated yet, otherwise the next date after the last run.
  if (fields.start_date !== undefined || fields.frequency !== undefined) {
    const update = fields as typeof fields & { next_run_at?: string };
    update.next_run_at = existing.last_run_at
      ? nextRunAfter(merged.start_date, merged.frequency, existing.last_run_at)
      : firstRunOnOrAfter(merged.start_date, merged.frequency, new Date().toISOString().slice(0, 10));
  }
  // An ended schedule whose end date was pushed back carries on.
  if (existing.status === "ended" && fields.end_date !== undefined && fields.status === undefined) {
    const update = fields as typeof fields & { status?: string };
    if (!fields.end_date || fields.end_date >= existing.next_run_at) update.status = "active";
  }

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
