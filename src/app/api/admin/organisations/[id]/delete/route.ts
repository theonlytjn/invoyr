import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createServiceClient();

  // Delete members first to unblock user accounts, then cascade org data
  await supabase.from("audit_logs").delete().eq("org_id", id);
  await supabase.from("email_logs").delete().eq("org_id", id);
  await supabase.from("subscriptions").delete().eq("org_id", id);
  await supabase.from("payments").delete().eq("org_id", id);
  await supabase.from("invoice_items").delete().in(
    "invoice_id",
    (await supabase.from("invoices").select("id").eq("org_id", id)).data?.map((r) => r.id) ?? []
  );
  await supabase.from("invoices").delete().eq("org_id", id);
  await supabase.from("clients").delete().eq("org_id", id);
  await supabase.from("org_members").delete().eq("org_id", id);

  const { error } = await supabase.from("organisations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
