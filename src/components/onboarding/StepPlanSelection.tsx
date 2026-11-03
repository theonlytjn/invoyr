"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PLANS, TRIAL_DAYS, formatPounds, yearlyPerMonth, yearlySaving } from "@/config/plans";
import BillingToggle from "@/components/pricing/BillingToggle";
import type { OnboardingData } from "./OnboardingWizard";

interface Props {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  monthlyAvailable: boolean;
  /** From /signup?code=…, checked as soon as the step opens. */
  initialTrialCode?: string;
  onBack: () => void;
  onNext: () => void;
}

type CodeState = { status: "idle" | "checking" | "error"; message?: string };

export default function StepPlanSelection({ data, update, monthlyAvailable, initialTrialCode, onBack, onNext }: Props) {
  const [codeInput, setCodeInput] = useState(data.trialCode || initialTrialCode || "");
  const [code, setCode] = useState<CodeState>({ status: "idle" });
  const autoChecked = useRef(false);

  /** Returns true when the box is empty or holds a valid code. */
  async function applyCode(raw: string): Promise<boolean> {
    const value = raw.trim().toUpperCase();
    if (!value) {
      update({ trialCode: "", trialDays: TRIAL_DAYS });
      setCode({ status: "idle" });
      return true;
    }
    if (value === data.trialCode) return true;

    setCode({ status: "checking" });
    const res = await fetch("/api/trial-codes/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: value }),
    }).catch(() => null);
    const payload = res ? await res.json().catch(() => ({})) : {};

    if (!res?.ok || !payload.valid) {
      update({ trialCode: "", trialDays: TRIAL_DAYS });
      setCode({ status: "error", message: payload.error ?? "We couldn't check that code. Please try again." });
      return false;
    }
    update({ trialCode: payload.code, trialDays: payload.trialDays });
    setCodeInput(payload.code);
    setCode({ status: "idle" });
    return true;
  }

  useEffect(() => {
    if (autoChecked.current || !initialTrialCode || data.trialCode) return;
    autoChecked.current = true;
    void applyCode(initialTrialCode);
    // Runs once for the code carried from the signup link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function next() {
    if (await applyCode(codeInput)) onNext();
  }

  const applied = !!data.trialCode && codeInput.trim().toUpperCase() === data.trialCode;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif text-neutral-950 mb-1">Choose your plan</h2>
        <p className="text-sm text-neutral-500">
          {data.trialDays}-day free trial · Cancel anytime · Prices exclude VAT
        </p>
      </div>

      {monthlyAvailable && (
        <BillingToggle value={data.billing} onChange={(billing) => update({ billing })} />
      )}

      <div className="space-y-2.5" role="radiogroup" aria-label="Plan">
        {PLANS.map((plan) => {
          const selected = data.plan === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => update({ plan: plan.id })}
              className={cn(
                "w-full text-left rounded-xl border-2 p-4 transition-all relative",
                selected
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
                <span className="text-xl font-serif text-neutral-950">{formatPounds(plan.amounts[data.billing])}</span>
                <span className="text-sm text-neutral-500">{data.billing === "yearly" ? "/year" : "/month"}</span>
                <span className="ml-2 text-xs text-neutral-500">· {plan.users}</span>
              </div>
              <p className="text-sm font-medium text-neutral-950">{plan.name}</p>
              {data.billing === "yearly" && (
                <p className="mb-2 text-xs text-brand-ink">
                  Just {formatPounds(yearlyPerMonth(plan))}/month · Save {formatPounds(yearlySaving(plan))}
                </p>
              )}
              <ul className="mt-2 space-y-1">
                {plan.highlights.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-950 shrink-0" aria-hidden>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Early-access code: turns the standard trial into a longer one. */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
        <label htmlFor="trial-code" className="block text-sm font-medium text-neutral-950">
          Early access code <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            id="trial-code"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
              if (code.status === "error") setCode({ status: "idle" });
            }}
            placeholder="e.g. FOUNDING"
            autoComplete="off"
            aria-invalid={code.status === "error"}
            aria-describedby="trial-code-status"
            className="flex-1 min-w-0 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm uppercase text-neutral-950 placeholder:normal-case placeholder:text-neutral-400 focus:outline-none focus:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a] transition-shadow"
          />
          <button
            type="button"
            onClick={() => void applyCode(codeInput)}
            disabled={code.status === "checking" || !codeInput.trim() || applied}
            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            {code.status === "checking" ? "Checking…" : applied ? "Applied" : "Apply"}
          </button>
        </div>
        <div id="trial-code-status" aria-live="polite">
          {code.status === "error" && (
            <p role="alert" className="text-xs text-red-600">{code.message}</p>
          )}
          {applied && (
            <p className="text-xs text-neutral-700">
              <span className="font-semibold">{data.trialCode}</span> applied: your free trial is {data.trialDays} days.
            </p>
          )}
        </div>
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
          onClick={() => void next()}
          disabled={code.status === "checking"}
          className="flex-1 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
