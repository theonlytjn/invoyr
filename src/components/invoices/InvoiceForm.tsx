"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { computeTotals } from "@/lib/invoice-totals";
import { formatDateInput } from "@/lib/utils";
import LineItemsEditor, { type LineItemRow } from "./LineItemsEditor";
import { TEMPLATE_MAP, TEMPLATE_LABELS } from "@/components/invoice-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import type { Client, Invoice, InvoiceItem, Organisation, InvoiceTemplate } from "@/lib/supabase/types";

interface Props {
  org: Organisation;
  clients: Client[];
  invoice?: Invoice;
  existingItems?: InvoiceItem[];
  invoiceNumber: string;
  mode: "create" | "edit";
}

function itemToRow(item: InvoiceItem): LineItemRow {
  return {
    id: String(item.id),
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    vat_rate: item.vat_rate,
  };
}

export default function InvoiceForm({ org, clients, invoice, existingItems, invoiceNumber, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState(invoice?.client_id ?? "");
  const [template, setTemplate] = useState<InvoiceTemplate>(invoice?.template ?? "tjn_classic");
  const [issueDate, setIssueDate] = useState(invoice?.issue_date ?? formatDateInput(new Date()));
  const [dueDate, setDueDate] = useState(invoice?.due_date ?? "");
  const [paymentTerms, setPaymentTerms] = useState<"0" | "7" | "14" | "30" | "custom">("30");
  const [notes, setNotes] = useState(invoice?.notes ?? org.default_notes ?? "");
  const [terms, setTerms] = useState(invoice?.terms ?? org.default_terms ?? "");
  const [items, setItems] = useState<LineItemRow[]>(
    existingItems?.map(itemToRow) ?? [
      { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, vat_rate: 20 },
    ]
  );

  function applyPaymentTerms(terms: "0" | "7" | "14" | "30" | "custom", fromDate: string) {
    setPaymentTerms(terms);
    if (terms === "custom") return;
    const base = new Date(fromDate);
    base.setDate(base.getDate() + Number(terms));
    setDueDate(base.toISOString().slice(0, 10));
  }

  const totals = computeTotals(items);
  const TemplatePreview = TEMPLATE_MAP[template];

  async function handleSave(status: "draft" | "issued") {
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      org_id: org.id,
      client_id: clientId || null,
      invoice_number: invoiceNumber,
      status,
      template,
      issue_date: issueDate,
      due_date: dueDate || null,
      currency: "GBP",
      subtotal: totals.subtotal,
      vat_amount: totals.vat_amount,
      total: totals.total,
      notes: notes || null,
      terms: terms || null,
    };

    if (mode === "create") {
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert(payload)
        .select()
        .single();

      if (invErr || !inv) {
        setError(invErr?.message ?? "Failed to create invoice");
        setSaving(false);
        return;
      }

      await supabase.from("invoice_items").insert(
        items.map((item, idx) => ({
          invoice_id: inv.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          sort_order: idx,
        }))
      );

      await supabase.from("audit_logs").insert({
        org_id: org.id,
        action: "invoice.created",
        entity_type: "invoice",
        entity_id: inv.id,
        meta: { invoice_number: inv.invoice_number },
      });

      router.push(`/invoices/${inv.id}`);
    } else if (invoice) {
      const { error: updateErr } = await supabase
        .from("invoices")
        .update({ ...payload, invoice_number: undefined })
        .eq("id", invoice.id);

      if (updateErr) {
        setError(updateErr.message);
        setSaving(false);
        return;
      }

      await supabase.from("invoice_items").delete().eq("invoice_id", invoice.id);
      await supabase.from("invoice_items").insert(
        items.map((item, idx) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          sort_order: idx,
        }))
      );

      router.push(`/invoices/${invoice.id}`);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Form */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">
          <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Invoice details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Invoice number</Label>
              <Input value={invoiceNumber} disabled className="bg-neutral-50" />
            </div>
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select value={template} onValueChange={(v) => setTemplate(v as InvoiceTemplate)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TEMPLATE_LABELS) as InvoiceTemplate[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TEMPLATE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}{c.company_name ? ` — ${c.company_name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Issue date</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => {
                  setIssueDate(e.target.value);
                  if (paymentTerms !== "custom") {
                    applyPaymentTerms(paymentTerms, e.target.value);
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment terms</Label>
              <Select
                value={paymentTerms}
                onValueChange={(v) => applyPaymentTerms(v as typeof paymentTerms, issueDate)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Due immediately</SelectItem>
                  <SelectItem value="7">Net 7 days</SelectItem>
                  <SelectItem value="14">Net 14 days</SelectItem>
                  <SelectItem value="30">Net 30 days</SelectItem>
                  <SelectItem value="custom">Custom date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {paymentTerms === "custom" ? (
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          ) : dueDate ? (
            <p className="text-sm text-neutral-500">
              Due on {new Date(dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          ) : null}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Line items</h2>
          <LineItemsEditor items={items} onChange={setItems} />

          <div className="flex justify-end">
            <div className="w-52 space-y-1.5 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>VAT</span>
                <span>{formatCurrency(totals.vat_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-200 dark:border-neutral-700 dark:text-neutral-50">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Notes & terms</h2>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes for the client"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payment terms</Label>
            <Textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="e.g. Payment due within 7 days"
              rows={2}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSave("draft")}
            disabled={saving}
          >
            Save as draft
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleSave("issued")}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save & issue"}
          </Button>
        </div>
      </div>

      {/* Live preview */}
      <div className="hidden xl:block">
        <div className="sticky top-6">
          <p className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-3">Preview</p>
          <div className="overflow-auto border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900" style={{ maxHeight: "85vh" }}>
            <div style={{ transform: "scale(0.75)", transformOrigin: "top left", width: "794px" }}>
              <TemplatePreview
                invoice={{
                  ...(invoice ?? {} as Invoice),
                  invoice_number: invoiceNumber,
                  issue_date: issueDate,
                  due_date: dueDate || null,
                  subtotal: totals.subtotal,
                  vat_amount: totals.vat_amount,
                  total: totals.total,
                  currency: "GBP",
                  notes: notes || null,
                  terms: terms || null,
                  template,
                  status: "draft",
                  id: invoice?.id ?? "",
                  org_id: org.id,
                  amount_paid: 0,
                  stripe_payment_link: null,
                  public_token: null,
                  sent_at: null,
                  paid_at: null,
                  voided_at: null,
                  created_at: "",
                  updated_at: "",
                  client_id: clientId || null,
                }}
                items={items.map((item, idx) => ({
                  id: idx,
                  invoice_id: "",
                  description: item.description,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  vat_rate: item.vat_rate,
                  line_total: item.quantity * item.unit_price,
                  sort_order: idx,
                }))}
                client={clients.find((c) => c.id === clientId) ?? null}
                org={org}
                totals={{ subtotal: totals.subtotal, vatAmount: totals.vat_amount, total: totals.total }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
