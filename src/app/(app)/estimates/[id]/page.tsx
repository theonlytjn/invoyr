import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { computeTotals } from "@/lib/invoice-totals";
import Topbar from "@/components/shell/Topbar";
import EstimateStatusBadge from "@/components/estimates/EstimateStatusBadge";
import EstimateActions from "@/components/estimates/EstimateActions";
import { TEMPLATE_MAP } from "@/components/invoice-templates";
import type { Metadata } from "next";
import type { Estimate, EstimateItem, Client, Invoice, InvoiceItem } from "@/lib/supabase/types";

const ACTION_LABELS: Record<string, string> = {
  "estimate.created":  "Estimate created",
  "estimate.sent":     "Sent to client",
  "estimate.approved": "Approved by client",
  "estimate.rejected": "Declined by client",
  "estimate.converted":"Converted to invoice",
};

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Estimate ${id.slice(0, 8)}` };
}

export default async function EstimateDetailPage({ params }: Props) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const [{ data }, { data: auditLogs }] = await Promise.all([
    supabase
      .from("estimates")
      .select("*, clients(*), estimate_items(*)")
      .eq("id", id)
      .eq("org_id", org.id)
      .single(),
    supabase
      .from("audit_logs")
      .select("action, created_at, meta")
      .eq("org_id", org.id)
      .eq("entity_type", "estimate")
      .eq("entity_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!data) notFound();

  const estimate = data as unknown as Estimate & {
    estimate_items: EstimateItem[];
    clients: Client | Client[] | null;
  };

  const items: EstimateItem[] = estimate.estimate_items ?? [];
  const client: Client | null = Array.isArray(estimate.clients)
    ? (estimate.clients[0] ?? null)
    : estimate.clients ?? null;

  const totals = computeTotals(
    items.map((i) => ({ description: "", quantity: i.quantity, unit_price: i.unit_price, vat_rate: i.vat_rate }))
  );

  const Template = TEMPLATE_MAP[estimate.template] ?? TEMPLATE_MAP.tjn_classic;

  const previewInvoice: Invoice = {
    id: estimate.id,
    org_id: estimate.org_id,
    client_id: estimate.client_id,
    invoice_number: estimate.estimate_number,
    status: "draft",
    template: estimate.template,
    issue_date: estimate.issue_date,
    due_date: estimate.expiry_date,
    currency: estimate.currency,
    po_number: estimate.po_number,
    subtotal: estimate.subtotal,
    discount: estimate.discount,
    vat_amount: estimate.vat_amount,
    total: estimate.total,
    amount_paid: 0,
    notes: estimate.notes,
    terms: estimate.terms,
    stripe_payment_link: null,
    public_token: estimate.public_token,
    sent_at: estimate.sent_at,
    paid_at: null,
    voided_at: null,
    late_fee_amount: 0,
    late_fee_applied_at: null,
    created_at: estimate.created_at,
    updated_at: estimate.updated_at,
  };

  const previewItems: InvoiceItem[] = items.map((item, idx) => ({
    id: item.id,
    invoice_id: estimate.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    vat_rate: item.vat_rate,
    line_total: item.line_total,
    sort_order: item.sort_order,
  }));

  return (
    <div>
      <Topbar
        title={estimate.estimate_number}
        actions={
          <div className="flex items-center gap-3">
            <EstimateStatusBadge status={estimate.status} />
            <EstimateActions estimate={estimate} />
          </div>
        }
      />

      <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 overflow-auto border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
          <div style={{ transform: "scale(0.8)", transformOrigin: "top left", width: "794px" }}>
            <Template
              invoice={previewInvoice}
              items={previewItems}
              client={client}
              org={org}
              totals={{ subtotal: totals.subtotal, vatAmount: totals.vat_amount, discount: totals.discount, total: totals.total }}
              documentType="estimate"
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
            <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-base">Estimate summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Status</dt>
                <dd><EstimateStatusBadge status={estimate.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Issued</dt>
                <dd className="text-neutral-950 dark:text-neutral-50">{formatDate(estimate.issue_date)}</dd>
              </div>
              {estimate.expiry_date && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Expires</dt>
                  <dd className="text-neutral-950 dark:text-neutral-50">{formatDate(estimate.expiry_date)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd className="dark:text-neutral-50">{formatCurrency(estimate.subtotal, estimate.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">VAT</dt>
                <dd className="dark:text-neutral-50">{formatCurrency(estimate.vat_amount, estimate.currency)}</dd>
              </div>
              {estimate.discount > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <dt>Discount</dt>
                  <dd>−{formatCurrency(estimate.discount, estimate.currency)}</dd>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <dt className="dark:text-neutral-50">Total</dt>
                <dd className="dark:text-neutral-50">{formatCurrency(estimate.total, estimate.currency)}</dd>
              </div>
            </dl>
          </div>

          {/* Converted invoice link */}
          {estimate.status === "converted" && estimate.converted_invoice_id && (
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl p-4">
              <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">Converted to invoice</p>
              <Link href={`/invoices/${estimate.converted_invoice_id}`} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                View invoice →
              </Link>
            </div>
          )}

          {/* Client */}
          {client && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-2">
              <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-base">Client</h3>
              <div className="text-sm">
                <p className="font-medium text-neutral-950 dark:text-neutral-50">{client.name}</p>
                {client.company_name && <p className="text-neutral-500 dark:text-neutral-400">{client.company_name}</p>}
                {client.email && <p className="text-neutral-500 dark:text-neutral-400">{client.email}</p>}
              </div>
              <Link href={`/clients/${client.id}`} className="text-sm text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50">
                View client →
              </Link>
            </div>
          )}

          {/* History */}
          {auditLogs && auditLogs.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
              <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-base mb-4">History</h3>
              <ol className="relative border-l border-neutral-200 dark:border-neutral-700 space-y-4 ml-1">
                {auditLogs.map((log, i) => (
                  <li key={i} className="pl-4">
                    <span className={`absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white dark:border-neutral-900 ${log.action === "estimate.approved" ? "bg-green-400" : log.action === "estimate.rejected" ? "bg-red-400" : "bg-neutral-300 dark:bg-neutral-600"}`} />
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </p>
                    <time className="text-xs text-neutral-400 dark:text-neutral-500">
                      {new Date(log.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
