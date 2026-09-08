import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bulkIdsSchema } from "@/lib/bulk-request";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { partitionClients, summarise, type ClientRow } from "@/lib/bulk-actions";

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

  const { data: clients, error: fetchError } = await supabase
    .from("clients")
    .select("id, name")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const candidateIds = (clients ?? []).map((c) => c.id);

  // invoices, estimates and expenses all reference clients with ON DELETE SET NULL,
  // so deleting a referenced client would silently orphan its history.
  const linked = new Set<string>();
  if (candidateIds.length > 0) {
    const [invoices, estimates, expenses] = await Promise.all([
      supabase.from("invoices").select("client_id").in("client_id", candidateIds),
      supabase.from("estimates").select("client_id").in("client_id", candidateIds),
      supabase.from("expenses").select("client_id").in("client_id", candidateIds),
    ]);

    // Fail closed: a failed query here must never be read as "no linked records".
    // `.data` would come back null alongside a populated `.error`, and `set ?? []`
    // would silently treat that as zero links — marking a linked client deletable
    // and permanently detaching its history. Abort instead; a transient error
    // should cost the user a retry, never an irreversible deletion.
    for (const { error } of [invoices, estimates, expenses]) {
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const set of [invoices.data, estimates.data, expenses.data]) {
      for (const row of set ?? []) {
        if (row.client_id) linked.add(row.client_id as string);
      }
    }
  }

  const rows: ClientRow[] = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    hasLinkedRecords: linked.has(c.id),
  }));

  const partition = partitionClients(rows);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const deleteIds = partition.deletable.map((c) => c.id);

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
      meta: { name: client.name, bulk: true },
    }))
  );

  if (auditError) {
    console.error("[bulk] audit log write failed", {
      action: "client.deleted",
      ids: deleteIds,
      error: auditError.message,
    });
  }

  return NextResponse.json(result);
}
