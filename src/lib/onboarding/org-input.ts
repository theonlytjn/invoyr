import { z } from "zod";
import { slugify } from "@/lib/utils";

/**
 * The organisation fields the onboarding wizard and /org/new collect. Only the
 * name is required: every other field has its own screen in the app later.
 */
export const orgCreateSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(100),
  slug: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Enter a valid email address").max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  postcode: z.string().trim().max(20).optional(),
  country: z.string().trim().length(2).optional(),
  vatNumber: z.string().trim().max(50).optional(),
  // Lenient on purpose: onboarding asks for a logo URL as free text, and a typo
  // there must never block the final step. An unusable value is dropped rather
  // than rejected — the logo is editable in settings afterwards.
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value && /^https?:\/\/\S+$/i.test(value) ? value : undefined)),
  plan: z.enum(["starter", "business", "pro"]).optional(),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Accent colour must be a hex value")
    .optional(),
});

export type OrgCreateInput = z.infer<typeof orgCreateSchema>;

/** Every field but the name is optional, whether or not a transform supplied it. */
export type OrgCreateFields = Partial<Omit<OrgCreateInput, "name">> & { name: string };

/** `organisations.slug` is unique, so a suffix of the new id keeps names collision-free. */
export function buildOrgSlug(input: Pick<OrgCreateFields, "name" | "slug">, orgId: string): string {
  const base = slugify(input.slug?.trim() || input.name);
  return `${base || "org"}-${orgId.slice(0, 6)}`;
}

/** Maps validated input onto the `organisations` columns, blanks becoming null. */
export function buildOrgRow(input: OrgCreateFields, orgId: string) {
  const blankToNull = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  return {
    id: orgId,
    name: input.name.trim(),
    slug: buildOrgSlug(input, orgId),
    email: blankToNull(input.email),
    phone: blankToNull(input.phone),
    address_line1: blankToNull(input.address),
    city: blankToNull(input.city),
    postcode: blankToNull(input.postcode),
    country: blankToNull(input.country) ?? "GB",
    vat_number: blankToNull(input.vatNumber),
    logo_url: blankToNull(input.logoUrl),
    accent_color: blankToNull(input.accentColor) ?? "#111827",
  };
}
