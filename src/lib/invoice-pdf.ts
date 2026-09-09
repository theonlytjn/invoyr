import { createClient } from "@/lib/supabase/server";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
import { computeTotals } from "@/lib/invoice-totals";
import { resolveDocumentClient } from "@/lib/client-snapshot";
import type { Invoice, InvoiceItem, Client, Organisation } from "@/lib/supabase/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
 * Everything a render needs that does not vary between invoices of the same org:
 * the client, the org (already resolved by the caller), the trial watermark, the
 * branding flag and the logo, fetched over the network once.
 */
export type InvoicePdfContext = {
  supabase: SupabaseServerClient;
  /** The org whose branding the PDF carries. Also scopes the invoice lookup. */
  org: Organisation & { logoDataUrl?: string | null };
  watermark?: string;
  showInvoyrBranding: boolean;
};

/**
 * Builds the context above. Call once per request, never once per invoice: the
 * subscription lookup, the plan lookup and the outbound fetch of the logo are
 * identical for every invoice in a batch, and repeating them up to N times before
 * any rendering starts is pure latency.
 *
 * The org must be supplied by the caller — resolved by `requireOrg()`, which
 * honours the active-org cookie. Deriving it here from `org_members ... .single()`
 * threw for any user belonging to two orgs, which made every render return null.
 */
export async function buildInvoicePdfContext(
  supabase: SupabaseServerClient,
  org: Organisation
): Promise<InvoicePdfContext> {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("org_id", org.id)
    .single();

  const watermark = subscription?.status === "trialing" ? "TRIAL" : undefined;
  const showInvoyrBranding = !canAccess(await getOrgPlan(org.id), "white_label");

  const logoRawUrl = org.logo_url ? org.logo_url.split("?")[0] : null;
  const logoDataUrl = logoRawUrl ? await fetchLogoAsDataUrl(logoRawUrl) : null;

  return {
    supabase,
    org: { ...org, logo_url: logoRawUrl, logoDataUrl },
    watermark,
    showInvoyrBranding,
  };
}

/**
 * Renders an invoice's PDF bytes and invoice number. Returns `null` if the
 * invoice does not exist in the context's org. Auth is intentionally NOT checked
 * here — callers (the single-invoice route and the bulk-download route) check it
 * differently, so it belongs in the routes, not this library function.
 */
export async function renderInvoicePdf(
  invoiceId: string,
  ctx: InvoicePdfContext
): Promise<{ buffer: Uint8Array; invoiceNumber: string } | null> {
  const { supabase, org, watermark, showInvoyrBranding } = ctx;

  const { data: invoiceRaw } = await supabase
    .from("invoices")
    .select("*, clients(*), invoice_items(*), client_snapshot")
    .eq("id", invoiceId)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!invoiceRaw) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoice = invoiceRaw as any;

  const items: InvoiceItem[] = Array.isArray(invoice.invoice_items) ? invoice.invoice_items : [];
  // Live join wins when the client still exists; falls back to the snapshot
  // taken at delete-time otherwise. `Client` carries `id` and a few other
  // columns ClientSnapshot deliberately omits; all four PDF templates were read
  // field by field and none of them touches one, so the cast is sound today —
  // but it is a double cast through `unknown`, so it will not stop a future
  // template edit that starts reading `client.id`.
  const client = resolveDocumentClient(invoice) as unknown as Client | null;

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
