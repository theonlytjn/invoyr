import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrgPermission } from "@/lib/permissions";
import { dispatchWebhook } from "@/lib/webhooks/dispatch";
import { isVoidable } from "@/lib/bulk-actions";

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
  // Reads the shared rule rather than its own inverse list. These previously
  // disagreed: this route allowed voiding an overdue invoice while the bulk route
  // refused it, so the same invoice behaved differently depending on where you
  // clicked.
  if (!isVoidable(invoice.status)) {
    return NextResponse.json(
      { error: "Only unpaid invoices can be voided. Refund the payment first if it was recorded in error." },
      { status: 400 }
    );
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

  dispatchWebhook(invoice.org_id, "invoice.void", {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
