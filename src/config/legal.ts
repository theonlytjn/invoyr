/**
 * The legal entity behind Invoyr, and the sub-processors it relies on, in one
 * place so the Terms, Privacy Policy and DPA can never disagree with each other.
 *
 * `companyNumber` stays null until Companies House registration completes —
 * the documents omit the clause rather than printing an empty placeholder.
 */
export const LEGAL_ENTITY = {
  name: "Invoyr Limited",
  tradingAs: "Invoyr",
  /**
   * The REGISTERED office, which is what the law requires to be published —
   * deliberately not a trading or home address.
   */
  address: "128 City Road, London, United Kingdom, EC1V 2NX",
  placeOfRegistration: "England and Wales",
  /** Companies House, registered 7 Oct 2026. */
  companyNumber: "17502051" as string | null,
  supportEmail: "support@invoyr.io",
  jurisdiction: "England and Wales",
} as const;

export interface SubProcessor {
  name: string;
  purpose: string;
  /** Where the data this provider handles is stored or processed. */
  location: string;
}

/**
 * Every third party that can process personal data on Invoyr's behalf.
 *
 * Verified against the running system (28 Sep 2026): the Supabase project is in
 * `eu-central-1` (Frankfurt), while the Vercel deployment region is `iad1`
 * (US East) — so application processing is transient but does reach the US, and
 * the transfers section has to say so.
 */
export const SUB_PROCESSORS: SubProcessor[] = [
  {
    name: "Supabase",
    purpose: "Database, authentication and file storage — where Customer Data is held at rest",
    location: "European Union (Frankfurt)",
  },
  {
    name: "Vercel",
    purpose: "Application hosting and content delivery — processes requests in transit",
    location: "United States, with global edge network",
  },
  {
    name: "Resend",
    purpose: "Sending transactional and marketing email",
    location: "United States / European Union",
  },
  {
    name: "Stripe",
    purpose: "Subscription billing, and card payments collected by Customers from their clients",
    location: "United States / European Union",
  },
  {
    name: "PayPal",
    purpose: "Payments collected by Customers from their clients, where enabled",
    location: "United States / European Union",
  },
  {
    name: "TrueLayer",
    purpose: "Open Banking connections and bank transaction data, where a Customer connects an account",
    location: "United Kingdom / European Union",
  },
  {
    name: "Cloudflare",
    purpose: "Turnstile anti-bot checks on sign-up and contact forms",
    location: "Global edge network",
  },
  {
    name: "Upstash",
    purpose: "Rate limiting — stores short-lived counters keyed to IP addresses",
    location: "European Union",
  },
];
