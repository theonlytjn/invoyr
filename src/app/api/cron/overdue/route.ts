import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: overdueInvoices } = await supabase
    .from("invoices")
    .select("id, org_id, invoice_number")
    .in("status", ["sent", "issued"])
    .lt("due_date", today);

  if (!overdueInvoices?.length) {
    return NextResponse.json({ updated: 0 });
  }

  const ids = overdueInvoices.map((i) => i.id);
  await supabase.from("invoices").update({ status: "overdue" }).in("id", ids);

  await supabase.from("audit_logs").insert(
    overdueInvoices.map((inv) => ({
      org_id: inv.org_id,
      action: "invoice.overdue",
      entity_type: "invoice",
      entity_id: inv.id,
      meta: { invoice_number: inv.invoice_number },
    }))
  );

  return NextResponse.json({ updated: ids.length });
}
