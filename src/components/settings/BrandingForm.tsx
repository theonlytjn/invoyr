"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Organisation } from "@/lib/supabase/types";

interface Props { org: Organisation }

export default function BrandingForm({ org }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(org.name);
  const [email, setEmail] = useState(org.email ?? "");
  const [phone, setPhone] = useState(org.phone ?? "");
  const [website, setWebsite] = useState(org.website ?? "");
  const [address, setAddress] = useState(org.address_line1 ?? "");
  const [city, setCity] = useState(org.city ?? "");
  const [postcode, setPostcode] = useState(org.postcode ?? "");
  const [vatNumber, setVatNumber] = useState(org.vat_number ?? "");
  const [accentColor, setAccentColor] = useState(org.accent_color);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("organisations")
      .update({
        name,
        email: email || null,
        phone: phone || null,
        website: website || null,
        address_line1: address || null,
        city: city || null,
        postcode: postcode || null,
        vat_number: vatNumber || null,
        accent_color: accentColor,
      })
      .eq("id", org.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Business details</h2>
        <p className="text-sm text-gray-500">This information appears on your invoices.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Business name *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
        <Label htmlFor="website">Website</Label>
        <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
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
        <Label>Brand colour</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
          />
          <span className="text-sm text-gray-500 font-mono">{accentColor}</span>
        </div>
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
