import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOnboarded, getOrg } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import Topbar from "@/components/shell/Topbar";
import MetricCard from "@/components/dashboard/MetricCard";
import LatestInvoicesTable from "@/components/dashboard/LatestInvoicesTable";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import type { Metadata } from "next";
import type { InvoiceWithClient, AuditLog } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requireOnboarded();
  const org = await getOrg();
  const supabase = await createClient();

  if (!org) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [invoicesRes, latestRes, revenueAllRes, revenueMonthRes, logsRes] = await Promise.all([
    // All invoices for accurate metric aggregation (status + total only)
    supabase
      .from("invoices")
      .select("id, status, total, amount_paid, due_date")
      .eq("org_id", org.id),
    // Latest 10 for the table
    supabase
      .from("invoices")
      .select("*, clients(name)")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(10),
    // All-time revenue
    supabase
      .from("payments")
      .select("amount")
      .eq("org_id", org.id),
    // This month's revenue
    supabase
      .from("payments")
      .select("amount")
      .eq("org_id", org.id)
      .gte("paid_at", monthStart),
    // Activity feed
    supabase
      .from("audit_logs")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const allInvoices = invoicesRes.data ?? [];
  const latestInvoices = (latestRes.data ?? []) as InvoiceWithClient[];
  const logs = (logsRes.data ?? []) as AuditLog[];

  const totalRevenue = (revenueAllRes.data ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
  const monthRevenue = (revenueMonthRes.data ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);

  const overdueInvoices = allInvoices.filter((i) => i.status === "overdue");
  const outstandingInvoices = allInvoices.filter((i) => ["sent", "issued"].includes(i.status));
  const overdueTotal = overdueInvoices.reduce((s, i) => s + i.total, 0);
  const outstandingTotal = outstandingInvoices.reduce((s, i) => s + (i.total - i.amount_paid), 0);

  return (
    <div>
      <Topbar
        title="Dashboard"
        actions={
          <Link
            href="/invoices/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            + New invoice
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Revenue this month"
            value={formatCurrency(monthRevenue)}
            subtitle={`${formatCurrency(totalRevenue)} all time`}
          />
          <MetricCard
            title="Outstanding"
            value={formatCurrency(outstandingTotal)}
            subtitle={`${outstandingInvoices.length} invoice${outstandingInvoices.length !== 1 ? "s" : ""} awaiting payment`}
          />
          <MetricCard
            title="Overdue"
            value={formatCurrency(overdueTotal)}
            subtitle={`${overdueInvoices.length} invoice${overdueInvoices.length !== 1 ? "s" : ""}`}
            accentClass={overdueTotal > 0 ? "text-red-600" : undefined}
          />
          <MetricCard
            title="Total invoices"
            value={String(allInvoices.length)}
            subtitle={`${allInvoices.filter((i) => i.status === "paid").length} paid`}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Latest invoices</h2>
              <Link href="/invoices" className="text-sm text-gray-500 hover:text-gray-900">View all →</Link>
            </div>
            <LatestInvoicesTable invoices={latestInvoices} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Activity</h2>
            </div>
            <div className="px-5 py-4">
              <ActivityFeed logs={logs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
