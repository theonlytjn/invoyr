import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { requireOrg } from "@/lib/auth";
import { roleCanDo } from "@/lib/permissions";
import { getPriceId } from "@/config/plans";

const schema = z.object({
  planId: z.enum(["starter", "business", "pro"]),
  billing: z.enum(["monthly", "yearly"]),
});

const LIVE_STATUSES = ["active", "trialing", "past_due"];

/**
 * Moves an existing subscription to another plan or billing period. Checkout
 * is only for a first subscription: sending a subscriber back through it
 * would open a second subscription alongside the first.
 *
 * - Yearly → monthly on a paid subscription takes effect at renewal, so the
 *   year already paid for runs out first (a subscription schedule).
 * - Everything else is immediate. Stripe prorates; monthly → yearly starts the
 *   year today and credits what's left of the month.
 * - During a trial nothing has been charged, so the switch is simply made.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  const { planId, billing } = parsed.data;

  const org = await requireOrg();

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.role || !roleCanDo(membership.role, "manage_billing")) {
    return NextResponse.json({ error: "Only the account owner can change the plan." }, { status: 403 });
  }

  const newPriceId = getPriceId(planId, billing);
  if (!newPriceId) {
    return NextResponse.json({ error: "That billing option isn't available yet." }, { status: 400 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("org_id", org.id)
    .maybeSingle();
  if (!sub?.stripe_subscription_id || !LIVE_STATUSES.includes(sub.status)) {
    return NextResponse.json({ error: "There's no active subscription to change." }, { status: 400 });
  }

  const stripe = getStripe();
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
  const item = stripeSub.items.data[0];
  if (!item) return NextResponse.json({ error: "Subscription has no plan to change." }, { status: 400 });
  if (item.price.id === newPriceId) {
    return NextResponse.json({ error: "You're already on that plan." }, { status: 400 });
  }

  const metadata = { ...stripeSub.metadata, org_id: org.id, plan_id: planId };
  const currentInterval = item.price.recurring?.interval;

  if (currentInterval === "year" && billing === "monthly" && stripeSub.status !== "trialing") {
    // Replace any earlier pending change rather than stacking schedules.
    const existingScheduleId =
      typeof stripeSub.schedule === "string" ? stripeSub.schedule : stripeSub.schedule?.id ?? null;
    const schedule = existingScheduleId
      ? await stripe.subscriptionSchedules.retrieve(existingScheduleId)
      : await stripe.subscriptionSchedules.create({ from_subscription: stripeSub.id });
    const current = schedule.phases[0];

    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: item.price.id, quantity: item.quantity ?? 1 }],
          start_date: current.start_date,
          end_date: item.current_period_end,
        },
        {
          items: [{ price: newPriceId, quantity: 1 }],
          duration: { interval: "month", interval_count: 1 },
          metadata,
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      scheduled: true,
      effectiveAt: new Date(item.current_period_end * 1000).toISOString(),
    });
  }

  await stripe.subscriptions.update(stripeSub.id, {
    items: [{ id: item.id, price: newPriceId }],
    proration_behavior: stripeSub.status === "trialing" ? "none" : "create_prorations",
    metadata,
  });

  return NextResponse.json({ ok: true, scheduled: false });
}
