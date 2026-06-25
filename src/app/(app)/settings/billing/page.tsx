import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { isSubscriptionActive } from "@/lib/billing";
import { PLAN_MAP } from "@/config/plans";
import Topbar from "@/components/shell/Topbar";
import { BillingActions } from "./BillingActions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Billing" };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing: { label: "Free trial", color: "bg-blue-50 text-blue-700" },
  active: { label: "Active", color: "bg-green-50 text-green-700" },
  past_due: { label: "Payment overdue", color: "bg-amber-50 text-amber-700" },
  canceled: { label: "Canceled", color: "bg-red-50 text-red-700" },
  incomplete: { label: "Incomplete", color: "bg-neutral-100 text-neutral-500" },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; upgraded?: string }>;
}) {
  const org = await requireOrg();
  const supabase = await createClient();
  const { reason, upgraded } = await searchParams;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("org_id", org.id)
    .single();

  const status = subscription?.status ?? "trialing";
  const plan = subscription?.plan ?? null;
  const planInfo = plan ? PLAN_MAP[plan as keyof typeof PLAN_MAP] ?? null : null;
  const statusMeta = STATUS_LABELS[status] ?? STATUS_LABELS.trialing;
  const isActive = isSubscriptionActive(status);

  const trialEnd = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at)
    : null;
  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div>
      <Topbar title="Billing" />
      <div className="p-6 max-w-2xl space-y-6">
        {upgraded === "1" && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            Your plan has been upgraded successfully. Welcome aboard!
          </div>
        )}

        {reason === "subscription_required" && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Your subscription has ended. Choose a plan below to restore access.
          </div>
        )}

        {status === "past_due" && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Your last payment failed. Please update your billing details to keep your account active.
          </div>
        )}

        {/* Current plan summary */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
          <h2 className="text-lg font-serif text-neutral-950">Current plan</h2>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-neutral-950">
                {planInfo?.name ?? "Free trial"}
              </p>
              {status === "trialing" && trialDaysLeft !== null && (
                <p className="text-sm text-neutral-500">
                  {trialDaysLeft > 0
                    ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining in your trial`
                    : "Your trial has ended"}
                </p>
              )}
              {status === "active" && periodEnd && (
                <p className="text-sm text-neutral-500">Renews {periodEnd}</p>
              )}
              {subscription?.cancel_at_period_end && periodEnd && (
                <p className="text-sm text-amber-600">Cancels on {periodEnd}</p>
              )}
            </div>
            <span
              className={`shrink-0 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusMeta.color}`}
            >
              {statusMeta.label}
            </span>
          </div>
        </div>

        {/* Plan selection / upgrade */}
        <div className="space-y-3">
          <h2 className="text-lg font-serif text-neutral-950">
            {isActive && plan ? "Change plan" : "Choose a plan"}
          </h2>
          <BillingActions
            currentPlan={plan}
            status={status}
            hasActiveSubscription={!!subscription?.stripe_subscription_id}
          />
        </div>
      </div>
    </div>
  );
}
