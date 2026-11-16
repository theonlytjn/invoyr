"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Textarea } from "@/components/ui/textarea";
import LineItemsEditor, { type LineItemRow } from "@/components/invoices/LineItemsEditor";
import { computeTotals } from "@/lib/invoice-totals";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FREQUENCY_LABELS,
  FREQUENCY_PHRASES,
  RECURRING_DUE_DAYS,
  firstRunOnOrAfter,
  nextRunAfter,
  type RecurringFrequency,
} from "@/lib/recurring/schedule";
import type { Client, RecurringInvoiceWithClient } from "@/lib/supabase/types";

interface Props {
  clients: Client[];
  existing?: RecurringInvoiceWithClient;
}

function makeRows(items?: { description: string; quantity: number; unit_price: number; vat_rate: number }[]): LineItemRow[] {
  if (!items?.length) return [{ id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, vat_rate: 20 }];
  return items.map((i) => ({ id: crypto.randomUUID(), ...i }));
}

export default function RecurringForm({ clients, existing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState(existing?.client_id ?? "");
  const [frequency, setFrequency] = useState<RecurringFrequency>(existing?.frequency ?? "monthly");
  const [dueDays, setDueDays] = useState<number>(existing?.due_days ?? 30);
  const [startDate, setStartDate] = useState(existing?.start_date ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(existing?.end_date ?? "");
  const [currency, setCurrency] = useState(existing?.currency ?? "GBP");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [terms, setTerms] = useState(existing?.terms ?? "");
  const [autoSend, setAutoSend] = useState(existing?.auto_send ?? false);
  const [items, setItems] = useState<LineItemRow[]>(makeRows(existing?.recurring_invoice_items));

  const totals = computeTotals(items.map((i) => ({
    description: i.description,
    quantity: i.quantity,
    unit_price: i.unit_price,
    vat_rate: i.vat_rate,
  })));

  const today = new Date().toISOString().slice(0, 10);
  const firstRun = existing?.last_run_at
    ? nextRunAfter(startDate, frequency, existing.last_run_at)
    : firstRunOnOrAfter(startDate, frequency, today);
  const selectedClient = clients.find((c) => c.id === clientId);
  const autoSendProblem = autoSend
    ? !clientId
      ? "Choose a client so there's someone to send to."
      : !selectedClient?.email
        ? `${selectedClient?.name ?? "This client"} has no email address, so invoices will be saved as drafts instead.`
        : null
    : null;

  function handleSave() {
    setError(null);
    if (autoSend && !clientId) {
      setError("Choose a client to auto-send to, or turn auto-send off.");
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      setError("Every line needs a description.");
      return;
    }
    startTransition(async () => {
      const payload = {
        client_id: clientId || null,
        frequency,
        start_date: startDate,
        end_date: endDate || null,
        currency,
        notes: notes || null,
        terms: terms || null,
        auto_send: autoSend,
        due_days: dueDays,
        items: items.map((i, idx) => ({
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          vat_rate: i.vat_rate,
          sort_order: idx,
        })),
      };

      const res = existing
        ? await fetch(`/api/recurring-invoices/${existing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/recurring-invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Something went wrong.");
        return;
      }
      router.push("/invoices/recurring");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Schedule */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">
        <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Schedule</h2>

        <div className="space-y-1.5">
          <Label>Client</Label>
          <SearchableSelect
            value={clientId}
            onChange={setClientId}
            placeholder="Select a client (optional)"
            options={clients.map((c) => ({
              value: c.id,
              label: c.name,
              sublabel: c.company_name ?? undefined,
            }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["GBP", "USD", "EUR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First invoice on</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End date <span className="text-neutral-400 font-normal">(optional)</span></Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Payment terms on each invoice</Label>
          <Select value={String(dueDays)} onValueChange={(v) => setDueDays(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RECURRING_DUE_DAYS.map((t) => (
                <SelectItem key={t.days} value={String(t.days)}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="rounded-lg bg-neutral-50 dark:bg-neutral-800/60 px-3 py-2.5 text-sm text-neutral-600 dark:text-neutral-300">
          {startDate ? (
            <>
              Next invoice <strong className="text-neutral-900 dark:text-neutral-50">{formatDate(firstRun)}</strong>, then{" "}
              {FREQUENCY_PHRASES[frequency]}
              {endDate ? ` until ${formatDate(endDate)}` : ""}. Each one is{" "}
              {dueDays === 0 ? "due on receipt" : `due ${dueDays} days after it's issued`}, and{" "}
              {autoSend ? "emailed to your client automatically" : "saved as a draft for you to check and send"}.
            </>
          ) : (
            "Choose when the first invoice should be made."
          )}
        </p>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Auto-send to client</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Automatically send each generated invoice to the client by email
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoSend}
            onClick={() => setAutoSend((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 ${
              autoSend ? "bg-neutral-950 dark:bg-white" : "bg-neutral-200 dark:bg-neutral-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white dark:bg-neutral-950 shadow transition-transform ${
                autoSend ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
        {autoSendProblem && (
          <p className="text-xs text-amber-700 dark:text-amber-300">{autoSendProblem}</p>
        )}
      </div>

      {/* Line items */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
        <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Line items</h2>
        <LineItemsEditor items={items} currency={currency} onChange={setItems} />
        <div className="flex justify-end">
          <div className="w-52 space-y-1.5 text-sm">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span><span>{formatCurrency(totals.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>VAT</span><span>{formatCurrency(totals.vat_amount, currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-200 dark:border-neutral-700 dark:text-neutral-50">
              <span>Total</span><span>{formatCurrency(totals.total, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
        <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Notes & terms</h2>
        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes" rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Payment terms</Label>
          <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="e.g. Payment due within 7 days" rows={2} />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : existing ? "Save changes" : "Create schedule"}
        </Button>
      </div>
    </div>
  );
}
