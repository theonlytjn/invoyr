"use client";

import { useState } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
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
import { TEMPLATE_LABELS } from "@/components/invoice-templates";
import type { Organisation, InvoiceTemplate } from "@/lib/supabase/types";

const CURRENCIES = [
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "CAD", label: "CAD — Canadian Dollar (C$)" },
  { value: "AUD", label: "AUD — Australian Dollar (A$)" },
];

const VAT_RATES = [
  { value: "0", label: "0% — Zero rated" },
  { value: "5", label: "5% — Reduced rate" },
  { value: "20", label: "20% — Standard rate" },
];

const LATE_FEE_TYPES = [
  { value: "none", label: "No late fee" },
  { value: "percentage", label: "Percentage of invoice total" },
  { value: "fixed", label: "Fixed amount" },
] as const;

const schema = z.object({
  prefix: z.string().min(1, "Prefix is required").max(10, "Prefix too long"),
  nextNumber: z.coerce.number().int().min(1, "Must be at least 1"),
  defaultVatRate: z.coerce.number().min(0).max(100),
  lateFeeValue: z.coerce.number().min(0, "Must be 0 or more"),
  lateFeeGraceDays: z.coerce.number().int().min(0, "Must be 0 or more"),
});

interface Props { org: Organisation }

export default function InvoiceSettingsForm({ org }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prefix, setPrefix] = useState(org.invoice_prefix);
  const [nextNumber, setNextNumber] = useState(String(org.next_invoice_number));
  const [currency, setCurrency] = useState(org.currency ?? "GBP");
  const [defaultVatRate, setDefaultVatRate] = useState(String(org.default_vat_rate ?? 20));
  const [defaultTemplate, setDefaultTemplate] = useState(org.default_template ?? "tjn_classic");
  const [defaultTerms, setDefaultTerms] = useState(org.default_terms ?? "");
  const [defaultNotes, setDefaultNotes] = useState(org.default_notes ?? "");
  const [lateFeeType, setLateFeeType] = useState<'none' | 'percentage' | 'fixed'>(org.late_fee_type ?? 'none');
  const [lateFeeValue, setLateFeeValue] = useState(String(org.late_fee_value ?? 0));
  const [lateFeeGraceDays, setLateFeeGraceDays] = useState(String(org.late_fee_grace_days ?? 0));

  const previewNumber = `${prefix}-${String(parseInt(nextNumber, 10) || 1).padStart(4, "0")}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = schema.safeParse({ prefix, nextNumber, defaultVatRate, lateFeeValue, lateFeeGraceDays });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: saveErr } = await supabase
      .from("organisations")
      .update({
        invoice_prefix: prefix,
        next_invoice_number: result.data.nextNumber,
        currency,
        default_vat_rate: result.data.defaultVatRate,
        default_template: defaultTemplate,
        default_terms: defaultTerms || null,
        default_notes: defaultNotes || null,
        late_fee_type: lateFeeType,
        late_fee_value: lateFeeType === 'none' ? 0 : result.data.lateFeeValue,
        late_fee_grace_days: result.data.lateFeeGraceDays,
      })
      .eq("id", org.id);

    setSaving(false);
    if (saveErr) {
      setError(saveErr.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-white mb-1">Invoice settings</h2>
        <p className="text-sm text-neutral-500">Configure defaults for all new invoices.</p>
      </div>

      {/* Numbering */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-300">Numbering</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prefix">Invoice prefix</Label>
            <Input
              id="prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="INV"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nextNumber">Next number</Label>
            <Input
              id="nextNumber"
              type="number"
              min="1"
              value={nextNumber}
              onChange={(e) => setNextNumber(e.target.value)}
            />
          </div>
        </div>
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-sm">
          <span className="text-neutral-500">Next invoice will be: </span>
          <span className="font-mono font-semibold text-neutral-950 dark:text-white">{previewNumber}</span>
        </div>
      </div>

      {/* Currency & VAT */}
      <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-300">Financial defaults</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="defaultVatRate">Default VAT rate</Label>
            <Select value={defaultVatRate} onValueChange={setDefaultVatRate}>
              <SelectTrigger id="defaultVatRate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VAT_RATES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Default template */}
      <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-300 mb-3">Appearance</h3>
        <Label htmlFor="defaultTemplate">Default invoice template</Label>
        <Select value={defaultTemplate} onValueChange={setDefaultTemplate}>
          <SelectTrigger id="defaultTemplate">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(TEMPLATE_LABELS) as [InvoiceTemplate, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Defaults */}
      <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-300">Default content</h3>
        <div className="space-y-1.5">
          <Label htmlFor="defaultTerms">Payment terms</Label>
          <Textarea
            id="defaultTerms"
            value={defaultTerms}
            onChange={(e) => setDefaultTerms(e.target.value)}
            placeholder="e.g. Payment due within 14 days. Late payment incurs a 1.5% monthly fee."
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="defaultNotes">Notes</Label>
          <Textarea
            id="defaultNotes"
            value={defaultNotes}
            onChange={(e) => setDefaultNotes(e.target.value)}
            placeholder="e.g. Thank you for your business."
            rows={2}
          />
        </div>
      </div>

      {/* Late fees */}
      <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-300">Late fees</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Automatically added to overdue invoices.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lateFeeType">Late fee type</Label>
          <Select value={lateFeeType} onValueChange={(v) => setLateFeeType(v as typeof lateFeeType)}>
            <SelectTrigger id="lateFeeType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LATE_FEE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {lateFeeType !== 'none' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="lateFeeValue">
                {lateFeeType === 'percentage' ? 'Rate (%)' : `Amount (${currency})`}
              </Label>
              <Input
                id="lateFeeValue"
                type="number"
                min="0"
                step={lateFeeType === 'percentage' ? '0.1' : '0.01'}
                value={lateFeeValue}
                onChange={(e) => setLateFeeValue(e.target.value)}
                placeholder={lateFeeType === 'percentage' ? '1.5' : '25'}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lateFeeGraceDays">Grace period (days)</Label>
              <Input
                id="lateFeeGraceDays"
                type="number"
                min="0"
                value={lateFeeGraceDays}
                onChange={(e) => setLateFeeGraceDays(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-neutral-400">Days after due date before fee applies.</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {saved && <p className="text-sm text-green-600">Saved!</p>}
      </div>
    </form>
  );
}
