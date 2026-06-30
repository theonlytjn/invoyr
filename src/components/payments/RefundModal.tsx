"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { PaymentWithInvoice } from "@/lib/supabase/types";

interface Props {
  payment: PaymentWithInvoice;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RefundModal({ payment, open, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState(payment.amount.toFixed(2));
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (loading) return;
    setAmount(payment.amount.toFixed(2));
    setReason("");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid refund amount.");
      return;
    }
    if (parsed > payment.amount + 0.001) {
      setError(`Cannot exceed the original payment of ${formatCurrency(payment.amount, payment.currency)}.`);
      return;
    }
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/payments/${payment.id}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parsed, reason: reason.trim() || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      handleClose();
      onSuccess();
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to process refund.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">Issue refund</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Refund against payment of{" "}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {formatCurrency(payment.amount, payment.currency)}
            </span>
            {" "}for invoice{" "}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {payment.invoices?.invoice_number ?? "—"}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Refund amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm select-none">
                {payment.currency.toUpperCase()}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={payment.amount.toFixed(2)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
              placeholder="e.g. Service not delivered, duplicate charge…"
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-neutral-50 resize-none"
            />
          </div>

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
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Processing…" : "Issue refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
