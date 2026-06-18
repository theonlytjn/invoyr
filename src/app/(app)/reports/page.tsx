import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
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

  const [{ data: payments }, { data: overdueInvoices }] = await Promise.all([
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
      </div>
    </div>
  );
}
