import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bulkIdsSchema } from "@/lib/bulk-request";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { orgHasFeature } from "@/lib/billing";
import { isVoidable } from "@/lib/bulk-actions";

const schema = z.object({ ids: bulkIdsSchema() });


export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();
  if (!(await orgHasFeature(org.id, "bulk_invoice_actions"))) {
    return NextResponse.json({ error: "Bulk actions require the Business plan." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids } = parsed.data;

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, status, invoice_number, org_id")
    .in("id", ids)
    .eq("org_id", org.id);

  const voidable = (invoices ?? []).filter((i) => isVoidable(i.status));
  if (!voidable.length) return NextResponse.json({ voided: 0, skipped: ids.length });

  const voidIds = voidable.map((i) => i.id);

  await supabase
    .from("invoices")
    .update({ status: "void", voided_at: new Date().toISOString() })
    .in("id", voidIds);

  await supabase.from("audit_logs").insert(
    voidable.map((inv) => ({
      org_id: org.id,
      action: "invoice.voided",
      entity_type: "invoice",
      entity_id: inv.id,
      meta: { invoice_number: inv.invoice_number, bulk: true },
    }))
  );

  return NextResponse.json({ voided: voidable.length, skipped: ids.length - voidable.length });
}
