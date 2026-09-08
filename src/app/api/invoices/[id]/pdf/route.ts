import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrg } from "@/lib/auth";
import { buildInvoicePdfContext, renderInvoicePdf } from "@/lib/invoice-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // getOrg(), not requireOrg(): this is an API endpoint, opened directly via
  // window.open, so an org-less user must get a JSON error rather than a 307 to
  // /onboarding. It still resolves the *active* org from the cookie —
  // renderInvoicePdf used to derive the org itself from `org_members ... .single()`,
  // which threw for a user belonging to more than one org and made every render
  // return null.
  const org = await getOrg();
  if (!org) return NextResponse.json({ error: "No organisation" }, { status: 404 });

  // Confirm the invoice exists in this org before building the context: that
  // context fetches the org logo over the network, which a 404 should not pay for.
  const { data: exists } = await supabase
    .from("invoices")
    .select("id")
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
