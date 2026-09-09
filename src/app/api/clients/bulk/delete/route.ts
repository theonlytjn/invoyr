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
  const invoiceCounts = new Map<string, number>();
  const estimateCounts = new Map<string, number>();

  if (candidateIds.length > 0) {
    const [invoices, estimates] = await Promise.all([
      supabase.from("invoices").select("client_id").in("client_id", candidateIds),
      supabase.from("estimates").select("client_id").in("client_id", candidateIds),
    ]);

    // Fail closed: a failed query here must never be read as "no linked records".
    // `.data` would come back null alongside a populated `.error`, and `?? []`
    // would silently treat that as zero links, understating the confirmation
    // copy. Abort instead; a transient error should cost the user a retry.
    for (const { error } of [invoices, estimates]) {
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const row of invoices.data ?? []) {
      if (row.client_id) invoiceCounts.set(row.client_id, (invoiceCounts.get(row.client_id) ?? 0) + 1);
    }
    for (const row of estimates.data ?? []) {
      if (row.client_id) estimateCounts.set(row.client_id, (estimateCounts.get(row.client_id) ?? 0) + 1);
    }
  }

  const rows: ClientRow[] = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    linkedInvoices: invoiceCounts.get(c.id) ?? 0,
    linkedEstimates: estimateCounts.get(c.id) ?? 0,
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
  for (const client of partition.deletable) {
    const fullClient = fullClientsById.get(client.id);
    if (!fullClient) continue;
    const snapshot = buildClientSnapshot(fullClient);

    const [invSnap, estSnap] = await Promise.all([
      supabase.from("invoices").update({ client_snapshot: snapshot }).eq("client_id", client.id).eq("org_id", org.id),
      supabase.from("estimates").update({ client_snapshot: snapshot }).eq("client_id", client.id).eq("org_id", org.id),
    ]);

    for (const { error } of [invSnap, estSnap]) {
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
