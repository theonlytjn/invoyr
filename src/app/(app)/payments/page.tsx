import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import Topbar from "@/components/shell/Topbar";
import PaymentsFilter from "@/components/payments/PaymentsFilter";
import PaymentRefundButton from "@/components/payments/PaymentRefundButton";
import MetricCard from "@/components/dashboard/MetricCard";
import type { Metadata } from "next";
import type { PaymentWithInvoice } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Payments" };

const METHOD_LABELS: Record<string, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  cheque: "Cheque",
  other: "Other",
};

function getDateRange(period: string | undefined): { from?: string; to?: string } {
  const now = new Date();
  switch (period) {
    case "this_month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { from };
    }
    case "last_month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { from, to };
    }
    case "last_3_months": {
      const from = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      return { from };
    }
    case "this_year": {
      const from = new Date(now.getFullYear(), 0, 1).toISOString();
      return { from };
    }
    default:
      return {};
  }
}

const PERIOD_LABELS: Record<string, string> = {
  this_month: "This month",
  last_month: "Last month",
  last_3_months: "Last 3 months",
  this_year: "This year",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

export default async function PaymentsPage({ searchParams }: Props) {
  const { period, from: fromParam, to: toParam } = await searchParams;
  const org = await requireOrg();
  const supabase = await createClient();

  const isCustom = !!(fromParam || toParam);
  const { from, to } = isCustom
    ? { from: fromParam, to: toParam ? `${toParam}T23:59:59` : undefined }
    : getDateRange(period);

  let query = supabase
    .from("payments")
    .select("*, invoices(invoice_number, clients(name))")
    .eq("org_id", org.id)
    .order("paid_at", { ascending: false });

  if (from) query = query.gte("paid_at", from);
  if (to) query = query.lt("paid_at", to);

  const { data } = await query;
  const payments = (data ?? []) as unknown as PaymentWithInvoice[];
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const periodLabel = isCustom
    ? `${fromParam ? fmtDate(fromParam) : "Start"} – ${toParam ? fmtDate(toParam) : "Today"}`
    : period ? (PERIOD_LABELS[period] ?? "Filtered") : "All time";

  return (
    <div>
      <Topbar title="Payments" />
      <div className="p-4 sm:p-6 space-y-5">
        {/* Filter bar */}
        <Suspense>
          <PaymentsFilter />
        </Suspense>

        {/* Summary card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Total collected"
            value={formatCurrency(total)}
            subtitle={periodLabel}
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          {!payments.length ? (
            <p className="text-center py-12 text-sm text-neutral-500">
              {period ? "No payments in this period." : "No payments yet."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 dark:border-neutral-800">
                <tr>
                  <th className="text-left py-3 px-5 text-xs text-neutral-500 font-medium uppercase tracking-wide">Invoice</th>
                  <th className="text-left py-3 px-4 text-xs text-neutral-500 font-medium uppercase tracking-wide">Client</th>
                  <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-neutral-500 font-medium uppercase tracking-wide">Method</th>
                  <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-neutral-500 font-medium uppercase tracking-wide">Date</th>
                  <th className="text-right py-3 px-5 text-xs text-neutral-500 font-medium uppercase tracking-wide">Amount</th>
                  <th className="py-3 px-4 text-xs text-neutral-500 font-medium uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="py-3 px-5 font-medium text-neutral-950 dark:text-neutral-50">{payment.invoices?.invoice_number ?? "—"}</td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 max-w-[120px] truncate">{payment.invoices?.clients?.name ?? "—"}</td>
                    <td className="hidden sm:table-cell py-3 px-4 text-neutral-600 dark:text-neutral-400">{METHOD_LABELS[payment.method] ?? payment.method}</td>
                    <td className="hidden sm:table-cell py-3 px-4 text-neutral-600 dark:text-neutral-400">{formatDate(payment.paid_at)}</td>
                    <td className="py-3 px-5 text-right font-medium text-green-700 dark:text-green-400 whitespace-nowrap">{formatCurrency(payment.amount, payment.currency)}</td>
                    <td className="py-3 px-4 text-right">
                      <PaymentRefundButton payment={payment} />
                    </td>
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
