import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { computeTotals } from "@/lib/invoice-totals";
import { formatCurrency, formatDate } from "@/lib/utils";
import Topbar from "@/components/shell/Topbar";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import InvoiceActions from "@/components/invoices/InvoiceActions";
import CopyPaymentLink from "@/components/invoices/CopyPaymentLink";
import { TEMPLATE_MAP } from "@/components/invoice-templates";
import type { Metadata } from "next";
import type { Invoice, InvoiceItem, Client } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Invoice ${id.slice(0, 8)}` };
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data } = await supabase
    .from("invoices")
    .select("*, clients(*), invoice_items(*)")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!data) notFound();

  const invoice = data as unknown as Invoice & {
    invoice_items: InvoiceItem[];
    clients: Client | Client[] | null;
  };

  const items: InvoiceItem[] = invoice.invoice_items ?? [];
  const client: Client | null = Array.isArray(invoice.clients)
    ? (invoice.clients[0] ?? null)
    : invoice.clients ?? null;

  const totals = computeTotals(
    items.map((i) => ({
      description: "",
      quantity: i.quantity,
      unit_price: i.unit_price,
      vat_rate: i.vat_rate,
    }))
  );

  const Template = TEMPLATE_MAP[invoice.template] ?? TEMPLATE_MAP.tjn_classic;

  return (
    <div>
      <Topbar
        title={invoice.invoice_number}
        actions={
          <div className="flex items-center gap-3">
            <InvoiceStatusBadge status={invoice.status} />
            <Link
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              className="px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Download PDF
            </Link>
            <InvoiceActions invoice={invoice} />
          </div>
        }
      />

      <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 overflow-auto border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4">
          <div style={{ transform: "scale(0.8)", transformOrigin: "top left", width: "794px" }}>
            <Template
              invoice={invoice}
              items={items}
              client={client}
              org={org}
              totals={{ subtotal: totals.subtotal, vatAmount: totals.vat_amount, total: totals.total }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
            <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-sm">Invoice summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Status</dt>
                <dd><InvoiceStatusBadge status={invoice.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Issued</dt>
                <dd className="text-neutral-950 dark:text-neutral-50">{formatDate(invoice.issue_date)}</dd>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Due</dt>
                  <dd className="text-neutral-950 dark:text-neutral-50">{formatDate(invoice.due_date)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd className="dark:text-neutral-50">{formatCurrency(invoice.subtotal, invoice.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">VAT</dt>
                <dd className="dark:text-neutral-50">{formatCurrency(invoice.vat_amount, invoice.currency)}</dd>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <dt className="dark:text-neutral-50">Total</dt>
                <dd className="dark:text-neutral-50">{formatCurrency(invoice.total, invoice.currency)}</dd>
              </div>
              {invoice.amount_paid > 0 && (
                <div className="flex justify-between text-green-700 dark:text-green-400">
                  <dt>Paid</dt>
                  <dd>{formatCurrency(invoice.amount_paid, invoice.currency)}</dd>
                </div>
              )}
            </dl>
          </div>

          {invoice.public_token && invoice.status !== "void" && (
            <CopyPaymentLink url={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io"}/pay/${invoice.public_token}`} />
          )}

          {client && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-2">
              <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-sm">Client</h3>
              <div className="text-sm">
                <p className="font-medium text-neutral-950 dark:text-neutral-50">{client.name}</p>
                {client.company_name && <p className="text-neutral-500 dark:text-neutral-400">{client.company_name}</p>}
                {client.email && <p className="text-neutral-500 dark:text-neutral-400">{client.email}</p>}
              </div>
              <Link href={`/clients/${client.id}`} className="text-xs text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50">
                View client →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
