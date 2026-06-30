import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeTotals } from "@/lib/invoice-totals";
import type { Invoice, InvoiceItem, Client, Organisation } from "@/lib/supabase/types";

async function fetchLogoAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const mime = res.headers.get("content-type") ?? "image/png";
    return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

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
  const orgRawObj: Organisation | null = Array.isArray(orgData?.organisations)
    ? (orgData.organisations[0] ?? null)
    : (orgData?.organisations ?? null);

  if (!orgRawObj) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("org_id", orgRawObj.id)
    .single();

  const watermark = subscription?.status === "trialing" ? "TRIAL" : undefined;

  const logoRawUrl = orgRawObj.logo_url ? orgRawObj.logo_url.split("?")[0] : null;
  const logoDataUrl = logoRawUrl ? await fetchLogoAsDataUrl(logoRawUrl) : null;

  const org: Organisation & { logoDataUrl?: string | null } = {
    ...orgRawObj,
    logo_url: logoRawUrl,
    logoDataUrl,
  };

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
    })),
    (invoice as Invoice & { discount?: number }).discount ?? 0
  );

  const templateName: string = invoice.template ?? "tjn_classic";

  const { renderToBuffer } = await import("@react-pdf/renderer");

  let pdfModule;
  switch (templateName) {
    case "clean_minimal":
      pdfModule = await import("@/components/invoice-templates/pdf/CleanMinimalPdf");
      break;
    case "bold_split":
      pdfModule = await import("@/components/invoice-templates/pdf/BoldSplitPdf");
      break;
    case "modern_studio":
      pdfModule = await import("@/components/invoice-templates/pdf/ModernStudioPdf");
      break;
    default:
      pdfModule = await import("@/components/invoice-templates/pdf/TJNClassicPdf");
  }

  const PdfTemplate = pdfModule.default;

  const element = PdfTemplate({
    invoice: invoice as Invoice,
    items,
    client,
    org,
    totals: { subtotal: totals.subtotal, vatAmount: totals.vat_amount, discount: totals.discount, total: totals.total, lateFeeAmount: (invoice as Invoice & { late_fee_amount?: number }).late_fee_amount ?? 0 },
    watermark,
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
