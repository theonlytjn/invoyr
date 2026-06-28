import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: estimate } = await supabase
    .from("estimates")
    .select("id, org_id, estimate_number, status, public_token")
    .eq("id", id)
    .single();

  if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!["sent", "draft"].includes(estimate.status)) {
    return NextResponse.json({ error: "Estimate cannot be approved in its current state" }, { status: 400 });
  }

  await supabase
    .from("estimates")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", id);

  await supabase.from("audit_logs").insert({
    org_id: estimate.org_id,
    action: "estimate.approved",
    entity_type: "estimate",
    entity_id: id,
    meta: { estimate_number: estimate.estimate_number },
  });

  return NextResponse.json({ ok: true });
}
