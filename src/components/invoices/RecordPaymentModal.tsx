"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDateInput } from "@/lib/utils";
import { outstandingBalance } from "@/lib/bulk-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Invoice, PaymentMethod } from "@/lib/supabase/types";

interface Props {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecordPaymentModal({ invoice, open, onClose, onSuccess }: Props) {
  const balance = outstandingBalance(invoice);

  const [amount, setAmount] = useState(balance.toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(formatDateInput(new Date()));
  const [writeOff, setWriteOff] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parsedAmount = parseFloat(amount) || 0;
  // Rounded to cents so floating-point noise (e.g. 100.10 - 100.10 producing a
  // sliver like -3.5e-15) can't flicker the checkbox on or off.
  const remainder = Math.round((balance - parsedAmount) * 100) / 100;

  // The checkbox disappears once the entered amount covers the full balance — if
  // it was ticked before the user topped the amount up, drop the flag too, so a
  // stale `writeOffRemainder: true` can't ride along on a full payment.
  useEffect(() => {
    if (remainder <= 0 && writeOff) setWriteOff(false);
  }, [remainder, writeOff]);

  // Every field re-syncs from the live invoice whenever the dialog opens — not just
  // `amount`. Without this, `amount` initialised once (from the balance at first
  // mount) and never changed again: after a part payment the balance shrinks, but
  // reopening the dialog would still show the old, now-too-large figure, which the
  // server would then reject. Keyed on `open` rather than done inside
  // `resetAndClose` because a `setTimeout`-deferred close (see the success path in
  // `handleSubmit`) closes over a stale `balance` from the render at submit time —
  // resetting on the next *open* instead always reads the current prop.
  useEffect(() => {
    if (open) {
      setAmount(balance.toFixed(2));
      setMethod("bank_transfer");
      setReference("");
      setPaidAt(formatDateInput(new Date()));
      setWriteOff(false);
      setError(null);
      setSuccessMessage(null);
    }
    // Intentionally only reacts to `open` transitioning — including `balance` would
    // re-run (and stomp on what the user is typing) on every render while the
    // dialog is already open, since `balance` is recomputed from `invoice` each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function resetAndClose() {
    setSuccessMessage(null);
    setWriteOff(false);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let res: Response;
    try {
      res = await fetch(`/api/invoices/${invoice.id}/record-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          method,
          reference: reference.trim() || undefined,
          paidAt: new Date(paidAt).toISOString(),
          writeOffRemainder: writeOff,
        }),
      });
    } catch {
      // A rejected fetch (offline, DNS, connection reset) used to leave an
      // unhandled rejection and `saving` stuck on. That was survivable while the
      // dialog could still be dismissed; now that dismissal is blocked during a
      // save, leaving `saving` on would trap the user in a modal with no way out.
      // The request may or may not have reached the server, so the copy must not
      // claim it didn't.
      setError("Could not reach the server. Check the invoice before trying again.");
      setSaving(false);
      return;
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(json.error ?? "Failed to record payment.");
      setSaving(false);
      return;
    }

    setSaving(false);

    const parts = [`Recorded payment of ${formatCurrency(parsedAmount, invoice.currency)}.`];
    if (json.creditNoteIssued) {
      // Reports the amount the server actually issued (`creditNoteAmount`), not the
      // client's predicted `remainder` — the two can diverge if, say, a late fee
      // landed between page load and submit, and the user should be told what was
      // really written off, not what they saw on screen a moment earlier.
      parts.push(
        `Wrote off ${formatCurrency(json.creditNoteAmount ?? 0, invoice.currency)} as credit note ${json.creditNoteNumber}.`
      );
    }
    setSuccessMessage(parts.join(" "));
    onSuccess();

    setTimeout(() => {
      resetAndClose();
    }, 1600);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Ignore every dismiss path — Escape, overlay click, the dialog's own
        // close button — while the request is in flight, not just Cancel. The
        // write lands regardless of whether this dialog is still on screen, so
        // dismissing it mid-flight would leave the user never told whether a
        // credit note was issued, or for how much, or under what number.
        if (saving) return;
        if (!next) resetAndClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        {successMessage ? (
          <p className="py-6 text-sm text-neutral-700 dark:text-neutral-300">{successMessage}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Amount ({invoice.currency})</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference (optional)</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction ID or reference number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date paid</Label>
              <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} required />
            </div>
            {remainder > 0 && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={writeOff}
                  onChange={(e) => setWriteOff(e.target.checked)}
                  className="mt-0.5 rounded border-neutral-300 dark:border-neutral-600 accent-neutral-950 dark:accent-neutral-50"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Write off the remaining {formatCurrency(remainder, invoice.currency)} as a credit note
                </span>
              </label>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetAndClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : writeOff && remainder > 0 ? "Record payment & write off" : "Record payment"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
