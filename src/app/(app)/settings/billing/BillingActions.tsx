"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PLANS, PLAN_MAP, type PlanId } from "@/config/plans";
import { cn } from "@/lib/utils";

interface Props {
  currentPlan: string | null;
  status: string;
  hasActiveSubscription: boolean;
}

export function BillingActions({ currentPlan, status, hasActiveSubscription }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

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

  async function upgrade(planId: PlanId) {
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {PLANS.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        const isPopular = plan.popular;

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
                  <span className="text-xs text-neutral-400">{plan.users}</span>
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-neutral-500 flex items-center gap-1">
                      <span className="text-green-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: price + CTA */}
              <div className="shrink-0 flex flex-col items-end gap-3">
                <div className="text-right">
                  <span className="text-xl font-bold text-neutral-950 dark:text-neutral-50">{plan.price}</span>
                  <span className="text-xs text-neutral-400 ml-1">{plan.period}</span>
                </div>
                {isCurrent ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openPortal}
                    disabled={loading === "portal"}
                  >
                    {loading === "portal" ? "Redirecting…" : "Manage"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => upgrade(plan.id as PlanId)}
                    disabled={!!loading}
                  >
                    {loading === plan.id ? "Redirecting…" : `Upgrade`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {hasActiveSubscription && (
        <div className="pt-1 flex justify-end">
          <button
            onClick={openPortal}
            disabled={loading === "portal"}
            className="text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors disabled:opacity-50"
          >
            {loading === "portal" ? "Redirecting…" : "Manage billing & invoices →"}
          </button>
        </div>
      )}
    </div>
  );
}
