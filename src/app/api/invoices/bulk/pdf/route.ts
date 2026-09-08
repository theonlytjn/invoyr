import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { orgHasFeature } from "@/lib/billing";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

const schema = z.object({ ids: z.array(z.string().uuid()).min(1).max(50) });

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

  // Scope to the org before rendering anything.
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id")
    .in("id", parsed.data.ids)
    .eq("org_id", org.id);

  if (!invoices?.length) {
    return NextResponse.json({ error: "No invoices found" }, { status: 404 });
  }

  const zip = new JSZip();

  // Sequential: rendering many PDFs concurrently is memory-hungry on a serverless function.
  for (const { id } of invoices) {
    const rendered = await renderInvoicePdf(id);
    if (rendered) zip.file(`invoice-${rendered.invoiceNumber}.pdf`, rendered.buffer);
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
