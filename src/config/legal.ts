/**
 * The legal entity behind Invoyr, in one place so the Terms, Privacy Policy and
 * any future DPA can never disagree with each other.
 *
 * `companyNumber` stays null until Companies House registration completes —
 * the Terms omit the clause rather than printing an empty placeholder.
 */
export const LEGAL_ENTITY = {
  name: "Invoyr Ltd",
  tradingAs: "Invoyr",
  address: "128 City Road, London, United Kingdom, EC1V 2NX",
  /** TODO: set once Invoyr Ltd is registered (expected 28 Sep 2026). */
  companyNumber: null as string | null,
  supportEmail: "support@invoyr.io",
  jurisdiction: "England and Wales",
} as const;
