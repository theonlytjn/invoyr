import { getStripe } from "./stripe/client";
import { createServiceClient } from "./supabase/server";
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
  return status === "trialing" || status === "active";
}
