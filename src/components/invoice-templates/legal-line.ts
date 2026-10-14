import type { Organisation } from "@/lib/supabase/types";

/**
 * The company's legal identity for an invoice footer — "Company no. 12345678 ·
 * Registered office: …". Only what the business has filled in; null if neither.
 * A UK limited company has to show both on its invoices.
 */
export function companyLegalLine(
  org: Pick<Organisation, "company_number" | "registered_address"> & { company_registration_number?: string | null }
): string | null {
  const number = (org.company_number || org.company_registration_number || "").trim();
  const office = (org.registered_address ?? "")
    .split(/\n+/)
    .map((line) => line.trim().replace(/,$/, ""))
    .filter(Boolean)
    .join(", ");

  const parts = [number && `Company no. ${number}`, office && `Registered office: ${office}`].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
