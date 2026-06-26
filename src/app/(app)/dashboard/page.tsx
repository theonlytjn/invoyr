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
import { getSubscription } from "@/lib/billing";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requireOnboarded();
  const org = await getOrg();
  const supabase = await createClient();

  if (!org) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const sub = await getSubscription(org.id);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] || org.name;

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

  const overdueInvoices = allInvoices.filter(
    (i) =>
      i.status === "overdue" ||
      (["sent", "issued"].includes(i.status) && i.due_date && new Date(i.due_date) < now)
  );
  const overdueIds = new Set(overdueInvoices.map((i) => i.id));
  const outstandingInvoices = allInvoices.filter(
    (i) => ["sent", "issued"].includes(i.status) && !overdueIds.has(i.id)
  );
  const overdueTotal = overdueInvoices.reduce((s, i) => s + (i.total - i.amount_paid), 0);
  const outstandingTotal = outstandingInvoices.reduce((s, i) => s + (i.total - i.amount_paid), 0);

  return (
    <div>
      <Topbar
        title="Dashboard"
        actions={
          <Link
            href="/invoices/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0a0a0a] text-white text-sm font-medium rounded-lg hover:bg-[#171717] transition-colors"
          >
            + New invoice
          </Link>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-neutral-950 dark:text-neutral-50">Welcome back, {firstName}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Here&apos;s what&apos;s happening with {org.name}.</p>
        </div>

        {sub?.status === "trialing" && sub.trial_ends_at && (() => {
          const daysLeft = Math.max(0, Math.ceil(
            (new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000
          ));
          const endsOn = new Date(sub.trial_ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
          return (
            <div className="flex items-center justify-between gap-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm">
              <p className="text-blue-800">
                <span className="font-semibold">7-day trial</span>
                {" — "}
                {daysLeft === 0
                  ? "Trial ends today. Your card will be charged when it expires."
                  : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining. Your card will be charged on ${endsOn}.`}
              </p>
              <Link
                href="/settings/billing"
                className="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                View billing
              </Link>
            </div>
          );
        })()}

        {sub?.status === "past_due" && (
          <div className="flex items-center justify-between gap-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm">
            <p className="text-amber-800">
              <span className="font-semibold">Payment overdue</span>
              {" — "}
              Your last payment failed. Update your billing details to keep your account active.
            </p>
            <Link
              href="/settings/billing"
              className="shrink-0 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 transition-colors"
            >
              Update billing
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Revenue this month"
            value={formatCurrency(monthRevenue)}
            change={{ value: formatCurrency(totalRevenue), trend: "neutral" }}
            subtitle="all time"
          />
          <MetricCard
            title="Outstanding"
            value={formatCurrency(outstandingTotal)}
            subtitle={`${outstandingInvoices.length} invoice${outstandingInvoices.length !== 1 ? "s" : ""} awaiting payment`}
          />
          <MetricCard
            title="Overdue"
            value={formatCurrency(overdueTotal)}
            change={overdueTotal > 0 ? { value: `${overdueInvoices.length} invoice${overdueInvoices.length !== 1 ? "s" : ""}`, trend: "down" } : undefined}
            subtitle={overdueTotal === 0 ? "None overdue" : undefined}
          />
          <MetricCard
            title="Total invoices"
            value={String(allInvoices.length)}
            subtitle={`${allInvoices.filter((i) => i.status === "paid").length} paid`}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">Latest invoices</h2>
              <Link href="/invoices" className="text-xs text-neutral-500 hover:text-neutral-950 dark:hover:text-neutral-50">View all →</Link>
            </div>
            <LatestInvoicesTable invoices={latestInvoices} />
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">Activity</h2>
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
