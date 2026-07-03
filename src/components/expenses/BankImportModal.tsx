"use client";

import { useState, useEffect, useCallback } from "react";
import { EXPENSE_CATEGORIES } from "./expense-config";
import { mapCategory } from "@/lib/truelayer/category-map";
import { formatCurrency } from "@/lib/utils";
import type { ExpenseCategory } from "@/lib/supabase/types";
import { PlusIcon } from "@/components/icons";

interface Connection {
  id: string;
  account_name: string;
  account_type: string | null;
  currency: string;
  last_synced_at: string | null;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  merchant_name: string | null;
  amount: number;
  currency: string;
  transaction_category: string | null;
}

interface PendingTxn extends BankTransaction {
  category: ExpenseCategory;
  selected: boolean;
}

type Step = "accounts" | "transactions" | "success";

export default function BankImportModal({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("accounts");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConn, setActiveConn] = useState<Connection | null>(null);
  const [transactions, setTransactions] = useState<PendingTxn[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    const res = await fetch("/api/bank/connections");
    const body = await res.json();
    setConnections(body.connections ?? []);
  }, []);

  useEffect(() => {
    if (open) {
      setStep("accounts");
      setActiveConn(null);
      setTransactions([]);
      setError(null);
      loadConnections();
    }
  }, [open, loadConnections]);

  async function syncAndLoad(conn: Connection) {
    setActiveConn(conn);
    setSyncing(true);
    setError(null);

    try {
      await fetch(`/api/bank/${conn.id}/sync`, { method: "POST" });

      const res = await fetch(
        `/api/bank/transactions?connection_id=${conn.id}`,
      );
      const body = await res.json();

      const pending: PendingTxn[] = (body.transactions ?? []).map(
        (t: BankTransaction) => ({
          ...t,
          category: mapCategory(t.transaction_category),
          selected: true,
        }),
      );

      setTransactions(pending);
      setStep("transactions");
    } catch {
      setError("Could not sync transactions. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  function toggleAll(checked: boolean) {
    setTransactions((prev) => prev.map((t) => ({ ...t, selected: checked })));
  }

  function toggleOne(id: string) {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)),
    );
  }

  function setCategory(id: string, category: ExpenseCategory) {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category } : t)),
    );
  }

  async function handleImport() {
    const selected = transactions.filter((t) => t.selected);
    if (!selected.length) return;

    setImporting(true);
    setError(null);

    const res = await fetch("/api/bank/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactions: selected.map((t) => ({ id: t.id, category: t.category })),
      }),
    });

    const body = await res.json();
    setImporting(false);

    if (!res.ok) {
      setError(body.error ?? "Import failed");
      return;
    }

    setImportedCount(body.imported);
    setStep("success");
  }

  function finish() {
    setOpen(false);
    onImported();
  }

  const selected = transactions.filter((t) => t.selected);
  const allSelected = transactions.length > 0 && selected.length === transactions.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
        </svg>
        Import from bank
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
              <div>
                <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">
                  {step === "accounts" && "Import from bank"}
                  {step === "transactions" && activeConn?.account_name}
                  {step === "success" && "Import complete"}
                </h2>
                {step === "transactions" && (
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {transactions.length} pending transaction{transactions.length !== 1 ? "s" : ""} — last 90 days
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">

              {/* Step: Accounts */}
              {step === "accounts" && (
                <div className="p-6 space-y-4">
                  {connections.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-neutral-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">No bank connected</p>
                      <p className="text-sm text-neutral-400 mb-6">
                        Connect your business bank account to automatically pull in transactions as expenses.
                      </p>
                      <a
                        href="/api/bank/connect"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                      >
                        <PlusIcon size={15} />
                        Connect bank account
                      </a>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-neutral-500">
                        Select a connected account to pull in the latest transactions.
                      </p>
                      <div className="space-y-2">
                        {connections.map((conn) => (
                          <button
                            key={conn.id}
                            onClick={() => syncAndLoad(conn)}
                            disabled={syncing}
                            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left disabled:opacity-50"
                          >
                            <div>
                              <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
                                {conn.account_name}
                              </p>
                              <p className="text-xs text-neutral-400 mt-0.5">
                                {conn.account_type ?? "Account"} · {conn.currency}
                                {conn.last_synced_at && (
                                  <> · Last synced {new Date(conn.last_synced_at).toLocaleDateString("en-GB")}</>
                                )}
                              </p>
                            </div>
                            {syncing && activeConn?.id === conn.id ? (
                              <svg className="w-4 h-4 text-neutral-400 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-neutral-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="pt-2">
                        <a
                          href="/api/bank/connect"
                          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                        >
                          <PlusIcon size={14} /> Add another account
                        </a>
                      </div>
                    </>
                  )}

                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  )}
                </div>
              )}

              {/* Step: Transactions */}
              {step === "transactions" && (
                <div>
                  {transactions.length === 0 ? (
                    <div className="text-center py-16 px-6">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">All caught up</p>
                      <p className="text-sm text-neutral-400">No new transactions to import from the last 90 days.</p>
                    </div>
                  ) : (
                    <>
                      {/* Select all */}
                      <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => toggleAll(e.target.checked)}
                          className="rounded border-neutral-300 dark:border-neutral-600 text-neutral-950 dark:text-neutral-50 focus:ring-0"
                        />
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                          {selected.length} of {transactions.length} selected
                        </span>
                      </div>

                      {/* Transaction rows */}
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {transactions.map((txn) => (
                          <div
                            key={txn.id}
                            className={`flex items-start gap-3 px-4 py-3 transition-colors ${txn.selected ? "" : "opacity-50"}`}
                          >
                            <input
                              type="checkbox"
                              checked={txn.selected}
                              onChange={() => toggleOne(txn.id)}
                              className="mt-0.5 rounded border-neutral-300 dark:border-neutral-600 text-neutral-950 dark:text-neutral-50 focus:ring-0 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50 truncate">
                                    {txn.merchant_name ?? txn.description}
                                  </p>
                                  {txn.merchant_name && (
                                    <p className="text-xs text-neutral-400 truncate">{txn.description}</p>
                                  )}
                                  <p className="text-xs text-neutral-400 mt-0.5">
                                    {new Date(txn.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-neutral-950 dark:text-neutral-50 shrink-0">
                                  {formatCurrency(txn.amount, txn.currency)}
                                </p>
                              </div>
                              <select
                                value={txn.category}
                                onChange={(e) => setCategory(txn.id, e.target.value as ExpenseCategory)}
                                disabled={!txn.selected}
                                className="mt-1.5 text-xs rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1 text-neutral-700 dark:text-neutral-300 focus:outline-none disabled:cursor-not-allowed"
                              >
                                {EXPENSE_CATEGORIES.map((c) => (
                                  <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 px-6 pb-4">{error}</p>
                  )}
                </div>
              )}

              {/* Step: Success */}
              {step === "success" && (
                <div className="p-6 text-center space-y-5">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6 text-green-600 dark:text-green-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-serif text-neutral-950 dark:text-neutral-50">
                      {importedCount} expense{importedCount !== 1 ? "s" : ""} imported
                    </p>
                    <p className="text-sm text-neutral-500 mt-1">
                      They&apos;re now in your expenses list, ready for review and categorisation.
                    </p>
                  </div>
                  <button
                    onClick={finish}
                    className="w-full py-2.5 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Footer — only on transactions step */}
            {step === "transactions" && transactions.length > 0 && (
              <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 shrink-0 flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep("accounts")}
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || selected.length === 0}
                  className="px-5 py-2.5 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing
                    ? "Importing…"
                    : `Import ${selected.length} transaction${selected.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
