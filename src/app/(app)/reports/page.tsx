import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import Topbar from "@/components/shell/Topbar";
import RevenueChart from "@/components/reports/RevenueChart";
import AgingTable from "@/components/reports/AgingTable";
import type { Metadata } from "next";
import type { InvoiceWithClient } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Reports" };

function getAgingBucket(dueDate: string | null): string {
  if (!dueDate) return "90+ days";
  const daysPast = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
  if (daysPast <= 30) return "0–30 days";
  if (daysPast <= 60) return "31–60 days";
  if (daysPast <= 90) return "61–90 days";
  return "90+ days";
}

export default async function ReportsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const [{ data: payments }, { data: overdueInvoices }, { data: paidInvoices }, { data: vatInvoices }] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, paid_at, currency")
      .eq("org_id", org.id)
      .order("paid_at"),
    supabase
      .from("invoices")
      .select("*, clients(name)")
      .eq("org_id", org.id)
      .in("status", ["overdue", "sent", "issued"])
      .order("due_date"),
    supabase
      .from("invoices")
      .select("total, amount_paid, clients(id, name)")
      .eq("org_id", org.id)
      .eq("status", "paid"),
    supabase
      .from("invoices")
      .select("subtotal, vat_amount, total, issue_date")
      .eq("org_id", org.id)
      .eq("status", "paid")
      .order("issue_date"),
  ]);

  // Build monthly revenue data (last 12 months)
  const monthlyMap = new Map<string, number>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    monthlyMap.set(key, 0);
  }

  for (const p of payments ?? []) {
    const d = new Date(p.paid_at);
    const key = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + p.amount);
    }
  }

  const revenueData = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
    month,
    revenue: Math.round(revenue * 100) / 100,
  }));

  // Build aging buckets
  const AGING_BUCKETS = ["0–30 days", "31–60 days", "61–90 days", "90+ days"];
  const bucketMap = new Map<string, InvoiceWithClient[]>(
    AGING_BUCKETS.map((b) => [b, []])
  );

  for (const inv of (overdueInvoices ?? []) as InvoiceWithClient[]) {
    if (inv.due_date && new Date(inv.due_date) < new Date()) {
      const bucket = getAgingBucket(inv.due_date);
      bucketMap.get(bucket)?.push(inv);
    }
  }

  const agingBuckets = AGING_BUCKETS.map((label) => {
    const invoices = bucketMap.get(label) ?? [];
    return { label, invoices, total: invoices.reduce((s, i) => s + i.total, 0) };
  });

  // Top clients by revenue collected
  const clientTotals = new Map<string, { name: string; revenue: number; invoices: number }>();
  for (const inv of paidInvoices ?? []) {
    const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
    if (!client?.id) continue;
    const existing = clientTotals.get(client.id) ?? { name: client.name ?? "—", revenue: 0, invoices: 0 };
    existing.revenue += inv.amount_paid ?? inv.total;
    existing.invoices += 1;
    clientTotals.set(client.id, existing);
  }
  const topClients = [...clientTotals.entries()]
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // VAT summary by month (last 12 months)
  const vatMonthMap = new Map<string, { net: number; vat: number; gross: number; sortKey: string }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    vatMonthMap.set(key, { net: 0, vat: 0, gross: 0, sortKey });
  }
  for (const inv of vatInvoices ?? []) {
    const d = new Date(inv.issue_date);
    const key = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    if (vatMonthMap.has(key)) {
      const entry = vatMonthMap.get(key)!;
      entry.net += inv.subtotal ?? 0;
      entry.vat += inv.vat_amount ?? 0;
      entry.gross += inv.total ?? 0;
    }
  }
  const vatRows = [...vatMonthMap.entries()]
    .map(([month, v]) => ({ month, ...v }))
    .filter((r) => r.gross > 0);

  return (
    <div>
      <Topbar title="Reports" />
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue (last 12 months)</h2>
          <RevenueChart data={revenueData} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Overdue invoices (aging)</h2>
          <AgingTable buckets={agingBuckets} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top clients by revenue</h2>
          {topClients.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No paid invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((client, i) => {
                const maxRevenue = topClients[0].revenue;
                const pct = maxRevenue > 0 ? Math.round((client.revenue / maxRevenue) * 100) : 0;
                return (
                  <div key={client.id}>
                    <div className="flex items-center justify-between mb-1">
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-sm font-medium text-gray-900 hover:underline flex items-center gap-2"
                      >
                        <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                        {client.name}
                      </Link>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(client.revenue)}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {client.invoices} invoice{client.invoices !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">VAT summary by month</h2>
            <span className="text-xs text-gray-400">Paid invoices only</span>
          </div>
          {vatRows.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No paid invoices with VAT yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Month</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Net</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">VAT</th>
                    <th className="text-right py-2 pl-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Gross</th>
                  </tr>
                </thead>
                <tbody>
                  {vatRows.map((row) => (
                    <tr key={row.month} className="border-b border-gray-50">
                      <td className="py-2.5 pr-4 font-medium text-gray-900">{row.month}</td>
                      <td className="py-2.5 px-4 text-right text-gray-600">{formatCurrency(row.net)}</td>
                      <td className="py-2.5 px-4 text-right text-gray-600">{formatCurrency(row.vat)}</td>
                      <td className="py-2.5 pl-4 text-right font-semibold text-gray-900">{formatCurrency(row.gross)}</td>
                    </tr>
                  ))}
                  {vatRows.length > 1 && (
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td className="py-2.5 pr-4 font-semibold text-gray-900 text-xs uppercase tracking-wide">Total</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-gray-900">
                        {formatCurrency(vatRows.reduce((s, r) => s + r.net, 0))}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-gray-900">
                        {formatCurrency(vatRows.reduce((s, r) => s + r.vat, 0))}
                      </td>
                      <td className="py-2.5 pl-4 text-right font-semibold text-gray-900">
                        {formatCurrency(vatRows.reduce((s, r) => s + r.gross, 0))}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
