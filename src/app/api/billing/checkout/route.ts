import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { getOrCreateStripeCustomer } from "@/lib/billing";
import { requireOrg } from "@/lib/auth";
import { getPriceId, type PlanId } from "@/config/plans";

const schema = z.object({
  planId: z.enum(["starter", "business", "pro"]),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { planId } = parsed.data;
  const priceId = getPriceId(planId as PlanId);
  if (!priceId) {
    return NextResponse.json({ error: "Plan not configured" }, { status: 500 });
  }

  const org = await requireOrg();
  const customerId = await getOrCreateStripeCustomer(org);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
  const stripe = getStripe();

  // Only offer trial to orgs that have never had a Stripe subscription
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("org_id", org.id)
    .maybeSingle();

  const isNewSubscriber = !existingSub?.stripe_subscription_id;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { org_id: org.id, plan_id: planId },
    subscription_data: {
      ...(isNewSubscriber && {
        trial_period_days: 7,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      }),
      metadata: { org_id: org.id, plan_id: planId },
    },
    payment_method_collection: "always",
    success_url: `${appUrl}/settings/billing?upgraded=1`,
    cancel_url: `${appUrl}/settings/billing`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
