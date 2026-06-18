import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, status, org_id")
    .eq("id", id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status !== "draft") {
    return NextResponse.json({ error: "Only draft invoices can be issued" }, { status: 400 });
  }

  await supabase
    .from("invoices")
    .update({ status: "issued" })
    .eq("id", id);

  await supabase.from("audit_logs").insert({
    org_id: invoice.org_id,
    action: "invoice.issued",
    entity_type: "invoice",
    entity_id: id,
    meta: {},
  });

  return NextResponse.json({ ok: true });
}
