import { createClient } from "@/lib/supabase/server";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
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

/**
 * Renders an invoice's PDF bytes and invoice number. Returns `null` if the
 * invoice does not exist. Auth is intentionally NOT checked here — callers
 * (the single-invoice route and the bulk-download route) check it differently,
 * so it belongs in the routes, not this library function.
 */
export async function renderInvoicePdf(
  invoiceId: string
): Promise<{ buffer: Uint8Array; invoiceNumber: string } | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invoiceRaw } = await supabase
    .from("invoices")
    .select("*, clients(*), invoice_items(*)")
    .eq("id", invoiceId)
    .single();

  if (!invoiceRaw) return null;

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

  if (!orgRawObj) return null;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("org_id", orgRawObj.id)
    .single();

  const watermark = subscription?.status === "trialing" ? "TRIAL" : undefined;
  const showInvoyrBranding = !canAccess(await getOrgPlan(orgRawObj.id), "white_label");

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
    showInvoyrBranding,
  });

  const buffer = await renderToBuffer(element);

  return { buffer: new Uint8Array(buffer), invoiceNumber: invoice.invoice_number };
}
