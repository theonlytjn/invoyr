import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { requireOrg } from "@/lib/auth";
import { roleCanDo } from "@/lib/permissions";
import { getPlanByPriceId, getPriceId, type PlanId } from "@/config/plans";
import { getEarlyOffer } from "@/lib/early-offer";

/** One coupon per percentage, created the first time it's needed. */
async function ensureCoupon(stripe: Stripe, percent: number): Promise<string> {
  const id = `EARLY-YEARLY-${percent}`;
  try {
    await stripe.coupons.retrieve(id);
  } catch (error) {
    if ((error as { code?: string }).code !== "resource_missing") throw error;
    await stripe.coupons.create({
      id,
      percent_off: percent,
      // "once" = the next invoice only, which on a yearly price is the first year.
      duration: "once",
      name: `Early adopter: ${percent}% off the first year`,
    });
  }
  return id;
}

/**
 * Claims an early adopter's yearly offer: moves the subscription to the
 * yearly price of its current plan with the discount on the first yearly
 * invoice. During the trial nothing is charged until it ends; after it, the
 * switch is immediate and Stripe credits what's left of the month.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.role || !roleCanDo(membership.role, "manage_billing")) {
    return NextResponse.json({ error: "Only the account owner can change billing." }, { status: 403 });
  }

  const offer = await getEarlyOffer(org.id);
  if (!offer?.claimable) {
    return NextResponse.json({ error: "This offer isn't available on your account." }, { status: 400 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("org_id", org.id)
    .maybeSingle();
  if (!sub?.stripe_subscription_id || !["active", "trialing", "past_due"].includes(sub.status)) {
    return NextResponse.json({ error: "There's no active subscription to apply it to." }, { status: 400 });
  }

  // Mark it claimed first so a double-click can't apply it twice.
  const service = await createServiceClient();
  const { data: claimed } = await service
    .from("trial_code_redemptions")
    .update({ offer_claimed_at: new Date().toISOString() })
    .eq("org_id", org.id)
    .is("offer_claimed_at", null)
    .select("org_id");
  if (!claimed?.length) {
    return NextResponse.json({ error: "You've already claimed this offer." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    let stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);

    // A pending yearly→monthly change would fight this one; drop it.
    const scheduleId = typeof stripeSub.schedule === "string" ? stripeSub.schedule : stripeSub.schedule?.id;
    if (scheduleId) {
      await stripe.subscriptionSchedules.release(scheduleId);
      stripeSub = await stripe.subscriptions.retrieve(stripeSub.id);
    }

    const item = stripeSub.items.data[0];
    const planId = (getPlanByPriceId(item.price.id) ?? stripeSub.metadata?.plan_id) as PlanId | undefined;
    const yearlyPriceId = planId ? getPriceId(planId, "yearly") : "";
    if (!planId || !yearlyPriceId) throw new Error("Couldn't work out the yearly price for this plan");

    const coupon = await ensureCoupon(stripe, offer.percent);

    await stripe.subscriptions.update(stripeSub.id, {
      items: [{ id: item.id, price: yearlyPriceId }],
      discounts: [{ coupon }],
      proration_behavior: stripeSub.status === "trialing" ? "none" : "create_prorations",
      metadata: { ...stripeSub.metadata, org_id: org.id, plan_id: planId },
    });

    await service.from("audit_logs").insert({
      org_id: org.id,
      action: "subscription.early_offer_claimed",
      entity_type: "subscription",
      entity_id: stripeSub.id,
      meta: { percent: offer.percent, plan: planId, code: offer.code },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Give the offer back so they can try again.
    await service.from("trial_code_redemptions").update({ offer_claimed_at: null }).eq("org_id", org.id);
    console.error("early offer claim failed", { orgId: org.id, error: error instanceof Error ? error.message : error });
    return NextResponse.json({ error: "We couldn't apply the offer. Please try again." }, { status: 500 });
  }
}
