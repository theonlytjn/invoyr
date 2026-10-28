import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSettingsAccess } from "@/lib/settings/require-settings-access";
import type { InvoiceTemplate } from "@/lib/supabase/types";

/**
 * Invoice defaults from Settings → Invoices. Moved off a direct
 * browser-to-Supabase write: see the email settings route for why.
 */
const TEMPLATES = ["tjn_classic", "clean_minimal", "bold_split", "modern_studio"] as const satisfies readonly InvoiceTemplate[];
const CURRENCIES = ["GBP", "USD", "EUR", "CAD", "AUD"] as const;

const schema = z.object({
  prefix: z.string().trim().min(1, "Prefix is required").max(10, "Prefix too long"),
  nextNumber: z.coerce.number().int().min(1, "Next number must be at least 1"),
  currency: z.enum(CURRENCIES),
  defaultVatRate: z.coerce.number().min(0).max(100),
  defaultTemplate: z.enum(TEMPLATES),
  defaultTerms: z.string().max(5000).nullable(),
  defaultNotes: z.string().max(5000).nullable(),
  lateFeeType: z.enum(["none", "percentage", "fixed"]),
  lateFeeValue: z.coerce.number().min(0, "Late fee must be 0 or more"),
  lateFeeGraceDays: z.coerce.number().int().min(0, "Grace period must be 0 or more"),
});

export async function POST(req: NextRequest) {
  const access = await requireSettingsAccess();
  if (access.response) return access.response;
  const { org } = access;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings" }, { status: 400 });
  }
  const d = parsed.data;

  const service = createServiceClient();
  const { data, error } = await service
    .from("organisations")
    .update({
      invoice_prefix: d.prefix.toUpperCase(),
      next_invoice_number: d.nextNumber,
      currency: d.currency,
      default_vat_rate: d.defaultVatRate,
      default_template: d.defaultTemplate,
      default_terms: d.defaultTerms?.trim() || null,
      default_notes: d.defaultNotes?.trim() || null,
      late_fee_type: d.lateFeeType,
      late_fee_value: d.lateFeeType === "none" ? 0 : d.lateFeeValue,
      late_fee_grace_days: d.lateFeeGraceDays,
    })
    .eq("id", org.id)
    .select("id");

  if (error || !data?.length) {
    return NextResponse.json({ error: error?.message ?? "Settings were not saved. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
