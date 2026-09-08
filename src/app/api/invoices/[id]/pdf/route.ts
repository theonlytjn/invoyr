import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { buildInvoicePdfContext, renderInvoicePdf } from "@/lib/invoice-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // requireOrg() resolves the *active* org from the cookie. renderInvoicePdf used
  // to derive the org itself from `org_members ... .single()`, which threw for a
  // user belonging to more than one org and made every render return null.
  const org = await requireOrg();
  const ctx = await buildInvoicePdfContext(supabase, org);

  const rendered = await renderInvoicePdf(id, ctx);
  if (!rendered) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(Buffer.from(rendered.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${rendered.invoiceNumber}.pdf"`,
    },
  });
}
