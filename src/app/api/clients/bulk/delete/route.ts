import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bulkIdsSchema } from "@/lib/bulk-request";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { partitionClients, summarise, type ClientRow } from "@/lib/bulk-actions";
import { buildClientSnapshot } from "@/lib/client-snapshot";

const schema = z.object({
  ids: bulkIdsSchema(),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun } = parsed.data;

  // The full row, not just `id, name`: `buildClientSnapshot` needs the address and
  // VAT fields, and it is fed straight from this select before the client is
  // deleted below.
  const { data: clients, error: fetchError } = await supabase
    .from("clients")
    .select(
      "id, name, company_name, email, phone, address_line1, address_line2, city, postcode, country, vat_number"
    )
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const candidateIds = (clients ?? []).map((c) => c.id);
  const fullClientsById = new Map((clients ?? []).map((c) => [c.id, c]));

  // Linked invoices and estimates no longer gate deletability — they're what get
  // snapshotted — but the counts still travel to the UI so the confirmation
  // dialog can say what will happen with real numbers instead of a vague warning.
  // Recurring schedules are the fourth foreign key into `clients` and the only
  // one that keeps *producing* records after the client is gone, so they're
  // counted here and ended below.
  const invoiceCounts = new Map<string, number>();
  const estimateCounts = new Map<string, number>();
  const recurringCounts = new Map<string, number>();

  if (candidateIds.length > 0) {
    const [invoices, estimates, recurring] = await Promise.all([
      supabase.from("invoices").select("client_id").in("client_id", candidateIds),
      supabase.from("estimates").select("client_id").in("client_id", candidateIds),
      supabase
        .from("recurring_invoices")
        .select("client_id")
        .in("client_id", candidateIds)
        .eq("org_id", org.id)
        // Only `active` schedules generate anything (see the cron at
        // /api/cron/recurring, which filters on exactly this). A paused or
        // already-ended schedule produces nothing, so there is nothing to warn
        // about and nothing to stop.
        .eq("status", "active"),
    ]);

    // Fail closed: a failed query here must never be read as "no linked records".
    // `.data` would come back null alongside a populated `.error`, and `?? []`
    // would silently treat that as zero links, understating the confirmation
    // copy. Abort instead; a transient error should cost the user a retry.
    for (const { error } of [invoices, estimates, recurring]) {
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const row of invoices.data ?? []) {
      if (row.client_id) invoiceCounts.set(row.client_id, (invoiceCounts.get(row.client_id) ?? 0) + 1);
    }
    for (const row of estimates.data ?? []) {
      if (row.client_id) estimateCounts.set(row.client_id, (estimateCounts.get(row.client_id) ?? 0) + 1);
    }
    for (const row of recurring.data ?? []) {
      if (row.client_id) recurringCounts.set(row.client_id, (recurringCounts.get(row.client_id) ?? 0) + 1);
    }
  }

  const rows: ClientRow[] = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    linkedInvoices: invoiceCounts.get(c.id) ?? 0,
    linkedEstimates: estimateCounts.get(c.id) ?? 0,
    linkedRecurring: recurringCounts.get(c.id) ?? 0,
  }));

  const partition = partitionClients(rows);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    // Not folded into `reasons`, which is reserved for skips — these clients
    // aren't skipped, so the counts travel under their own `clients` key for
    // the dialog's `describeFor` to build its confirmation copy from.
    return NextResponse.json({ ...result, clients: partition.deletable });
  }

  const deleteIds = partition.deletable.map((c) => c.id);

  // Snapshot before deleting, for every client about to be deleted. Fail closed:
  // if any snapshot write errors, stop before the delete runs. Deleting after a
  // failed snapshot is exactly the data loss this design exists to prevent.
  // Expenses render no billing details, so they need no snapshot — their
  // `client_id` is left to null via ON DELETE SET NULL.
  //
  // Recurring schedules are ended in the same step, and under the same rule. A
  // snapshot cannot save them: they are generators, not documents, and once
  // their `client_id` nulls the cron keeps producing an unsendable clientless
  // draft every period with no signal to the user. `ended` is the schema's own
  // terminal value (`recurring_status` is 'active' | 'paused' | 'ended', and the
  // cron writes 'ended' when a schedule runs past its end date).
  for (const client of partition.deletable) {
    const fullClient = fullClientsById.get(client.id);
    if (!fullClient) {
      // `deleteIds` was computed before this loop, so `continue` would have left
      // this id queued for deletion with nothing saved — the one fail-open path
      // in a route whose entire justification is failing closed. Unreachable
      // today (both collections derive from the same fetch), which is exactly
      // why it must not be left as the odd one out for a future refactor to trip
      // over. Every other failure here returns 500 before the delete; so does this.
      console.error("[bulk] client row missing before snapshot", { id: client.id });
      return NextResponse.json(
        { error: "Could not read the client's details before deleting it" },
        { status: 500 }
      );
    }
    const snapshot = buildClientSnapshot(fullClient);

    const [invSnap, estSnap, recEnded] = await Promise.all([
      supabase.from("invoices").update({ client_snapshot: snapshot }).eq("client_id", client.id).eq("org_id", org.id),
      supabase.from("estimates").update({ client_snapshot: snapshot }).eq("client_id", client.id).eq("org_id", org.id),
      supabase
        .from("recurring_invoices")
        .update({ status: "ended" })
        .eq("client_id", client.id)
        .eq("org_id", org.id)
        .eq("status", "active"),
    ]);

    for (const { error } of [invSnap, estSnap, recEnded]) {
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { error: deleteError } = await supabase
    .from("clients")
    .delete()
    .in("id", deleteIds)
    .eq("org_id", org.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const { error: auditError } = await supabase.from("audit_logs").insert(
    partition.deletable.map((client) => ({
      org_id: org.id,
      user_id: user.id,
      action: "client.deleted",
      entity_type: "client",
      entity_id: client.id,
      meta: {
        name: client.name,
        bulk: true,
        linkedInvoices: client.linkedInvoices,
        linkedEstimates: client.linkedEstimates,
        endedRecurring: client.linkedRecurring,
      },
    }))
  );

  if (auditError) {
    // The clients are already deleted — an audit-log failure must not fail the
    // request, it just costs us the record of who did it.
    console.error("[bulk] audit log write failed", {
      action: "client.deleted",
      ids: deleteIds,
      error: auditError.message,
    });
  }

  return NextResponse.json(result);
}
