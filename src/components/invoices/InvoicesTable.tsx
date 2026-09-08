"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import { Input } from "@/components/ui/input";
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionBar, BulkDeleteDialog, RowCheckbox } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "@/components/icons";
import type { InvoiceWithClient } from "@/lib/supabase/types";

interface Props {
  invoices: InvoiceWithClient[];
  canBulk?: boolean;
}

const SENDABLE = new Set(["draft", "issued", "sent"]);
const VOIDABLE = new Set(["draft", "issued", "sent"]);

type BulkAction = "delete" | "mark-paid" | "remind" | "duplicate";

// A single "verb + count + noun" template can't serve every action's grammar
// ("Send reminders for 3 invoices?" vs "Delete 3 invoices?"), so each action
// spells out its own title, button label and toast — the way `past` already
// had to be hand-written per action rather than derived from `verb`.
const ACTIONS: Record<
  BulkAction,
  {
    endpoint: string;
    destructive: boolean;
    titleFor: (n: number) => string;
    confirmLabel: string;
    toastFor: (deleted: number, skipped: number) => string;
  }
> = {
  "delete": {
    endpoint: "/api/invoices/bulk/delete",
    destructive: true,
    titleFor: (n) => `Delete ${n} ${n === 1 ? "invoice" : "invoices"}?`,
    confirmLabel: "Delete",
    toastFor: (deleted, skipped) =>
      `Deleted ${deleted} invoice${deleted !== 1 ? "s" : ""}` + (skipped > 0 ? `, ${skipped} skipped` : "") + ".",
  },
  "mark-paid": {
    endpoint: "/api/invoices/bulk/mark-paid",
    destructive: false,
    titleFor: (n) => `Mark ${n} ${n === 1 ? "invoice" : "invoices"} as paid?`,
    confirmLabel: "Mark as paid",
    toastFor: (deleted, skipped) =>
      `Marked ${deleted} invoice${deleted !== 1 ? "s" : ""} as paid` + (skipped > 0 ? `, ${skipped} skipped` : "") + ".",
  },
  "remind": {
    endpoint: "/api/invoices/bulk/remind",
    destructive: false,
    titleFor: (n) => `Send reminders for ${n} ${n === 1 ? "invoice" : "invoices"}?`,
    confirmLabel: "Send reminders",
    toastFor: (deleted, skipped) =>
      `Sent reminders for ${deleted} invoice${deleted !== 1 ? "s" : ""}` + (skipped > 0 ? `, ${skipped} skipped` : "") + ".",
  },
  "duplicate": {
    endpoint: "/api/invoices/bulk/duplicate",
    destructive: false,
    titleFor: (n) => `Duplicate ${n} ${n === 1 ? "invoice" : "invoices"}?`,
    confirmLabel: "Duplicate",
    toastFor: (deleted, skipped) =>
      `Duplicated ${deleted} invoice${deleted !== 1 ? "s" : ""}` + (skipped > 0 ? `, ${skipped} skipped` : "") + ".",
  },
};

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
  const [action, setAction] = useState<BulkAction | null>(null);
  const [bulkState, setBulkState] = useState<"idle" | "sending" | "voiding" | "downloading">("idle");
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

  async function handleDownloadPdfs() {
    setBulkState("downloading");
    const res = await fetch("/api/invoices/bulk/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });

    if (!res.ok) {
      setBulkState("idle");
      showToast("Could not build the download. Please try again.");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setBulkState("idle");
    showToast(`Downloaded ${selectedIds.length} invoice${selectedIds.length !== 1 ? "s" : ""}.`);
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
          onClick={() => setAction("mark-paid")}
          disabled={bulkState !== "idle"}
          className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-600 disabled:opacity-50 transition-colors"
        >
          Mark as paid
        </button>
        <button
          onClick={() => setAction("delete")}
          disabled={bulkState !== "idle"}
          className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          Delete
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={bulkState !== "idle"}
              className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-600 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              More
              <ChevronDownIcon size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleBulkExport} disabled={bulkState !== "idle"}>
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAction("duplicate")} disabled={bulkState !== "idle"}>
              Duplicate
            </DropdownMenuItem>
            {canBulk && (
              <>
                <DropdownMenuItem onClick={handleDownloadPdfs} disabled={bulkState !== "idle"}>
                  {bulkState === "downloading" ? "Downloading…" : "Download PDFs"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAction("remind")}>Send reminders</DropdownMenuItem>
                {canVoid && (
                  <DropdownMenuItem
                    onClick={handleBulkVoid}
                    disabled={bulkState !== "idle"}
                    className="text-red-600 focus:text-red-600"
                  >
                    {bulkState === "voiding" ? "Voiding…" : "Void"}
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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

      {action && (
        <BulkDeleteDialog
          open
          endpoint={ACTIONS[action].endpoint}
          titleFor={ACTIONS[action].titleFor}
          confirmLabel={ACTIONS[action].confirmLabel}
          destructive={ACTIONS[action].destructive}
          ids={selectedIds}
          noun="invoice"
          nounPlural="invoices"
          onCancel={() => setAction(null)}
          onDeleted={(result) => {
            const toastFor = ACTIONS[action].toastFor;
            setAction(null);
            selection.clear();
            showToast(toastFor(result.deleted, result.skipped));
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
