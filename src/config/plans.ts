export type PlanId = "starter" | "business" | "pro";

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
  price: string;
  period: string;
  users: string;
  popular?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "£79",
    period: "/year",
    users: "1 user",
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
    price: "£149",
    period: "/year",
    users: "Up to 5 users",
    popular: true,
    features: [
      "Everything in Starter",
      "PayPal payments",
      "Remove “Powered by Invoyr” branding",
      "Recurring invoices",
      "Team roles & permissions (up to 5)",
      "Advanced reports & ageing",
      "Accounting exports (QuickBooks & Xero)",
      "Bulk invoice actions",
      "Client statements",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "£249",
    period: "/year",
    users: "Unlimited users",
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
  bulk_invoice_actions: "Bulk invoice actions",
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

export function getPlanByPriceId(priceId: string): PlanId | null {
  const ids: Record<string, PlanId> = {
    [process.env.STRIPE_PRICE_ID_STARTER ?? ""]: "starter",
    [process.env.STRIPE_PRICE_ID_BUSINESS ?? ""]: "business",
    [process.env.STRIPE_PRICE_ID_PRO ?? ""]: "pro",
  };
  return ids[priceId] ?? null;
}

export function getPriceId(planId: PlanId): string {
  const ids: Record<PlanId, string> = {
    starter: process.env.STRIPE_PRICE_ID_STARTER ?? "",
    business: process.env.STRIPE_PRICE_ID_BUSINESS ?? "",
    pro: process.env.STRIPE_PRICE_ID_PRO ?? "",
  };
  return ids[planId];
}
