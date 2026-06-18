import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvoiceWithClient } from "@/lib/supabase/types";

interface AgingBucket {
  label: string;
  invoices: InvoiceWithClient[];
  total: number;
}

interface Props {
  buckets: AgingBucket[];
}

export default function AgingTable({ buckets }: Props) {
  const hasInvoices = buckets.some((b) => b.invoices.length > 0);

  if (!hasInvoices) {
    return <p className="text-sm text-gray-500 py-4 text-center">No overdue invoices.</p>;
  }

  return (
    <div className="space-y-6">
      {buckets.filter((b) => b.invoices.length > 0).map((bucket) => (
        <div key={bucket.label}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">{bucket.label}</h4>
            <span className="text-sm font-semibold text-red-600">{formatCurrency(bucket.total)}</span>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {bucket.invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 px-4">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-gray-900 hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="py-2.5 px-4 text-gray-500">{inv.clients?.name ?? "—"}</td>
                    <td className="py-2.5 px-4 text-gray-500">Due {inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                    <td className="py-2.5 px-4 text-right font-medium text-red-700">{formatCurrency(inv.total, inv.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
