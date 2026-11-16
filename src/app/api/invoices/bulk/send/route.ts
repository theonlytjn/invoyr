import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bulkIdsSchema } from "@/lib/bulk-request";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { orgHasFeature } from "@/lib/billing";
import { sendInvoiceEmail } from "@/lib/invoices/send-invoice-email";

const schema = z.object({ ids: bulkIdsSchema() });

const SENDABLE = ["draft", "issued", "sent"];

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

  const { data: invoices } = await supabase.from("invoices").select("id, status").in("id", ids);
  if (!invoices?.length) return NextResponse.json({ sent: 0, skipped: ids.length });

  const sendable = invoices.filter((invoice) => SENDABLE.includes(invoice.status));
  const results = await Promise.allSettled(
    sendable.map((invoice) => sendInvoiceEmail(supabase, invoice.id, { source: "bulk" }))
  );
  const sent = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;

  return NextResponse.json({ sent, skipped: ids.length - sent });
}
