"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { computeTotals } from "@/lib/invoice-totals";
import type { RecurringInvoiceWithClient } from "@/lib/supabase/types";

const FREQ_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const STATUS_STYLES: Record<string, string> = {
  active: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30",
  paused: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30",
  ended: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800",
};

interface Props { schedules: RecurringInvoiceWithClient[] }

export default function RecurringList({ schedules }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [acting, setActing] = useState<string | null>(null);

  if (!schedules.length) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 py-16 text-center">
        <p className="text-neutral-500 mb-3">No recurring schedules yet.</p>
        <Link href="/invoices/recurring/new" className="text-sm font-medium text-neutral-950 dark:text-neutral-50 underline">
          Create your first schedule
        </Link>
      </div>
    );
  }

  function toggleStatus(id: string, current: string) {
    const next = current === "active" ? "paused" : "active";
    setActing(id);
    startTransition(async () => {
      await fetch(`/api/recurring-invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
      setActing(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this recurring schedule? This cannot be undone.")) return;
    setActing(id);
    startTransition(async () => {
      await fetch(`/api/recurring-invoices/${id}`, { method: "DELETE" });
      router.refresh();
      setActing(null);
    });
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 dark:border-neutral-800">
            <th className="text-left py-3 px-5 text-xs text-neutral-400 uppercase tracking-wider">Client</th>
            <th className="text-left py-3 px-4 text-xs text-neutral-400 uppercase tracking-wider">Frequency</th>
            <th className="text-left py-3 px-4 text-xs text-neutral-400 uppercase tracking-wider">Amount</th>
            <th className="hidden sm:table-cell text-left py-3 px-4 text-xs text-neutral-400 uppercase tracking-wider">Next invoice</th>
            <th className="text-left py-3 px-4 text-xs text-neutral-400 uppercase tracking-wider">Status</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {schedules.map((s) => {
            const totals = computeTotals((s.recurring_invoice_items ?? []).map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unit_price: i.unit_price,
              vat_rate: i.vat_rate,
            })));
            const isActing = acting === s.id;

            return (
              <tr key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <td className="py-3 px-5 font-medium text-neutral-950 dark:text-neutral-50">
                  {s.clients?.name ?? <span className="text-neutral-400 italic">No client</span>}
                </td>
                <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">{FREQ_LABELS[s.frequency]}</td>
                <td className="py-3 px-4 font-medium text-neutral-950 dark:text-neutral-50">
                  {formatCurrency(totals.total, s.currency)}
                </td>
                <td className="hidden sm:table-cell py-3 px-4 text-neutral-600 dark:text-neutral-400">
                  {s.status === "ended" ? "—" : new Date(s.next_run_at).toLocaleDateString("en-GB")}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${STATUS_STYLES[s.status] ?? ""}`}>
                    {s.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3 justify-end">
                    {s.status !== "ended" && (
                      <button
                        onClick={() => toggleStatus(s.id, s.status)}
                        disabled={isActing || isPending}
                        className="text-xs text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors"
                      >
                        {s.status === "active" ? "Pause" : "Resume"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={isActing || isPending}
                      className="text-xs text-neutral-400 hover:text-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
