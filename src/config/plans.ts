/** Length of the free trial, both at signup and on Stripe checkout. */
export const TRIAL_DAYS = 14;

export type PlanId = "starter" | "business" | "pro";

export type BillingPeriod = "monthly" | "yearly";

/** Yearly is the default everywhere: it is the better deal and the one we lead with. */
export const DEFAULT_BILLING: BillingPeriod = "yearly";

/** What the pricing footnote says about VAT. Prices are VAT-inclusive. */
export const PRICING_FOOTNOTE = "Prices include VAT. Cancel anytime. 14-day free trial on every plan.";

export type Feature =
  | "custom_branding"
  | "recurring_invoices"
  | "team_members"
  | "unlimited_team_members"
  | "advanced_reports"
  | "csv_export"
  | "reminder_automation"
  | "custom_email_domain"
  | "audit_log"
  | "white_label"
  | "api_access"
  | "open_banking"
  | "bulk_invoice_actions"
  | "client_statements"
  | "accounting_export"
  | "paypal_payments";

export interface Plan {
  id: PlanId;
  name: string;
  /** Whole pounds, VAT included. Change prices here and nowhere else. */
  amounts: Record<BillingPeriod, number>;
  users: string;
  popular?: boolean;
  /** Short list for the homepage cards. */
  highlights: string[];
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    amounts: { monthly: 8, yearly: 79 },
    users: "1 user",
    highlights: ["Unlimited invoices & estimates", "Stripe card payments", "Bank transfer & 4 templates", "Expenses & multi-currency"],
    features: [
      "Unlimited invoices & estimates",
      "Client management",
      "Custom logo & branding",
      "Credit notes & late fees",
      "4 invoice templates",
      "Stripe card payments — get paid faster",
      "Pay by bank transfer",
      "PDF generation & email",
      "Expenses (manual entry)",
      "Multi-currency & VAT",
      "“Powered by Invoyr” shown on invoices",
    ],
  },
  {
    id: "business",
    name: "Business",
    amounts: { monthly: 15, yearly: 149 },
    users: "Up to 5 users",
    popular: true,
    highlights: ["Everything in Starter", "PayPal payments", "Remove “Powered by Invoyr”", "Recurring invoices & reports"],
    features: [
      "Everything in Starter",
      "PayPal payments",
      "Remove “Powered by Invoyr” branding",
      "Recurring invoices",
      "Team roles & permissions (up to 5)",
      "Advanced reports & ageing",
      "Accounting exports (QuickBooks & Xero)",
      "Bulk send, void, reminders & PDF export",
      "Client statements",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    amounts: { monthly: 25, yearly: 249 },
    users: "Unlimited users",
    highlights: ["Everything in Business", "Open Banking sync & import", "Automated reminders", "API access & webhooks"],
    features: [
      "Everything in Business",
      "Open Banking — bank sync & import",
      "Automated payment reminders",
      "CSV export",
      "Custom email domain",
      "White-label client portal",
      "Audit log access",
      "API access & webhooks",
      "Unlimited team members",
      "Priority support",
    ],
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;

const PLAN_FEATURES: Record<PlanId, Set<Feature>> = {
  starter: new Set([
    "custom_branding",
  ]),
  business: new Set([
    "custom_branding",
    "paypal_payments",
    "white_label",
    "recurring_invoices",
    "team_members",
    "advanced_reports",
    "bulk_invoice_actions",
    "client_statements",
    "accounting_export",
  ]),
  pro: new Set([
    "custom_branding",
    "paypal_payments",
    "white_label",
    "recurring_invoices",
    "team_members",
    "unlimited_team_members",
    "advanced_reports",
    "bulk_invoice_actions",
    "client_statements",
    "accounting_export",
    "csv_export",
    "reminder_automation",
    "custom_email_domain",
    "audit_log",
    "api_access",
    "open_banking",
  ]),
};

export const TEAM_MEMBER_CAP: Record<PlanId, number> = {
  starter: 1,
  business: 5,
  pro: Infinity,
};

export const FEATURE_UPGRADE_TARGET: Record<Feature, PlanId> = {
  custom_branding: "starter",
  paypal_payments: "business",
  recurring_invoices: "business",
  team_members: "business",
  unlimited_team_members: "pro",
  advanced_reports: "business",
  bulk_invoice_actions: "business",
  client_statements: "business",
  accounting_export: "business",
  csv_export: "pro",
  reminder_automation: "pro",
  custom_email_domain: "pro",
  audit_log: "pro",
  white_label: "business",
  api_access: "pro",
  open_banking: "pro",
};

export const FEATURE_LABELS: Record<Feature, string> = {
  custom_branding: "Custom logo & branding",
  recurring_invoices: "Recurring invoices",
  team_members: "Team members",
  unlimited_team_members: "Unlimited team members",
  advanced_reports: "Advanced reports",
  bulk_invoice_actions: "Bulk send, void, reminders & PDF export",
  client_statements: "Client statements",
  accounting_export: "Accounting exports (QuickBooks & Xero)",
  csv_export: "CSV export",
  reminder_automation: "Automated reminders",
  custom_email_domain: "Custom email domain",
  audit_log: "Audit log access",
  white_label: "Remove Invoyr branding",
  api_access: "API access & webhooks",
  open_banking: "Open Banking (bank sync)",
  paypal_payments: "PayPal payments",
};

export function canAccess(plan: string | null | undefined, feature: Feature): boolean {
  if (!plan) return false;
  return PLAN_FEATURES[plan as PlanId]?.has(feature) ?? false;
}

/** "£79", "£6.58": whole pounds stay whole. */
export function formatPounds(amount: number): string {
  return Number.isInteger(amount) ? `£${amount}` : `£${amount.toFixed(2)}`;
}

/** The yearly price spread over 12 months, rounded to the penny. */
export function yearlyPerMonth(plan: Plan): number {
  return Math.round((plan.amounts.yearly / 12) * 100) / 100;
}

/** What paying yearly saves against twelve monthly payments. */
export function yearlySaving(plan: Plan): number {
  return plan.amounts.monthly * 12 - plan.amounts.yearly;
}

/**
 * Stripe price IDs live in env vars, one per plan and period. The yearly ones
 * keep their original names (STRIPE_PRICE_ID_STARTER etc.) so nothing already
 * deployed has to change; the monthly ones carry a _MONTHLY suffix.
 */
function priceIds(): Record<PlanId, Record<BillingPeriod, string>> {
  return {
    starter: {
      yearly: process.env.STRIPE_PRICE_ID_STARTER ?? "",
      monthly: process.env.STRIPE_PRICE_ID_STARTER_MONTHLY ?? "",
    },
    business: {
      yearly: process.env.STRIPE_PRICE_ID_BUSINESS ?? "",
      monthly: process.env.STRIPE_PRICE_ID_BUSINESS_MONTHLY ?? "",
    },
    pro: {
      yearly: process.env.STRIPE_PRICE_ID_PRO ?? "",
      monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY ?? "",
    },
  };
}

/** Stripe's price interval, narrowed to the two Invoyr sells. */
export function billingIntervalOf(interval: string | null | undefined): "month" | "year" | null {
  return interval === "month" || interval === "year" ? interval : null;
}

export function getPlanByPriceId(priceId: string): PlanId | null {
  if (!priceId) return null;
  for (const [planId, periods] of Object.entries(priceIds())) {
    if (periods.yearly === priceId || periods.monthly === priceId) return planId as PlanId;
  }
  return null;
}

export function getPriceId(planId: PlanId, billing: BillingPeriod = DEFAULT_BILLING): string {
  return priceIds()[planId][billing];
}

/**
 * Monthly billing is switched on by setting all three monthly price IDs.
 * Until then the toggle still shows monthly prices, but monthly sign-up is
 * held back so nobody is sent to a checkout that can't charge them.
 * Server-only: reads env vars that are not exposed to the browser.
 */
export function isMonthlyBillingAvailable(): boolean {
  const ids = priceIds();
  return Boolean(ids.starter.monthly && ids.business.monthly && ids.pro.monthly);
}
