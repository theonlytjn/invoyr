"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { Invoice } from "@/lib/supabase/types";

interface Props {
  invoice: Invoice;
  clientEmail: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreditNoteModal({ invoice, clientEmail, open, onClose, onSuccess }: Props) {
  const lateFee = invoice.late_fee_amount ?? 0;
  const creditAlready = invoice.credit_applied ?? 0;
  const remainingBalance = invoice.total + lateFee - invoice.amount_paid - creditAlready;

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (loading) return;
    setAmount("");
    setReason("");
    setSendEmail(false);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Please enter a valid credit amount.");
      return;
    }
    if (parsed > remainingBalance + 0.001) {
      setError(`Amount cannot exceed remaining balance of ${formatCurrency(remainingBalance, invoice.currency)}.`);
      return;
    }
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/invoices/${invoice.id}/credit-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parsed, reason: reason.trim() || undefined, sendEmail }),
    });
    setLoading(false);
    if (res.ok) {
      handleClose();
      onSuccess();
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to issue credit note.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">Issue credit note</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Apply a credit against {invoice.invoice_number}. Remaining balance:{" "}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {formatCurrency(remainingBalance, invoice.currency)}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Credit amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm select-none">
                {invoice.currency.toUpperCase()}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingBalance.toFixed(2)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-12 pr-3 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-neutral-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Reason <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Returned goods, pricing adjustment…"
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-neutral-50 resize-none"
            />
          </div>

          <label className={`flex items-start gap-3 cursor-pointer ${!clientEmail ? "opacity-50 cursor-not-allowed" : ""}`}>
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              disabled={!clientEmail}
              className="mt-0.5 accent-neutral-950"
            />
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Notify client by email</p>
              {!clientEmail && (
                <p className="text-xs text-neutral-400">Client has no email address</p>
              )}
            </div>
          </label>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Issuing…" : "Issue credit note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
