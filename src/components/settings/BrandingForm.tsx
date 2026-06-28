"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Organisation } from "@/lib/supabase/types";

const schema = z.object({
  name: z.string().min(1, "Business name is required"),
  email: z.string().email("Invalid email").or(z.literal("")),
  website: z.string().url("Invalid URL").or(z.literal("")),
});

interface Props { org: Organisation; canUploadLogo?: boolean }

export default function BrandingForm({ org, canUploadLogo = false }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(org.name);
  const [companyRegNumber, setCompanyRegNumber] = useState(org.company_registration_number ?? "");
  const [vatNumber, setVatNumber] = useState(org.vat_number ?? "");
  const [vatRegistered, setVatRegistered] = useState(org.vat_registered);
  const [email, setEmail] = useState(org.email ?? "");
  const [phone, setPhone] = useState(org.phone ?? "");
  const [website, setWebsite] = useState(org.website ?? "");
  const [address, setAddress] = useState(org.address_line1 ?? "");
  const [city, setCity] = useState(org.city ?? "");
  const [postcode, setPostcode] = useState(org.postcode ?? "");
  const [accentColor, setAccentColor] = useState(org.accent_color);
  const [logoUrl, setLogoUrl] = useState(org.logo_url ?? "");
  const [bankName, setBankName] = useState(org.bank_name ?? "");
  const [bankAccountName, setBankAccountName] = useState(org.bank_account_name ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(org.bank_account_number ?? "");
  const [bankSortCode, setBankSortCode] = useState(org.bank_sort_code ?? "");
  const [bankIban, setBankIban] = useState(org.bank_iban ?? "");
  const [bankBic, setBankBic] = useState(org.bank_bic ?? "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${org.id}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setLogoError(uploadError.message);
      setLogoUploading(false);
      return;
    }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from("organisations").update({ logo_url: url }).eq("id", org.id);
    setLogoUrl(url);
    setLogoUploading(false);
  }

  async function handleRemoveLogo() {
    const supabase = createClient();
    await supabase.from("organisations").update({ logo_url: null }).eq("id", org.id);
    setLogoUrl("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = schema.safeParse({ name, email, website });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: saveErr } = await supabase
      .from("organisations")
      .update({
        name,
        company_registration_number: companyRegNumber || null,
        vat_number: vatNumber || null,
        vat_registered: vatRegistered,
        email: email || null,
        phone: phone || null,
        website: website || null,
        address_line1: address || null,
        city: city || null,
        postcode: postcode || null,
        accent_color: accentColor,
        bank_name: bankName || null,
        bank_account_name: bankAccountName || null,
        bank_account_number: bankAccountNumber || null,
        bank_sort_code: bankSortCode || null,
        bank_iban: bankIban || null,
        bank_bic: bankBic || null,
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
        <h2 className="text-lg font-semibold text-neutral-950 dark:text-white mb-1">Business details</h2>
        <p className="text-sm text-neutral-500">This information appears on your invoices.</p>
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <Label>Company logo</Label>
        {canUploadLogo ? (
          <>
            <p className="text-xs text-neutral-500">Shown on PDFs and the payment page. PNG, JPG or WebP, max 2 MB.</p>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Company logo" className="h-14 w-auto max-w-[140px] object-contain rounded border border-neutral-200 dark:border-neutral-700 p-1 bg-white" />
              ) : (
                <div className="h-14 w-28 rounded border border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800">
                  <span className="text-xs text-neutral-400">No logo</span>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Button type="button" variant="outline" size="sm" disabled={logoUploading} onClick={() => fileInputRef.current?.click()}>
                  {logoUploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
                </Button>
                {logoUrl && (
                  <button type="button" onClick={handleRemoveLogo} className="text-xs text-red-500 hover:text-red-700 text-left">
                    Remove
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
            </div>
            {logoError && <p className="text-xs text-red-600">{logoError}</p>}
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400 shrink-0">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-sm text-neutral-500">
              Custom logo & branding is available on the <a href="/settings/billing" className="font-medium text-neutral-950 dark:text-neutral-50 underline">Business plan</a>.
            </p>
          </div>
        )}
      </div>

      {/* Business name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Business name *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      {/* Registration + VAT */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="companyRegNumber">Company reg. number</Label>
          <Input id="companyRegNumber" value={companyRegNumber} onChange={(e) => setCompanyRegNumber(e.target.value)} placeholder="12345678" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vatNumber">VAT number</Label>
          <Input id="vatNumber" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} placeholder="GB123456789" />
        </div>
      </div>

      {/* VAT registered toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={vatRegistered}
          onClick={() => setVatRegistered(!vatRegistered)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${vatRegistered ? "bg-neutral-950" : "bg-neutral-200"}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${vatRegistered ? "translate-x-4.5" : "translate-x-0.5"}`} />
        </button>
        <Label className="cursor-pointer mb-0" onClick={() => setVatRegistered(!vatRegistered)}>
          VAT registered
        </Label>
      </div>

      {/* Contact */}
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

      {/* Address */}
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

      {/* Bank details */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
        <div>
          <h3 className="font-serif text-neutral-950 dark:text-white mb-1">Bank details</h3>
          <p className="text-sm text-neutral-500">Shown on invoices and the payment page so clients can pay by bank transfer.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bankAccountName">Account name</Label>
            <Input id="bankAccountName" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Acme Ltd" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankName">Bank name</Label>
            <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Barclays" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bankAccountNumber">Account number</Label>
            <Input id="bankAccountNumber" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="12345678" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankSortCode">Sort code</Label>
            <Input id="bankSortCode" value={bankSortCode} onChange={(e) => setBankSortCode(e.target.value)} placeholder="20-00-00" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bankIban">IBAN</Label>
            <Input id="bankIban" value={bankIban} onChange={(e) => setBankIban(e.target.value)} placeholder="GB29 NWBK 6016 1331 9268 19" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankBic">BIC / SWIFT</Label>
            <Input id="bankBic" value={bankBic} onChange={(e) => setBankBic(e.target.value)} placeholder="BARCGB22" />
          </div>
        </div>
      </div>

      {/* Brand colour */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
        <Label>Brand colour</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-neutral-200 cursor-pointer"
          />
          <span className="text-sm text-neutral-500 font-mono">{accentColor}</span>
        </div>
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
