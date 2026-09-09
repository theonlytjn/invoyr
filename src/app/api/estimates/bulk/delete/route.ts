import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bulkIdsSchema } from "@/lib/bulk-request";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { partitionEstimates, summarise } from "@/lib/bulk-actions";

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

  const { data: estimates, error: fetchError } = await supabase
    .from("estimates")
    .select("id, estimate_number, converted_invoice_id")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const partition = partitionEstimates(estimates ?? []);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const deleteIds = partition.deletable.map((e) => e.id);

  // estimate_items cascade on delete.
  const { error: deleteError } = await supabase
    .from("estimates")
    .delete()
    .in("id", deleteIds)
    .eq("org_id", org.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const { error: auditError } = await supabase.from("audit_logs").insert(
    partition.deletable.map((est) => ({
      org_id: org.id,
      user_id: user.id,
      action: "estimate.deleted",
      entity_type: "estimate",
      entity_id: est.id,
      meta: { estimate_number: est.estimate_number, bulk: true },
    }))
  );

  if (auditError) {
    console.error("[bulk] audit log write failed", {
      action: "estimate.deleted",
      ids: deleteIds,
      error: auditError.message,
    });
  }

  return NextResponse.json(result);
}
