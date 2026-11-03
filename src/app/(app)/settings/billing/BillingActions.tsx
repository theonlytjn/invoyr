"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BillingToggle from "@/components/pricing/BillingToggle";
import {
  PLANS,
  PRICING_FOOTNOTE,
  formatPounds,
  yearlyPerMonth,
  yearlySaving,
  type BillingPeriod,
  type PlanId,
} from "@/config/plans";
import { cn } from "@/lib/utils";

interface Props {
  currentPlan: string | null;
  /** "month" | "year" from the subscription, when there is one. */
  currentInterval: string | null;
  status: string;
  /** A live Stripe subscription: plan changes go through change-plan, not checkout. */
  hasLiveSubscription: boolean;
  hasActiveSubscription: boolean;
  monthlyAvailable: boolean;
}

const PERIOD_OF: Record<string, BillingPeriod> = { month: "monthly", year: "yearly" };

export function BillingActions({
  currentPlan,
  currentInterval,
  status,
  hasLiveSubscription,
  hasActiveSubscription,
  monthlyAvailable,
}: Props) {
  const router = useRouter();
  const currentPeriod = currentInterval ? PERIOD_OF[currentInterval] ?? null : null;
  const [billing, setBilling] = useState<BillingPeriod>(currentPeriod ?? "yearly");
  const [loading, setLoading] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const trialing = status === "trialing";

  async function openPortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function checkout(planId: PlanId) {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billing }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Couldn't start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function changePlan(planId: PlanId, period: BillingPeriod) {
    const key = `${planId}:${period}`;
    setLoading(key);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billing: period }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't change your plan. Please try again.");
        return;
      }
      setConfirming(null);
      if (data.scheduled && data.effectiveAt) {
        const date = new Date(data.effectiveAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        setNotice(`Done. You'll move to monthly billing when your current year ends on ${date}.`);
      } else {
        setNotice("Your plan has been changed.");
      }
      // The webhook updates our copy too; syncing now means the page is right straight away.
      await fetch("/api/billing/sync", { method: "POST" }).catch(() => null);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  function choose(planId: PlanId) {
    if (!hasLiveSubscription) return checkout(planId);
    // A paid subscription is charged (or credited) straight away, so ask first.
    if (!trialing) return setConfirming(`${planId}:${billing}`);
    return changePlan(planId, billing);
  }

  const current = PLANS.find((p) => p.id === currentPlan);
  const showYearlyNudge = hasLiveSubscription && currentPeriod === "monthly" && current;

  return (
    <div className="space-y-4">
      {showYearlyNudge && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-neutral-800 dark:text-neutral-100">
          <span>Switch to yearly and save {formatPounds(yearlySaving(current))} a year.</span>
          <Button size="sm" variant="outline" onClick={() => { setBilling("yearly"); setConfirming(`${current.id}:yearly`); }}>
            Switch to yearly
          </Button>
        </div>
      )}

      <BillingToggle value={billing} onChange={setBilling} />

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
          {notice}
        </p>
      )}

      <div className="space-y-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id && (currentPeriod ?? "yearly") === billing;
          const isPopular = plan.popular;
          const available = billing === "yearly" || monthlyAvailable;
          const key = `${plan.id}:${billing}`;
          const isDowngradeToMonthly = hasLiveSubscription && !trialing && currentPeriod === "yearly" && billing === "monthly";

          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-xl border p-5",
                isCurrent
                  ? "border-neutral-950 dark:border-neutral-50 bg-neutral-50 dark:bg-neutral-800"
                  : isPopular
                  ? "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                  : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              )}
            >
              <div className="flex items-start justify-between gap-6">
                {/* Left: name + features */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-950 dark:text-neutral-50">{plan.name}</p>
                    {isPopular && !isCurrent && (
                      <span className="px-2 py-0.5 bg-neutral-950 text-white text-[10px] font-medium rounded-full leading-none">
                        Popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-green-700 text-white text-[10px] font-medium rounded-full leading-none">
                        Current plan
                      </span>
                    )}
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{plan.users}</span>
                  </div>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {plan.features.map((f) => (
                      <li key={f} className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <span className="text-green-600">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: price + CTA */}
                <div className="shrink-0 flex flex-col items-end gap-3">
                  <div className="text-right">
                    <span className="text-xl font-bold text-neutral-950 dark:text-neutral-50">
                      {formatPounds(plan.amounts[billing])}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
                      {billing === "yearly" ? "/year" : "/month"}
                    </span>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {billing === "yearly"
                        ? `${formatPounds(yearlyPerMonth(plan))}/month · save ${formatPounds(yearlySaving(plan))}`
                        : "Billed monthly"}
                    </p>
                  </div>
                  {isCurrent ? (
                    <Button variant="outline" size="sm" onClick={openPortal} disabled={loading === "portal"}>
                      {loading === "portal" ? "Redirecting…" : "Manage"}
                    </Button>
                  ) : !available ? (
                    <Button size="sm" variant="outline" disabled>
                      Coming soon
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => choose(plan.id)} disabled={!!loading}>
                      {loading === plan.id || loading === key ? "Working…" : hasLiveSubscription ? "Switch" : "Choose"}
                    </Button>
                  )}
                </div>
              </div>

              {confirming === key && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-700 pt-4 text-sm text-neutral-600 dark:text-neutral-300">
                  <span>
                    {isDowngradeToMonthly
                      ? "Your current year runs to the end, then you'll be billed monthly."
                      : "Stripe will charge or credit the difference for the rest of this billing period today."}
                  </span>
                  <span className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setConfirming(null)} disabled={!!loading}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => changePlan(plan.id, billing)} disabled={!!loading}>
                      {loading === key ? "Switching…" : `Switch to ${plan.name} ${billing}`}
                    </Button>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">{PRICING_FOOTNOTE}</p>

      {hasActiveSubscription && (
        <div className="pt-1 flex justify-end">
          <button
            onClick={openPortal}
            disabled={loading === "portal"}
            className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 transition-colors disabled:opacity-50"
          >
            {loading === "portal" ? "Redirecting…" : "Manage billing & invoices →"}
          </button>
        </div>
      )}
    </div>
  );
}
