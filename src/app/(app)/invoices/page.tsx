import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import Topbar from "@/components/shell/Topbar";
import InvoicesTable from "@/components/invoices/InvoicesTable";
import type { Metadata } from "next";
import type { InvoiceWithClient, InvoiceStatus } from "@/lib/supabase/types";
import { canAccess } from "@/config/plans";

export const metadata: Metadata = { title: "Invoices" };

const STATUS_TABS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "sent", label: "Sent" },
  { value: "partial", label: "Partial" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

interface SearchParams {
  status?: string;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const org = await requireOrg();
  const plan = await getOrgPlan(org.id);
  const canExportCsv = canAccess(plan, "csv_export");
  const supabase = await createClient();
  const { status } = await searchParams;

  let query = supabase
    .from("invoices")
    .select("*, clients(name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data } = await query;
  const invoices = (data ?? []) as InvoiceWithClient[];

  return (
    <div>
      <Topbar
        title="Invoices"
        actions={
          <>
            {canExportCsv && (
              <a
                href="/api/invoices/export"
                download
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Export CSV
              </a>
            )}
            <Link
              href="/invoices/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              + New
            </Link>
          </>
        }
      />

      <div className="p-4 sm:p-6">
        {/* Status filter tabs — scrollable on mobile */}
        <div className="overflow-x-auto pb-1 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg w-fit min-w-max">
            {STATUS_TABS.map((tab) => (
              <Link
                key={tab.value}
                href={tab.value === "all" ? "/invoices" : `/invoices?status=${tab.value}`}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                  (status ?? "all") === tab.value
                    ? "bg-white dark:bg-neutral-700 text-neutral-950 dark:text-neutral-50 font-medium shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        <InvoicesTable invoices={invoices} />
      </div>
    </div>
  );
}
