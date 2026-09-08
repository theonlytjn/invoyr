import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rendered = await renderInvoicePdf(id);
  if (!rendered) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(Buffer.from(rendered.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${rendered.invoiceNumber}.pdf"`,
    },
  });
}
