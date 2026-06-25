import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import InvoicesTable from "@/components/invoices/InvoicesTable";
import type { Metadata } from "next";
import type { InvoiceWithClient, InvoiceStatus } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Invoices" };

const STATUS_TABS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
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
            <a
              href="/api/invoices/export"
              download
              className="flex items-center gap-1.5 px-3.5 py-2 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Export CSV
            </a>
            <Link
              href="/invoices/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              + New invoice
            </Link>
          </>
        }
      />

      <div className="p-6">
        {/* Status filter tabs */}
        <div className="flex gap-1 mb-5 bg-neutral-100 p-1 rounded-lg w-fit">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value === "all" ? "/invoices" : `/invoices?status=${tab.value}`}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                (status ?? "all") === tab.value
                  ? "bg-white text-neutral-950 font-medium shadow-sm"
                  : "text-neutral-500 hover:text-neutral-950"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <InvoicesTable invoices={invoices} />
      </div>
    </div>
  );
}
