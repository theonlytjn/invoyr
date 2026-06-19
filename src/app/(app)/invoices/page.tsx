import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import Topbar from "@/components/shell/Topbar";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
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
              className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Export CSV
            </a>
            <Link
              href="/invoices/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              + New invoice
            </Link>
          </>
        }
      />

      <div className="p-6">
        {/* Status filter tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value === "all" ? "/invoices" : `/invoices?status=${tab.value}`}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                (status ?? "all") === tab.value
                  ? "bg-white text-gray-900 font-medium shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {invoices.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-3">No invoices found.</p>
              <Link
                href="/invoices/new"
                className="text-sm font-medium text-gray-900 underline"
              >
                Create your first invoice
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Issue date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Due date</th>
                  <th className="text-right py-3 px-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-5">
                      <Link href={`/invoices/${invoice.id}`} className="font-medium text-gray-900 hover:underline">
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {invoice.clients?.name ?? <span className="text-gray-400 italic">No client</span>}
                    </td>
                    <td className="py-3 px-4">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(invoice.issue_date)}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                    </td>
                    <td className="py-3 px-5 text-right font-medium text-gray-900">
                      {formatCurrency(invoice.total, invoice.currency)}
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
