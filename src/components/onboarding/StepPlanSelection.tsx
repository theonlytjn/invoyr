"use client";

import { Button } from "@/components/ui/button";
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
        <h2 className="text-2xl font-semibold text-gray-900">Choose your plan</h2>
        <p className="mt-1 text-gray-500">Start with a 14-day free trial. No credit card needed.</p>
      </div>

      <div className="space-y-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => update({ plan: plan.id })}
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-all relative",
              data.plan === plan.id
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            {plan.popular && (
              <span className="absolute top-3 right-3 text-xs font-medium bg-gray-900 text-white px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-lg font-bold text-gray-900">{plan.price}</span>
              <span className="text-sm text-gray-500">{plan.period}</span>
              <span className="ml-2 text-xs text-gray-400">· {plan.users}</span>
            </div>
            <p className="font-medium text-gray-900 mb-2">{plan.name}</p>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="text-green-600">✓</span> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button className="flex-1" onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
