import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSettingsAccess } from "@/lib/settings/require-settings-access";

/**
 * Business details and bank details from Settings → Company. Moved off a
 * direct browser-to-Supabase write for the same reasons as the email settings
 * route: the cross-origin request was fragile on mobile, and an admin's save
 * was silently dropped by the owner-only RLS policy.
 */
const optional = (max: number) => z.string().trim().max(max).nullable().optional();

const schema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(200),
  email: z.string().trim().email("Invalid email").max(200).or(z.literal("")).nullable().optional(),
  website: z.string().trim().url("Invalid URL").max(300).or(z.literal("")).nullable().optional(),
  vatNumber: optional(50),
  companyNumber: optional(50),
  registeredAddress: optional(500),
  vatRegistered: z.boolean(),
  phone: optional(50),
  address: optional(200),
  city: optional(100),
  postcode: optional(20),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Brand colour must be a hex colour like #1a2b3c"),
  bankName: optional(100),
  bankAccountName: optional(100),
  bankAccountNumber: optional(34),
  bankSortCode: optional(20),
  bankIban: optional(34),
  bankBic: optional(11),
});

const orNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

export async function POST(req: NextRequest) {
  const access = await requireSettingsAccess();
  if (access.response) return access.response;
  const { org } = access;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }
  const d = parsed.data;

  const service = createServiceClient();
  const { data, error } = await service
    .from("organisations")
    .update({
      name: d.name,
      vat_number: orNull(d.vatNumber),
      company_number: orNull(d.companyNumber),
      registered_address: orNull(d.registeredAddress),
      vat_registered: d.vatRegistered,
      email: orNull(d.email),
      phone: orNull(d.phone),
      website: orNull(d.website),
      address_line1: orNull(d.address),
      city: orNull(d.city),
      postcode: orNull(d.postcode),
      accent_color: d.accentColor,
      bank_name: orNull(d.bankName),
      bank_account_name: orNull(d.bankAccountName),
      bank_account_number: orNull(d.bankAccountNumber),
      bank_sort_code: orNull(d.bankSortCode),
      bank_iban: orNull(d.bankIban),
      bank_bic: orNull(d.bankBic),
    })
    .eq("id", org.id)
    .select("id");

  if (error || !data?.length) {
    return NextResponse.json({ error: error?.message ?? "Details were not saved. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
