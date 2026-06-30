"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES } from "./expense-config";
import type { Expense, ExpenseCategory, Client } from "@/lib/supabase/types";
import { XIcon, UploadIcon, TrashIcon } from "@/components/icons";

interface Props {
  orgId: string;
  orgCurrency: string;
  clients: Pick<Client, "id" | "name" | "company_name">[];
  expense?: Expense | null;
  open: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}

const TODAY = new Date().toISOString().slice(0, 10);

export default function ExpenseModal({ orgId, orgCurrency, clients, expense, open, onClose, onSave }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(expense?.title ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? "other");
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [currency, setCurrency] = useState(expense?.currency ?? orgCurrency);
  const [date, setDate] = useState(expense?.date ?? TODAY);
  const [clientId, setClientId] = useState(expense?.client_id ?? "");
  const [isBillable, setIsBillable] = useState(expense?.is_billable ?? false);
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [receiptUrl, setReceiptUrl] = useState(expense?.receipt_url ?? "");
  const [receiptName, setReceiptName] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!ALLOWED.includes(file.type)) {
      setError("Allowed receipt formats: PDF, JPEG, PNG, WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Receipt must be under 10 MB.");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("receipts").upload(path, file, { contentType: file.type });
    setUploading(false);

    if (uploadErr) { setError(uploadErr.message); return; }

    const { data } = supabase.storage.from("receipts").getPublicUrl(path);
    setReceiptUrl(data.publicUrl);
    setReceiptName(file.name);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required."); return; }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) { setError("Enter a valid amount."); return; }

    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      category,
      amount: amountNum,
      currency,
      date,
      client_id: clientId || null,
      is_billable: isBillable,
      notes: notes.trim() || null,
      receipt_url: receiptUrl || null,
    };

    const url = expense ? `/api/expenses/${expense.id}` : "/api/expenses";
    const method = expense ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Failed to save expense.");
      return;
    }

    const body = await res.json();
    onSave(body.expense);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <h2 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
            {expense ? "Edit expense" : "New expense"}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
            <XIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Description</label>
            <input
              type="text"
              placeholder="e.g. Adobe Creative Cloud subscription"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 dark:focus:ring-neutral-50/20"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 dark:focus:ring-neutral-50/20"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Amount + Currency + Date */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 dark:focus:ring-neutral-50/20"
              />
            </div>
            <div className="col-span-1 space-y-1.5">
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Currency</label>
              <input
                type="text"
                maxLength={3}
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 dark:focus:ring-neutral-50/20"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 dark:focus:ring-neutral-50/20"
              />
            </div>
          </div>

          {/* Client + Billable */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Client <span className="text-neutral-400 font-normal">(optional)</span></label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 dark:focus:ring-neutral-50/20"
              >
                <option value="">No client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name ?? c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Billable</label>
              <button
                type="button"
                onClick={() => setIsBillable((v) => !v)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  isBillable
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {isBillable ? "Billable to client" : "Non-billable"}
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Notes <span className="text-neutral-400 font-normal">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="Additional details…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-950 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950/20 dark:focus:ring-neutral-50/20 resize-none"
            />
          </div>

          {/* Receipt */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">Receipt <span className="text-neutral-400 font-normal">(optional)</span></label>
            {receiptUrl ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                >
                  {receiptName || "View receipt"}
                </a>
                <button
                  type="button"
                  onClick={() => { setReceiptUrl(""); setReceiptName(""); }}
                  className="text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            ) : (
              <label className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 text-sm text-neutral-500 dark:text-neutral-400 cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                <UploadIcon size={16} />
                {uploading ? "Uploading…" : "Upload receipt (PDF or image)"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 rounded-lg bg-neutral-950 dark:bg-neutral-50 px-4 py-2.5 text-sm font-medium text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : expense ? "Save changes" : "Add expense"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
