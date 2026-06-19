export type PlanId = "starter" | "business" | "pro";

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
      "Basic reports",
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
      "Recurring invoices",
      "Automated reminders",
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
      "Custom email domain",
      "Automation workflows",
      "Priority support",
    ],
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, Plan>;

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

export const TRIAL_DAYS = 14;
