import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bulkIdsSchema } from "@/lib/bulk-request";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { orgHasFeature } from "@/lib/billing";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

const schema = z.object({ ids: bulkIdsSchema() });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  // Gated: rendering up to 50 PDFs is real compute. Same gate as bulk send and void.
  if (!(await orgHasFeature(org.id, "bulk_invoice_actions"))) {
    return NextResponse.json({ error: "Bulk actions require the Business plan." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // `bulkIdsSchema` has already deduped: a repeated id must not be rendered twice
  // or produce a duplicate zip entry.
  const { ids } = parsed.data;

  // Scope to the org before rendering anything.
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id")
    .in("id", ids)
    .eq("org_id", org.id);

  if (!invoices?.length) {
    return NextResponse.json({ error: "No invoices found" }, { status: 404 });
  }

  const zip = new JSZip();
  let succeeded = 0;

  // Sequential: rendering many PDFs concurrently is memory-hungry on a serverless function.
  // Each render is isolated in its own try/catch so one bad invoice (e.g. a malformed row
  // that crashes the PDF renderer) doesn't take down the whole batch with a 500 — we skip
  // it and keep going, same failure shape as bulk reminders/duplicate.
  for (const { id } of invoices) {
    try {
      const rendered = await renderInvoicePdf(id);
      if (rendered) {
        zip.file(`invoice-${rendered.invoiceNumber}.pdf`, rendered.buffer);
        succeeded++;
      }
    } catch (err) {
      console.error(`bulk pdf: failed to render invoice ${id}`, err);
    }
  }

  if (succeeded === 0) {
    return NextResponse.json({ error: "Failed to render any invoices" }, { status: 500 });
  }

  const archive = await zip.generateAsync({ type: "uint8array" });
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(Buffer.from(archive), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="invoices-${stamp}.zip"`,
    },
  });
}
