import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeTotals } from "@/lib/invoice-totals";
import type { Invoice, InvoiceItem, Client, Organisation } from "@/lib/supabase/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invoiceRaw } = await supabase
    .from("invoices")
    .select("*, clients(*), invoice_items(*)")
    .eq("id", id)
    .single();

  if (!invoiceRaw) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoice = invoiceRaw as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orgRaw } = await supabase
    .from("org_members")
    .select("organisations(*)")
    .eq("user_id", user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orgData = orgRaw as any;
  const org: Organisation | null = Array.isArray(orgData?.organisations)
    ? (orgData.organisations[0] ?? null)
    : (orgData?.organisations ?? null);

  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const items: InvoiceItem[] = Array.isArray(invoice.invoice_items) ? invoice.invoice_items : [];
  const client: Client | null = Array.isArray(invoice.clients)
    ? (invoice.clients[0] ?? null)
    : (invoice.clients ?? null);

  const totals = computeTotals(
    items.map((i) => ({
      description: "",
      quantity: i.quantity,
      unit_price: i.unit_price,
      vat_rate: i.vat_rate,
    }))
  );

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { default: TJNClassicPdf } = await import(
    "@/components/invoice-templates/pdf/TJNClassicPdf"
  );

  const element = TJNClassicPdf({
    invoice: invoice as Invoice,
    items,
    client,
    org,
    totals: { subtotal: totals.subtotal, vatAmount: totals.vat_amount, total: totals.total },
  });

  const buffer = await renderToBuffer(element);
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  });
}
