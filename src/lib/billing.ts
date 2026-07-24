import { getStripe } from "./stripe/client";
import { createServiceClient } from "./supabase/server";
import { canAccess, type Feature } from "@/config/plans";
import type { Organisation } from "./supabase/types";

export async function getOrCreateStripeCustomer(org: Organisation): Promise<string> {
  if (org.stripe_customer_id) return org.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: org.name,
    email: org.email ?? undefined,
    metadata: { org_id: org.id },
  });

  const supabase = await createServiceClient();
  await supabase
    .from("organisations")
    .update({ stripe_customer_id: customer.id })
    .eq("id", org.id);

  return customer.id;
}

export async function getSubscription(orgId: string) {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("org_id", orgId)
    .single();
  return data;
}

export function isSubscriptionActive(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export function getCompPlan(
  org: Pick<Organisation, "comp_plan" | "comp_expires_at">
): string | null {
  if (!org.comp_plan) return null;
  if (org.comp_expires_at && new Date(org.comp_expires_at) <= new Date()) return null;
  return org.comp_plan;
}

export async function getOrgPlan(orgId: string): Promise<string | null> {
  const supabase = await createServiceClient();

  // Complimentary access wins over Stripe and can never be revoked by a webhook.
  const { data: org } = await supabase
    .from("organisations")
    .select("comp_plan, comp_expires_at")
    .eq("id", orgId)
    .single();
  const comp = org ? getCompPlan(org) : null;
  if (comp) return comp;

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("org_id", orgId)
    .single();
  if (!data || !isSubscriptionActive(data.status)) return null;
  return data.plan ?? null;
}

export async function orgHasFeature(orgId: string, feature: Feature): Promise<boolean> {
  const plan = await getOrgPlan(orgId);
  return canAccess(plan, feature);
}

/**
 * Returns the set of org IDs currently entitled to `feature`, comp-aware.
 * Unions complimentary grants (which win over Stripe) with active subscriptions,
 * so batch jobs (e.g. reminder crons) don't have to read the subscriptions table
 * directly and silently exclude comp-only orgs that have no subscription row.
 */
export async function getOrgIdsWithFeature(feature: Feature): Promise<Set<string>> {
  const supabase = await createServiceClient();
  const ids = new Set<string>();

  const [{ data: comps }, { data: subs }] = await Promise.all([
    supabase
      .from("organisations")
      .select("id, comp_plan, comp_expires_at")
      .not("comp_plan", "is", null),
    supabase.from("subscriptions").select("org_id, plan, status"),
  ]);

  for (const o of comps ?? []) {
    const plan = getCompPlan(o);
    if (plan && canAccess(plan, feature)) ids.add(o.id);
  }
  for (const s of subs ?? []) {
    if (isSubscriptionActive(s.status) && canAccess(s.plan, feature)) ids.add(s.org_id);
  }

  return ids;
}
