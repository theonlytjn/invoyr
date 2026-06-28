"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { computeTotals } from "@/lib/invoice-totals";
import { formatDateInput, formatCurrency } from "@/lib/utils";
import LineItemsEditor, { type LineItemRow } from "@/components/invoices/LineItemsEditor";
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
import type { Client, Estimate, EstimateItem, Organisation, InvoiceTemplate, Invoice, InvoiceItem } from "@/lib/supabase/types";

interface Props {
  org: Organisation;
  clients: Client[];
  estimate?: Estimate;
  existingItems?: EstimateItem[];
  mode: "create" | "edit";
}

function itemToRow(item: EstimateItem): LineItemRow {
  return {
    id: String(item.id),
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    vat_rate: item.vat_rate,
  };
}

export default function EstimateForm({ org, clients, estimate, existingItems, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState(estimate?.client_id ?? "");
  const [template, setTemplate] = useState<InvoiceTemplate>(estimate?.template ?? (org.default_template as InvoiceTemplate) ?? "tjn_classic");
  const [issueDate, setIssueDate] = useState(estimate?.issue_date ?? formatDateInput(new Date()));
  const [expiryDate, setExpiryDate] = useState(estimate?.expiry_date ?? "");
  const [expiryTerms, setExpiryTerms] = useState<"7" | "14" | "30" | "60" | "custom">("30");
  const [notes, setNotes] = useState(estimate?.notes ?? org.default_notes ?? "");
  const [terms, setTerms] = useState(estimate?.terms ?? org.default_terms ?? "");
  const [poNumber, setPoNumber] = useState(estimate?.po_number ?? "");
  const [discount, setDiscount] = useState(estimate?.discount ?? 0);
  const [items, setItems] = useState<LineItemRow[]>(
    existingItems?.map(itemToRow) ?? [
      { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, vat_rate: 20 },
    ]
  );

  function applyExpiryTerms(t: typeof expiryTerms, fromDate: string) {
    setExpiryTerms(t);
    if (t === "custom") return;
    const base = new Date(fromDate);
    base.setDate(base.getDate() + Number(t));
    setExpiryDate(base.toISOString().slice(0, 10));
  }

  const totals = computeTotals(items, discount);
  const TemplatePreview = TEMPLATE_MAP[template];

  async function handleSave() {
    setSaving(true);
    setError(null);

    const payload = {
      client_id: clientId || null,
      template,
      issue_date: issueDate,
      expiry_date: expiryDate || null,
      currency: "GBP",
      po_number: poNumber || null,
      discount: totals.discount,
      notes: notes || null,
      terms: terms || null,
      items: items.map((item, i) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        sort_order: i,
      })),
    };

    try {
      if (mode === "create") {
        const res = await fetch("/api/estimates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to create estimate");
        router.push(`/estimates/${json.data.id}`);
      } else if (estimate) {
        const res = await fetch(`/api/estimates/${estimate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to update estimate");
        router.push(`/estimates/${estimate.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  // Shape for template preview (estimates reuse invoice templates)
  const previewInvoice: Invoice = {
    id: estimate?.id ?? "",
    org_id: org.id,
    client_id: clientId || null,
    invoice_number: estimate?.estimate_number ?? "EST-0001",
    status: "draft",
    template,
    issue_date: issueDate,
    due_date: expiryDate || null,
    currency: "GBP",
    po_number: poNumber || null,
    subtotal: totals.subtotal,
    discount: totals.discount,
    vat_amount: totals.vat_amount,
    total: totals.total,
    amount_paid: 0,
    notes: notes || null,
    terms: terms || null,
    stripe_payment_link: null,
    public_token: null,
    sent_at: null,
    paid_at: null,
    voided_at: null,
    created_at: "",
    updated_at: "",
  };

  const previewItems: InvoiceItem[] = items.map((item, idx) => ({
    id: idx,
    invoice_id: "",
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    vat_rate: item.vat_rate,
    line_total: item.quantity * item.unit_price,
    sort_order: idx,
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Form */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">
          <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Estimate details</h2>

          {estimate && (
            <div className="space-y-1.5">
              <Label>Estimate number</Label>
              <Input value={estimate.estimate_number} disabled className="bg-neutral-50" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Template</Label>
            <Select value={template} onValueChange={(v) => setTemplate(v as InvoiceTemplate)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TEMPLATE_LABELS) as InvoiceTemplate[]).map((t) => (
                  <SelectItem key={t} value={t}>{TEMPLATE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>PO number <span className="text-neutral-400">(optional)</span></Label>
            <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="e.g. PO-12345" />
          </div>

          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
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
              <Input type="date" value={issueDate} onChange={(e) => {
                setIssueDate(e.target.value);
                if (expiryTerms !== "custom") applyExpiryTerms(expiryTerms, e.target.value);
              }} />
            </div>
            <div className="space-y-1.5">
              <Label>Valid for</Label>
              <Select value={expiryTerms} onValueChange={(v) => applyExpiryTerms(v as typeof expiryTerms, issueDate)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="custom">Custom date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {expiryTerms === "custom" ? (
            <div className="space-y-1.5">
              <Label>Expiry date</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          ) : expiryDate ? (
            <p className="text-sm text-neutral-500">
              Expires on {new Date(expiryDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          ) : null}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Line items</h2>
          <LineItemsEditor items={items} onChange={setItems} />

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-1.5 sm:w-48">
              <Label>Discount (GBP)</Label>
              <Input
                type="number" min="0" step="0.01"
                value={discount === 0 ? "" : discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div className="w-52 space-y-1.5 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>VAT</span><span>{formatCurrency(totals.vat_amount)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>Discount</span><span>−{formatCurrency(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-200 dark:border-neutral-700 dark:text-neutral-50">
                <span>Total</span><span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
          <h2 className="font-semibold text-neutral-950 dark:text-neutral-50">Notes & terms</h2>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes for the client" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Terms</Label>
            <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="e.g. This estimate is valid for 30 days" rows={2} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()} disabled={saving}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create estimate" : "Save changes"}
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
                invoice={previewInvoice}
                items={previewItems}
                client={clients.find((c) => c.id === clientId) ?? null}
                org={org}
                totals={{ subtotal: totals.subtotal, vatAmount: totals.vat_amount, discount: totals.discount, total: totals.total }}
                documentType="estimate"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
