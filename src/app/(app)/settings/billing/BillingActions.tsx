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
    <div className="space-y-6">
      {hasActiveSubscription && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={openPortal}
            disabled={loading === "portal"}
          >
            {loading === "portal" ? "Redirecting…" : "Manage billing"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPopular = plan.popular;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-xl border p-5 space-y-4",
                isCurrent
                  ? "border-gray-900 bg-gray-50"
                  : isPopular
                  ? "border-gray-300"
                  : "border-gray-200"
              )}
            >
              {isPopular && !isCurrent && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-gray-900 text-white text-xs font-medium rounded-full">
                  Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-green-700 text-white text-xs font-medium rounded-full">
                  Current plan
                </span>
              )}
              <div>
                <p className="font-semibold text-gray-900">{plan.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{plan.users}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-500">{plan.period}</span>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-green-600 mt-px">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={openPortal}
                  disabled={loading === "portal"}
                >
                  {loading === "portal" ? "Redirecting…" : "Manage"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => upgrade(plan.id as PlanId)}
                  disabled={!!loading}
                >
                  {loading === plan.id ? "Redirecting…" : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
