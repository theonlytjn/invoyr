"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Organisation } from "@/lib/supabase/types";

interface Props { org: Organisation }

export default function InvoiceSettingsForm({ org }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefix, setPrefix] = useState(org.invoice_prefix);
  const [nextNumber, setNextNumber] = useState(String(org.next_invoice_number));
  const [defaultTerms, setDefaultTerms] = useState(org.default_terms ?? "");
  const [defaultNotes, setDefaultNotes] = useState(org.default_notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("organisations")
      .update({
        invoice_prefix: prefix,
        next_invoice_number: parseInt(nextNumber, 10),
        default_terms: defaultTerms || null,
        default_notes: defaultNotes || null,
      })
      .eq("id", org.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const previewNumber = `${prefix}-${String(parseInt(nextNumber, 10) || 1).padStart(4, "0")}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Invoice settings</h2>
        <p className="text-sm text-gray-500">Configure defaults for all new invoices.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="prefix">Invoice prefix</Label>
          <Input id="prefix" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} placeholder="INV" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nextNumber">Next number</Label>
          <Input id="nextNumber" type="number" min="1" value={nextNumber} onChange={(e) => setNextNumber(e.target.value)} />
        </div>
      </div>

      <div className="p-3 bg-gray-50 rounded-lg text-sm">
        <span className="text-gray-500">Next invoice will be: </span>
        <span className="font-mono font-semibold text-gray-900">{previewNumber}</span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="defaultTerms">Default payment terms</Label>
        <Textarea
          id="defaultTerms"
          value={defaultTerms}
          onChange={(e) => setDefaultTerms(e.target.value)}
          placeholder="e.g. Payment due within 7 days. Late payment incurs a 1.5% fee."
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="defaultNotes">Default notes</Label>
        <Textarea
          id="defaultNotes"
          value={defaultNotes}
          onChange={(e) => setDefaultNotes(e.target.value)}
          placeholder="e.g. Thank you for your business."
          rows={2}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {saved && <p className="text-sm text-green-600">Saved!</p>}
      </div>
    </form>
  );
}
