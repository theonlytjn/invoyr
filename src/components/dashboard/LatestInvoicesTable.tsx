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
        <p className="text-gray-500 text-sm">No invoices yet.</p>
        <Link
          href="/invoices/new"
          className="mt-3 inline-block text-sm font-medium text-gray-900 underline"
        >
          Create your first invoice
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Due date</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <Link href={`/invoices/${invoice.id}`} className="font-medium text-gray-900 hover:underline">
                  {invoice.invoice_number}
                </Link>
              </td>
              <td className="py-3 px-4 text-gray-600">
                {invoice.clients?.name ?? <span className="text-gray-400 italic">No client</span>}
              </td>
              <td className="py-3 px-4">
                <InvoiceStatusBadge status={invoice.status} />
              </td>
              <td className="py-3 px-4 text-gray-600">
                {invoice.due_date ? formatDate(invoice.due_date) : "—"}
              </td>
              <td className="py-3 px-4 text-right font-medium text-gray-900">
                {formatCurrency(invoice.total, invoice.currency)}
              </td>
              <td className="py-3 px-4 text-right">
                <Link href={`/invoices/${invoice.id}`} className="text-xs text-gray-400 hover:text-gray-900">
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
