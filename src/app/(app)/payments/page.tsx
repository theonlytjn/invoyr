import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import Topbar from "@/components/shell/Topbar";
import type { Metadata } from "next";
import type { PaymentWithInvoice } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Payments" };

const METHOD_LABELS: Record<string, string> = {
  stripe: "Stripe",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  cheque: "Cheque",
  other: "Other",
};

export default async function PaymentsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data } = await supabase
    .from("payments")
    .select("*, invoices(invoice_number, clients(name))")
    .eq("org_id", org.id)
    .order("paid_at", { ascending: false });

  const payments = (data ?? []) as unknown as PaymentWithInvoice[];
  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <Topbar title="Payments" />
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 w-fit">
          <p className="text-sm text-gray-500">Total collected</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(total)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!payments.length ? (
            <p className="text-center py-12 text-sm text-gray-500">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-5 text-xs text-gray-500 font-medium uppercase tracking-wide">Invoice</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wide">Client</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wide">Method</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium uppercase tracking-wide">Date</th>
                  <th className="text-right py-3 px-5 text-xs text-gray-500 font-medium uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-5 font-medium text-gray-900">{payment.invoices?.invoice_number ?? "—"}</td>
                    <td className="py-3 px-4 text-gray-600">{payment.invoices?.clients?.name ?? "—"}</td>
                    <td className="py-3 px-4 text-gray-600">{METHOD_LABELS[payment.method] ?? payment.method}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(payment.paid_at)}</td>
                    <td className="py-3 px-5 text-right font-medium text-green-700">{formatCurrency(payment.amount, payment.currency)}</td>
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
