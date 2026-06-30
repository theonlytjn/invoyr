"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Expense, ExpenseWithClient, Client } from "@/lib/supabase/types";
import type { ExpenseCategory } from "@/lib/supabase/types";
import ExpenseCategoryBadge from "./ExpenseCategoryBadge";
import ExpenseModal from "./ExpenseModal";
import { EXPENSE_CATEGORIES } from "./expense-config";
import { PlusIcon, PencilIcon, TrashIcon, AttachmentIcon } from "@/components/icons";

const PERIODS = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_3_months", label: "Last 3 months" },
  { value: "this_year", label: "This year" },
  { value: "all", label: "All time" },
];

function periodToDates(period: string): { from?: string; to?: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  if (period === "this_month") {
    return {
      from: new Date(y, m, 1).toISOString().slice(0, 10),
      to: new Date(y, m + 1, 0).toISOString().slice(0, 10),
    };
  }
  if (period === "last_month") {
    return {
      from: new Date(y, m - 1, 1).toISOString().slice(0, 10),
      to: new Date(y, m, 0).toISOString().slice(0, 10),
    };
  }
  if (period === "last_3_months") {
    return {
      from: new Date(y, m - 3, 1).toISOString().slice(0, 10),
      to: new Date(y, m + 1, 0).toISOString().slice(0, 10),
    };
  }
  if (period === "this_year") {
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
  return {};
}

interface Props {
  initialExpenses: ExpenseWithClient[];
  clients: Pick<Client, "id" | "name" | "company_name">[];
  orgId: string;
  orgCurrency: string;
}

export default function ExpensesList({ initialExpenses, clients, orgId, orgCurrency }: Props) {
  const [expenses, setExpenses] = useState<ExpenseWithClient[]>(initialExpenses);
  const [period, setPeriod] = useState("this_month");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchExpenses(newPeriod = period, newCategory = category) {
    setLoading(true);
    const { from, to } = periodToDates(newPeriod);
    const params = new URLSearchParams();
    if (newCategory !== "all") params.set("category", newCategory);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await fetch(`/api/expenses?${params}`);
    const body = await res.json();
    setExpenses(body.expenses ?? []);
    setLoading(false);
  }

  function handlePeriodChange(p: string) {
    setPeriod(p);
    fetchExpenses(p, category);
  }

  function handleCategoryChange(c: string) {
    setCategory(c);
    fetchExpenses(period, c);
  }

  function handleSave(saved: Expense) {
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      const withClient = { ...saved, clients: prev[idx]?.clients ?? null } as ExpenseWithClient;
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = withClient;
        return next;
      }
      return [withClient, ...prev];
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeletingId(id);
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const billableTotal = expenses.filter((e) => e.is_billable && !e.invoiced_at).reduce((s, e) => s + Number(e.amount), 0);
  const topCurrency = expenses[0]?.currency ?? orgCurrency;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          <PlusIcon size={16} /> New expense
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="text-xs text-neutral-500 mb-1">Total expenses</p>
          <p className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">{formatCurrency(total, topCurrency)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <p className="text-xs text-neutral-500 mb-1">Unbilled billable</p>
          <p className="text-xl font-semibold text-green-700 dark:text-green-400">{formatCurrency(billableTotal, topCurrency)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hidden sm:block">
          <p className="text-xs text-neutral-500 mb-1">Expenses logged</p>
          <p className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">{expenses.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 transition-colors ${
                period === p.value
                  ? "bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="sm:ml-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none"
        >
          <option value="all">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center text-sm text-neutral-400">Loading…</div>
      ) : expenses.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">No expenses found</p>
          <p className="text-sm text-neutral-400 mb-4">Add your first expense to start tracking costs.</p>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            <PlusIcon size={16} /> Add expense
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden md:table-cell">Client</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {expenses.map((expense) => {
                const clientName = expense.clients
                  ? (expense.clients.company_name ?? expense.clients.name)
                  : null;
                return (
                  <tr key={expense.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{formatDate(expense.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">{expense.title}</span>
                        {expense.receipt_url && (
                          <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 shrink-0">
                            <AttachmentIcon size={14} />
                          </a>
                        )}
                        {expense.is_billable && !expense.invoiced_at && (
                          <span className="shrink-0 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-1.5 py-0.5 rounded-full">
                            Billable
                          </span>
                        )}
                        {expense.invoiced_at && (
                          <span className="shrink-0 text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full">
                            Invoiced
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <ExpenseCategoryBadge category={expense.category} />
                    </td>
                    <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">
                      {clientName ?? <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-neutral-950 dark:text-neutral-50 whitespace-nowrap">
                      {formatCurrency(expense.amount, expense.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setEditing(expense); setModalOpen(true); }}
                          className="p-1.5 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <PencilIcon size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          className="p-1.5 rounded text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ExpenseModal
          orgId={orgId}
          orgCurrency={orgCurrency}
          clients={clients}
          expense={editing}
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={(saved) => handleSave(saved as ExpenseWithClient)}
        />
      )}

      {/* FAB-style add button for mobile when there are rows */}
      {expenses.length > 0 && (
        <div className="fixed bottom-20 right-4 lg:hidden z-40">
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 shadow-lg"
          >
            <PlusIcon size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
