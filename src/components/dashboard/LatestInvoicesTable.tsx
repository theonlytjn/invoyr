import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import type { InvoiceWithClient } from "@/lib/supabase/types";

interface Props {
  invoices: InvoiceWithClient[];
}

export default function LatestInvoicesTable({ invoices }: Props) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-neutral-500 text-sm">No invoices yet.</p>
        <Link
          href="/invoices/new"
          className="mt-3 inline-block text-sm font-medium text-neutral-950 underline"
        >
          Create your first invoice
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-[0.5px] border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
            <th className="text-left py-3 px-5 text-xs font-medium text-neutral-500">Invoice</th>
            <th className="text-left py-3 px-5 text-xs font-medium text-neutral-500">Client</th>
            <th className="text-left py-3 px-5 text-xs font-medium text-neutral-500">Status</th>
            <th className="text-left py-3 px-5 text-xs font-medium text-neutral-500">Due</th>
            <th className="text-right py-3 px-5 text-xs font-medium text-neutral-500">Amount</th>
            <th className="py-3 px-5" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b-[0.5px] border-neutral-200 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <td className="py-4 px-5">
                <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-neutral-950 dark:text-neutral-50 hover:underline">
                  {invoice.invoice_number}
                </Link>
              </td>
              <td className="py-4 px-5 text-sm text-neutral-500 dark:text-neutral-400">
                {invoice.clients?.name ?? <span className="text-neutral-400 italic">No client</span>}
              </td>
              <td className="py-4 px-5">
                <InvoiceStatusBadge status={invoice.status} />
              </td>
              <td className="py-4 px-5 text-sm text-neutral-500 dark:text-neutral-400">
                {invoice.due_date ? formatDate(invoice.due_date) : "—"}
              </td>
              <td className="py-4 px-5 text-right text-sm font-medium text-neutral-950 dark:text-neutral-50">
                {formatCurrency(invoice.total, invoice.currency)}
              </td>
              <td className="py-4 px-5 text-right">
                <Link href={`/invoices/${invoice.id}`} className="text-xs text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50">
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
