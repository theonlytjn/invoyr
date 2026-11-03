import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { getOrCreateStripeCustomer } from "@/lib/billing";
import { requireOrg } from "@/lib/auth";
import { DEFAULT_BILLING, getPriceId, TRIAL_DAYS, type PlanId } from "@/config/plans";
import { redeemTrialCode, trialCodeSchema } from "@/lib/trial-codes";

const schema = z.object({
  planId: z.enum(["starter", "business", "pro"]),
  billing: z.enum(["monthly", "yearly"]).default(DEFAULT_BILLING),
  /** Where the user came from, so they land somewhere sensible afterwards. */
  origin: z.enum(["billing", "onboarding"]).default("billing"),
  /** Early-access code: swaps the standard trial for a longer one. */
  trialCode: trialCodeSchema.optional(),
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

  const { planId, billing, origin, trialCode } = parsed.data;
  const priceId = getPriceId(planId as PlanId, billing);
  if (!priceId) {
    // Monthly prices are switched on separately; until then only yearly works.
    return NextResponse.json(
      { error: billing === "monthly" ? "Monthly billing isn't available yet" : "Plan not configured" },
      { status: billing === "monthly" ? 400 : 500 }
    );
  }

  const org = await requireOrg();
  const customerId = await getOrCreateStripeCustomer(org);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
  const stripe = getStripe();

  // Only offer trial to orgs that have never had a Stripe subscription
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("org_id", org.id)
    .maybeSingle();

  // A live subscription changes plan through /api/billing/change-plan; a second
  // checkout would leave the customer paying for two subscriptions.
  if (existingSub?.stripe_subscription_id && ["active", "trialing", "past_due"].includes(existingSub.status)) {
    return NextResponse.json({ error: "You already have a subscription. Change plan from Billing." }, { status: 409 });
  }

  const isNewSubscriber = !existingSub?.stripe_subscription_id;

  // A code only matters for a first subscription, which is the only one with a trial.
  let trialDays = TRIAL_DAYS;
  if (isNewSubscriber && trialCode) {
    const codeDays = await redeemTrialCode(org.id, trialCode);
    if (!codeDays) {
      return NextResponse.json({ error: "That early-access code isn't valid or has been used up" }, { status: 400 });
    }
    trialDays = codeDays;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { org_id: org.id, plan_id: planId },
    subscription_data: {
      ...(isNewSubscriber && {
        trial_period_days: trialDays,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      }),
      metadata: { org_id: org.id, plan_id: planId },
    },
    payment_method_collection: "always",
    success_url:
      origin === "onboarding"
        ? `${appUrl}/dashboard?welcome=1`
        : `${appUrl}/settings/billing?upgraded=1`,
    // A cancelled onboarding checkout still has an org, so it lands on billing
    // where the lockout explains what is needed.
    cancel_url: `${appUrl}/settings/billing${origin === "onboarding" ? "?reason=subscription_required" : ""}`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
