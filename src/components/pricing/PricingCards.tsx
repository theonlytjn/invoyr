"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_BILLING,
  PLANS,
  PRICING_FOOTNOTE,
  formatPounds,
  yearlyPerMonth,
  yearlySaving,
  type BillingPeriod,
} from "@/config/plans";
import BillingToggle from "./BillingToggle";
import { cn } from "@/lib/utils";

interface Props {
  /** False until the monthly Stripe prices exist; monthly sign-up is held back. */
  monthlyAvailable: boolean;
  /** The homepage lists a few features per card; the pricing page has a full table below. */
  showHighlights?: boolean;
  /** Carried to signup, e.g. an early-access code. */
  signupParams?: Record<string, string>;
  /** Defaults to the standard VAT and trial line. */
  footnote?: string;
}

function readBillingParam(): BillingPeriod | null {
  const value = new URLSearchParams(window.location.search).get("billing");
  return value === "monthly" || value === "yearly" ? value : null;
}

/**
 * Marketing plan cards with the Monthly | Yearly toggle. The choice lives in
 * ?billing= so ads and emails can link to either view. The page is static, so
 * the param is read after mount rather than on the server.
 */
export default function PricingCards({
  monthlyAvailable,
  showHighlights = false,
  signupParams,
  footnote = PRICING_FOOTNOTE,
}: Props) {
  const [billing, setBilling] = useState<BillingPeriod>(DEFAULT_BILLING);

  useEffect(() => {
    const fromUrl = readBillingParam();
    if (fromUrl) setBilling(fromUrl);
  }, []);

  function choose(next: BillingPeriod) {
    setBilling(next);
    const url = new URL(window.location.href);
    url.searchParams.set("billing", next);
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <div>
      <div className="flex justify-center">
        <BillingToggle value={billing} onChange={choose} />
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800/60 rounded-2xl overflow-hidden">
        {PLANS.map((plan) => {
          const popular = plan.popular;
          const saving = formatPounds(yearlySaving(plan));
          const canSignUp = billing === "yearly" || monthlyAvailable;
          const query = new URLSearchParams({ plan: plan.id, billing, ...signupParams });

          return (
            <div
              key={plan.id}
              className={cn(
                "p-8 flex flex-col",
                popular ? "bg-neutral-100 dark:bg-neutral-900" : "bg-white dark:bg-neutral-950"
              )}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">{plan.name}</h3>
                {popular && <span className="font-mono text-xs uppercase tracking-[0.14em] text-brand-ink">Popular</span>}
              </div>

              <div className="mt-5 flex items-baseline gap-1" aria-live="polite">
                <span key={billing} className="animate-price-swap font-serif text-5xl text-neutral-900 dark:text-neutral-50">
                  {formatPounds(plan.amounts[billing])}
                </span>
                <span className="text-base text-neutral-500 dark:text-neutral-400">
                  {billing === "yearly" ? "/year" : "/month"}
                </span>
              </div>

              {/* Two lines are reserved so the cards don't change height on toggle. */}
              <p className="mt-2 min-h-[2.75rem] text-sm leading-snug">
                {billing === "yearly" ? (
                  <span className="text-brand-ink">
                    Just {formatPounds(yearlyPerMonth(plan))}/month · Save {saving}
                  </span>
                ) : (
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Billed monthly ·{" "}
                    <button
                      type="button"
                      onClick={() => choose("yearly")}
                      className="underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      Switch to yearly and save {saving}
                    </button>
                  </span>
                )}
              </p>

              <p className="text-base text-neutral-500 dark:text-neutral-400">{plan.users}</p>

              {showHighlights && (
                <ul className="mt-7 space-y-3 text-base text-neutral-700 dark:text-neutral-300 flex-1">
                  {plan.highlights.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <span className="text-brand-ink" aria-hidden>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              {canSignUp ? (
                <Link
                  href={`/signup?${query}`}
                  className={cn(
                    "mt-8 block text-center py-3 rounded-lg text-base font-medium transition-colors",
                    popular
                      ? "bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white"
                      : "border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  )}
                >
                  Start free trial
                </Link>
              ) : (
                <p className="mt-8 block text-center py-3 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-base text-neutral-500 dark:text-neutral-400">
                  Monthly billing coming soon
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">{footnote}</p>
    </div>
  );
}
