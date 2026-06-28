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
  | "audit_log";

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
      "Unlimited invoices",
      "Client management",
      "4 invoice templates",
      "Stripe payments",
      "PDF generation & email",
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
      "Custom logo & branding",
      "Recurring invoices",
      "Team roles & permissions",
      "Advanced reports",
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
      "Automated reminders",
      "CSV export",
      "Custom email send domain",
      "Audit log access",
      "Priority support",
    ],
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;

const PLAN_FEATURES: Record<PlanId, Set<Feature>> = {
  starter: new Set([]),
  business: new Set([
    "custom_branding",
    "recurring_invoices",
    "team_members",
    "advanced_reports",
  ]),
  pro: new Set([
    "custom_branding",
    "recurring_invoices",
    "team_members",
    "unlimited_team_members",
    "advanced_reports",
    "csv_export",
    "reminder_automation",
    "custom_email_domain",
    "audit_log",
  ]),
};

export const TEAM_MEMBER_CAP: Record<PlanId, number> = {
  starter: 1,
  business: 5,
  pro: Infinity,
};

export const FEATURE_UPGRADE_TARGET: Record<Feature, PlanId> = {
  custom_branding: "business",
  recurring_invoices: "business",
  team_members: "business",
  unlimited_team_members: "pro",
  advanced_reports: "business",
  csv_export: "pro",
  reminder_automation: "pro",
  custom_email_domain: "pro",
  audit_log: "pro",
};

export const FEATURE_LABELS: Record<Feature, string> = {
  custom_branding: "Custom logo & branding",
  recurring_invoices: "Recurring invoices",
  team_members: "Team members",
  unlimited_team_members: "Unlimited team members",
  advanced_reports: "Advanced reports",
  csv_export: "CSV export",
  reminder_automation: "Automated reminders",
  custom_email_domain: "Custom email domain",
  audit_log: "Audit log access",
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
