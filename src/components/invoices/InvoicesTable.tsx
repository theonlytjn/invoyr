"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import { Input } from "@/components/ui/input";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionBar, BulkDeleteDialog, RowCheckbox } from "@/components/ui";
import type { InvoiceWithClient } from "@/lib/supabase/types";

interface Props {
  invoices: InvoiceWithClient[];
  canBulk?: boolean;
}

const SENDABLE = new Set(["draft", "issued", "sent"]);
const VOIDABLE = new Set(["draft", "issued", "sent"]);

function buildCsv(rows: InvoiceWithClient[]): string {
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headers = ["Invoice #", "Client", "Status", "Issue date", "Due date", "Currency", "Subtotal", "VAT", "Total", "Amount paid"];
  const lines = rows.map((inv) => [
    inv.invoice_number,
    inv.clients?.name ?? "",
    inv.status,
    inv.issue_date ? formatDate(inv.issue_date) : "",
    inv.due_date ? formatDate(inv.due_date) : "",
    inv.currency,
    inv.subtotal,
    inv.vat_amount,
    inv.total,
    inv.amount_paid,
  ].map(escape).join(","));
  return [headers.join(","), ...lines].join("\n");
}

export default function InvoicesTable({ invoices, canBulk = false }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const selection = useRowSelection();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkState, setBulkState] = useState<"idle" | "sending" | "voiding">("idle");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const filtered = query.trim()
    ? invoices.filter((inv) => {
        const q = query.toLowerCase();
        return inv.invoice_number.toLowerCase().includes(q) || (inv.clients?.name ?? "").toLowerCase().includes(q);
      })
    : invoices;

  const allFilteredIds = filtered.map((i) => i.id);
  const selectedInvoices = invoices.filter((i) => selection.isSelected(i.id));
  const selectedIds = selectedInvoices.map((i) => i.id);
  const canSend = selectedInvoices.some((i) => SENDABLE.has(i.status));
  const canVoid = selectedInvoices.some((i) => VOIDABLE.has(i.status));

  async function handleBulkSend() {
    setBulkState("sending");
    const ids = selectedInvoices.filter((i) => SENDABLE.has(i.status)).map((i) => i.id);
    const res = await fetch("/api/invoices/bulk/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    const json = await res.json();
    setBulkState("idle");
    selection.clear();
    showToast(`Sent ${json.sent} invoice${json.sent !== 1 ? "s" : ""}${json.skipped > 0 ? `, ${json.skipped} skipped` : ""}.`);
    router.refresh();
  }

  async function handleBulkVoid() {
    if (!confirm(`Void ${selectedInvoices.filter((i) => VOIDABLE.has(i.status)).length} invoice(s)? This cannot be undone.`)) return;
    setBulkState("voiding");
    const ids = selectedInvoices.filter((i) => VOIDABLE.has(i.status)).map((i) => i.id);
    const res = await fetch("/api/invoices/bulk/void", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    const json = await res.json();
    setBulkState("idle");
    selection.clear();
    showToast(`Voided ${json.voided} invoice${json.voided !== 1 ? "s" : ""}${json.skipped > 0 ? `, ${json.skipped} skipped` : ""}.`);
    router.refresh();
  }

  function handleBulkExport() {
    const csv = buildCsv(selectedInvoices);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-selected-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Input
        type="search"
        placeholder="Search by invoice number or client…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />

      {/* Bulk action bar */}
      <BulkActionBar count={selection.count} onClear={selection.clear}>
        {canBulk && canSend && (
          <button
            onClick={handleBulkSend}
            disabled={bulkState !== "idle"}
            className="px-3 py-1.5 bg-white text-neutral-950 font-medium rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
          >
            {bulkState === "sending" ? "Sending…" : "Send"}
          </button>
        )}
        <button
          onClick={handleBulkExport}
          className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
        >
          Export CSV
        </button>
        {canBulk && canVoid && (
          <button
            onClick={handleBulkVoid}
            disabled={bulkState !== "idle"}
            className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {bulkState === "voiding" ? "Voiding…" : "Void"}
          </button>
        )}
        <button
          onClick={() => setDeleteOpen(true)}
          disabled={bulkState !== "idle"}
          className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          Delete
        </button>
      </BulkActionBar>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            {query ? (
              <p className="text-neutral-500">No invoices match &ldquo;{query}&rdquo;.</p>
            ) : (
              <>
                <p className="text-neutral-500 mb-3">No invoices found.</p>
                <Link href="/invoices/new" className="text-sm font-medium text-neutral-950 underline">
                  Create your first invoice
                </Link>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 dark:border-neutral-800">
              <tr>
                <th className="py-3 pl-4 pr-2 w-8">
                  <RowCheckbox
                    checked={selection.allSelected(allFilteredIds)}
                    onChange={() => selection.toggleAll(allFilteredIds)}
                    label="Select all"
                  />
                </th>
                <th className="text-left py-3 px-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Invoice</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Client</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="hidden sm:table-cell text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Issue date</th>
                <th className="hidden sm:table-cell text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide">Due date</th>
                <th className="text-right py-3 px-5 text-xs font-medium text-neutral-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => {
                const isSelected = selection.isSelected(invoice.id);
                return (
                  <tr
                    key={invoice.id}
                    className={`border-b border-neutral-100 dark:border-neutral-800 transition-colors ${isSelected ? "bg-neutral-50 dark:bg-neutral-800/60" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}
                  >
                    <td className="py-3 pl-4 pr-2">
                      <RowCheckbox
                        checked={isSelected}
                        onChange={() => selection.toggleOne(invoice.id)}
                        label={`Select ${invoice.invoice_number}`}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Link href={`/invoices/${invoice.id}`} className="font-medium text-neutral-950 dark:text-neutral-50 hover:underline">
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 max-w-[120px] truncate">
                      {invoice.clients?.name ?? <span className="text-neutral-400 italic">No client</span>}
                    </td>
                    <td className="py-3 px-4">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="hidden sm:table-cell py-3 px-4 text-neutral-600 dark:text-neutral-400">{formatDate(invoice.issue_date)}</td>
                    <td className="hidden sm:table-cell py-3 px-4 text-neutral-600 dark:text-neutral-400">
                      {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                    </td>
                    <td className="py-3 px-5 text-right font-medium text-neutral-950 dark:text-neutral-50 whitespace-nowrap">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-neutral-950 text-white text-sm font-medium rounded-xl shadow-lg z-50 pointer-events-none">
          {toast}
        </div>
      )}

      <BulkDeleteDialog
        open={deleteOpen}
        endpoint="/api/invoices/bulk/delete"
        ids={selectedIds}
        noun="invoice"
        nounPlural="invoices"
        onCancel={() => setDeleteOpen(false)}
        onDeleted={(result) => {
          setDeleteOpen(false);
          selection.clear();
          showToast(
            `Deleted ${result.deleted} invoice${result.deleted !== 1 ? "s" : ""}` +
              (result.skipped > 0 ? `, ${result.skipped} skipped` : "") +
              "."
          );
          router.refresh();
        }}
      />
    </div>
  );
}
