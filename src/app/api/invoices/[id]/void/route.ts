import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrgPermission } from "@/lib/permissions";

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
    .select("id, org_id, status, invoice_number")
    .eq("id", id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permErr = await requireOrgPermission(invoice.org_id, "void_invoice");
  if (permErr) return NextResponse.json({ error: permErr.error }, { status: permErr.status });
  if (["paid", "void"].includes(invoice.status)) {
    return NextResponse.json({ error: "Cannot void a paid or already voided invoice" }, { status: 400 });
  }

  await supabase
    .from("invoices")
    .update({ status: "void", voided_at: new Date().toISOString() })
    .eq("id", id);

  await supabase.from("audit_logs").insert({
    org_id: invoice.org_id,
    action: "invoice.voided",
    entity_type: "invoice",
    entity_id: id,
    meta: { invoice_number: invoice.invoice_number },
  });

  return NextResponse.json({ ok: true });
}
