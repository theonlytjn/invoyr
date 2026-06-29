import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import Topbar from "@/components/shell/Topbar";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import ClientArchiveButton from "@/components/clients/ClientArchiveButton";
import CopyPortalLinkButton from "@/components/clients/CopyPortalLinkButton";
import type { Metadata } from "next";
import type { Client, Invoice, InvoiceWithClient } from "@/lib/supabase/types";

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: "Client" };

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const [clientRes, invoicesRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).eq("org_id", org.id).single(),
    supabase.from("invoices").select("*, clients(name)").eq("client_id", id).order("created_at", { ascending: false }),
  ]);

  const client = clientRes.data as Client | null;
  if (!client) notFound();

  const invoices = (invoicesRes.data ?? []) as InvoiceWithClient[];

  const totalBilled = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total, 0);

  return (
    <div>
      <Topbar
        title={client.name}
        actions={
            <div className="flex items-center gap-2">
            {client.portal_token && (
              <CopyPortalLinkButton portalToken={client.portal_token} />
            )}
            <Link
              href={`/clients/${id}/edit`}
              className="px-3.5 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Edit client
            </Link>
            <ClientArchiveButton clientId={id} archived={client.archived} />
          </div>
        }
      />
      <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Details */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4 h-fit">
          <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-base">Contact details</h3>
          <dl className="space-y-2 text-sm">
            {client.company_name && <div><dt className="text-neutral-500 text-sm">Company</dt><dd className="dark:text-neutral-300">{client.company_name}</dd></div>}
            {client.email && <div><dt className="text-neutral-500 text-sm">Email</dt><dd className="dark:text-neutral-300">{client.email}</dd></div>}
            {client.phone && <div><dt className="text-neutral-500 text-sm">Phone</dt><dd className="dark:text-neutral-300">{client.phone}</dd></div>}
            {client.address_line1 && <div><dt className="text-neutral-500 text-sm">Address</dt><dd className="dark:text-neutral-300">{client.address_line1}, {client.city}</dd></div>}
            {client.vat_number && <div><dt className="text-neutral-500 text-sm">VAT number</dt><dd className="font-mono dark:text-neutral-300">{client.vat_number}</dd></div>}
          </dl>
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-neutral-500">Total billed</p>
              <p className="font-semibold text-neutral-950 dark:text-neutral-50">{formatCurrency(totalBilled)}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total paid</p>
              <p className="font-semibold text-green-700 dark:text-green-400">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
          {client.notes && (
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-sm text-neutral-500 mb-1">Notes</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Invoice history */}
        <div className="xl:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-base">Invoice history</h3>
            <Link
              href={`/invoices/new?client=${id}`}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50"
            >
              + New invoice
            </Link>
          </div>
          {!invoices.length ? (
            <p className="text-center py-10 text-sm text-neutral-500">No invoices for this client.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 dark:border-neutral-800">
                <tr>
                  <th className="text-left py-3 px-5 text-xs text-neutral-500 font-medium uppercase tracking-wide">Invoice</th>
                  <th className="text-left py-3 px-4 text-xs text-neutral-500 font-medium uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs text-neutral-500 font-medium uppercase tracking-wide">Date</th>
                  <th className="text-right py-3 px-5 text-xs text-neutral-500 font-medium uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="py-3 px-5">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-neutral-950 dark:text-neutral-50 hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4"><InvoiceStatusBadge status={inv.status} /></td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{formatDate(inv.issue_date)}</td>
                    <td className="py-3 px-5 text-right font-medium dark:text-neutral-50">{formatCurrency(inv.total, inv.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
