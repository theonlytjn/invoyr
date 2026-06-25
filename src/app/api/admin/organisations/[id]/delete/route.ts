import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = await createServiceClient();

  await supabase.from("audit_logs").delete().eq("org_id", id);
  await supabase.from("email_logs").delete().eq("org_id", id);
  await supabase.from("subscriptions").delete().eq("org_id", id);
  await supabase.from("payments").delete().eq("org_id", id);
  const { data: invs } = await supabase.from("invoices").select("id").eq("org_id", id);
  if (invs?.length) {
    await supabase.from("invoice_items").delete().in("invoice_id", invs.map((r) => r.id));
  }
  await supabase.from("invoices").delete().eq("org_id", id);
  await supabase.from("clients").delete().eq("org_id", id);
  await supabase.from("org_members").delete().eq("org_id", id);

  const { error } = await supabase.from("organisations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
