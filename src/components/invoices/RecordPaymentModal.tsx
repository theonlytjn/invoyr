"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateInput } from "@/lib/utils";
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
  const [amount, setAmount] = useState(String(invoice.total - invoice.amount_paid));
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(formatDateInput(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const { error: payErr } = await supabase.from("payments").insert({
      org_id: invoice.org_id,
      invoice_id: invoice.id,
      amount: parseFloat(amount),
      currency: invoice.currency,
      method,
      reference: reference || null,
      paid_at: new Date(paidAt).toISOString(),
    });

    if (payErr) {
      setError(payErr.message);
      setSaving(false);
      return;
    }

    const newAmountPaid = invoice.amount_paid + parseFloat(amount);
    const isPaid = newAmountPaid >= invoice.total;
    const isPartial = !isPaid && newAmountPaid > 0;

    await supabase
      .from("invoices")
      .update({
        amount_paid: newAmountPaid,
        status: isPaid ? "paid" : isPartial ? "partial" : "sent",
        paid_at: isPaid ? new Date().toISOString() : null,
      })
      .eq("id", invoice.id);

    await supabase.from("audit_logs").insert({
      org_id: invoice.org_id,
      action: "payment.recorded",
      entity_type: "payment",
      entity_id: invoice.id,
      meta: { amount: parseFloat(amount), method },
    });

    setSaving(false);
    onSuccess();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
