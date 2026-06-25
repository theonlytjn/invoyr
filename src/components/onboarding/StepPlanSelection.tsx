"use client";

import { cn } from "@/lib/utils";
import type { OnboardingData } from "./OnboardingWizard";

interface Props {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "£79",
    period: "/year",
    users: "1 user",
    features: ["Unlimited invoices", "Client management", "Stripe payments", "PDF generation"],
  },
  {
    id: "business",
    name: "Business",
    price: "£149",
    period: "/year",
    users: "Up to 5 users",
    features: ["Everything in Starter", "Recurring invoices", "Reminders", "Team roles"],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "£249",
    period: "/year",
    users: "Unlimited users",
    features: ["Everything in Business", "Custom email domain", "Automation", "Priority support"],
  },
];

export default function StepPlanSelection({ data, update, onBack, onNext }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif text-neutral-950 mb-1">Choose your plan</h2>
        <p className="text-sm text-neutral-500">14-day free trial · No credit card needed</p>
      </div>

      <div className="space-y-2.5">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => update({ plan: plan.id })}
            className={cn(
              "w-full text-left rounded-xl border-2 p-4 transition-all relative",
              data.plan === plan.id
                ? "border-neutral-950 bg-white shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a]"
                : "border-neutral-200 bg-white hover:border-neutral-400"
            )}
          >
            {plan.popular && (
              <span className="absolute top-3 right-3 rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-medium text-white">
                Popular
              </span>
            )}
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-xl font-serif text-neutral-950">{plan.price}</span>
              <span className="text-sm text-neutral-500">{plan.period}</span>
              <span className="ml-2 text-xs text-neutral-400">· {plan.users}</span>
            </div>
            <p className="text-sm font-medium text-neutral-950 mb-2">{plan.name}</p>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-950 shrink-0">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 hover:bg-neutral-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
