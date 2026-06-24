import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { requireOrg } from "@/lib/auth";
import { getPlanByPriceId } from "@/config/plans";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const { data: orgRow } = await supabase
    .from("organisations")
    .select("stripe_customer_id")
    .eq("id", org.id)
    .single();

  if (!orgRow?.stripe_customer_id) {
    return NextResponse.json({ ok: true, synced: false });
  }

  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({
    customer: orgRow.stripe_customer_id,
    status: "all",
    limit: 5,
  });

  const activeSub = subs.data.find((s) =>
    ["active", "trialing", "past_due", "incomplete"].includes(s.status)
  ) ?? subs.data[0];

  if (!activeSub) {
    return NextResponse.json({ ok: true, synced: false });
  }

  const firstItem = activeSub.items.data[0];
  const priceId = firstItem?.price?.id ?? null;
  const resolvedPlan =
    activeSub.metadata?.plan_id ??
    (priceId ? getPlanByPriceId(priceId) : null);

  const statusMap: Record<string, string> = {
    trialing: "trialing",
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    incomplete: "incomplete",
    incomplete_expired: "canceled",
    unpaid: "past_due",
    paused: "past_due",
  };

  const serviceClient = await createServiceClient();
  await serviceClient.from("subscriptions").upsert(
    {
      org_id: org.id,
      stripe_subscription_id: activeSub.id,
      stripe_price_id: priceId,
      plan: resolvedPlan,
      status: (statusMap[activeSub.status] ?? "active") as never,
      trial_ends_at: activeSub.trial_end
        ? new Date(activeSub.trial_end * 1000).toISOString()
        : null,
      current_period_start: firstItem?.current_period_start
        ? new Date(firstItem.current_period_start * 1000).toISOString()
        : null,
      current_period_end: firstItem?.current_period_end
        ? new Date(firstItem.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: activeSub.cancel_at_period_end,
    },
    { onConflict: "org_id" }
  );

  return NextResponse.json({ ok: true, synced: true, plan: resolvedPlan, status: activeSub.status });
}
