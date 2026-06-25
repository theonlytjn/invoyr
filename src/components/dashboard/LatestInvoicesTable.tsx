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
        <p className="text-[#737373] text-sm">No invoices yet.</p>
        <Link
          href="/invoices/new"
          className="mt-3 inline-block text-sm font-medium text-[#0a0a0a] underline"
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
          <tr className="border-b border-[#e5e5e5]">
            <th className="text-left py-3 px-5 text-[11px] font-medium text-[#737373] uppercase tracking-wider">Invoice</th>
            <th className="text-left py-3 px-5 text-[11px] font-medium text-[#737373] uppercase tracking-wider">Client</th>
            <th className="text-left py-3 px-5 text-[11px] font-medium text-[#737373] uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-5 text-[11px] font-medium text-[#737373] uppercase tracking-wider">Due</th>
            <th className="text-right py-3 px-5 text-[11px] font-medium text-[#737373] uppercase tracking-wider">Amount</th>
            <th className="py-3 px-5" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors">
              <td className="py-3 px-5">
                <Link href={`/invoices/${invoice.id}`} className="font-medium text-[#0a0a0a] hover:underline">
                  {invoice.invoice_number}
                </Link>
              </td>
              <td className="py-3 px-5 text-[#737373]">
                {invoice.clients?.name ?? <span className="text-[#a3a3a3] italic">No client</span>}
              </td>
              <td className="py-3 px-5">
                <InvoiceStatusBadge status={invoice.status} />
              </td>
              <td className="py-3 px-5 text-[#737373]">
                {invoice.due_date ? formatDate(invoice.due_date) : "—"}
              </td>
              <td className="py-3 px-5 text-right font-medium text-[#0a0a0a]">
                {formatCurrency(invoice.total, invoice.currency)}
              </td>
              <td className="py-3 px-5 text-right">
                <Link href={`/invoices/${invoice.id}`} className="text-xs text-[#a3a3a3] hover:text-[#0a0a0a]">
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
