"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Client, Organisation } from "@/lib/supabase/types";

interface Props {
  org: Organisation;
  client?: Client;
  mode: "create" | "edit";
}

export default function ClientForm({ org, client, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(client?.name ?? "");
  const [company, setCompany] = useState(client?.company_name ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [address, setAddress] = useState(client?.address_line1 ?? "");
  const [city, setCity] = useState(client?.city ?? "");
  const [postcode, setPostcode] = useState(client?.postcode ?? "");
  const [vatNumber, setVatNumber] = useState(client?.vat_number ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      org_id: org.id,
      name,
      company_name: company || null,
      email: email || null,
      phone: phone || null,
      address_line1: address || null,
      city: city || null,
      postcode: postcode || null,
      vat_number: vatNumber || null,
      notes: notes || null,
    };

    if (mode === "create") {
      const { data, error: err } = await supabase.from("clients").insert(payload).select().single();
      if (err || !data) { setError(err?.message ?? "Failed"); setSaving(false); return; }
      router.push(`/clients/${data.id}`);
    } else if (client) {
      const { error: err } = await supabase.from("clients").update(payload).eq("id", client.id);
      if (err) { setError(err.message); setSaving(false); return; }
      router.push(`/clients/${client.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Contact name *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company">Company name</Label>
          <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postcode">Postcode</Label>
          <Input id="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="vatNumber">VAT number</Label>
        <Input id="vatNumber" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="GB123456789" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Add client" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
