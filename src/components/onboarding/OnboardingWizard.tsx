"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { slugify, cn } from "@/lib/utils";
import StepOrgSetup from "./StepOrgSetup";
import StepBranding from "./StepBranding";
import StepPlanSelection from "./StepPlanSelection";
import StepFirstInvoice from "./StepFirstInvoice";

interface Props {
  userId: string;
  userName: string;
}

export type OnboardingData = {
  orgName: string;
  orgSlug: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  vatNumber: string;
  logoUrl: string;
  accentColor: string;
  plan: string;
};

const STEPS = [
  { label: "Your business" },
  { label: "Branding" },
  { label: "Plan" },
  { label: "All set" },
];

export default function OnboardingWizard({ userId, userName }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    orgName: "",
    orgSlug: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
    country: "GB",
    vatNumber: "",
    logoUrl: "",
    accentColor: "#111827",
    plan: "starter",
  });

  function update(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  async function complete() {
    setSaving(true);
    const supabase = createClient();

    const orgId = crypto.randomUUID();

    const { error: orgError } = await supabase
      .from("organisations")
      .insert({
        id: orgId,
        name: data.orgName,
        slug: (data.orgSlug || slugify(data.orgName)) + "-" + orgId.slice(0, 6),
        email: data.email || null,
        phone: data.phone || null,
        address_line1: data.address || null,
        city: data.city || null,
        postcode: data.postcode || null,
        country: data.country,
        vat_number: data.vatNumber || null,
        logo_url: data.logoUrl || null,
        accent_color: data.accentColor,
      });

    if (orgError) {
      console.error("org insert failed", orgError);
      setSaving(false);
      return;
    }

    const { error: memberError } = await supabase.from("org_members").insert({
      org_id: orgId,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      console.error("member insert failed", memberError);
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", userId);

    if (profileError) {
      console.error("profile upsert failed", profileError);
      setSaving(false);
      return;
    }

    await fetch("/api/onboarding/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, plan: data.plan }),
    }).catch(() => {});

    window.location.href = "/dashboard";
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Left: wizard */}
      <div className="flex w-full flex-col lg:w-1/2">
        <header className="flex items-center justify-between px-8 py-6 shrink-0">
          <Link href="/">
            <Image src="/main-logo.svg" alt="Invoyr" width={110} height={34} priority />
          </Link>
          <span className="text-sm text-neutral-500">
            {userName ? `Hi, ${userName.split(" ")[0]}` : "Welcome"}
          </span>
        </header>

        <div className="flex flex-1 items-start justify-center px-8 py-8 overflow-y-auto">
          <div className="w-full max-w-sm">
            {/* Stepper */}
            <div className="flex items-start gap-0 mb-10">
              {STEPS.map((s, i) => {
                const num = i + 1;
                const done = step > num;
                const active = step === num;
                return (
                  <div key={s.label} className="flex items-start flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all",
                          done
                            ? "border-neutral-950 bg-neutral-950 text-white"
                            : active
                              ? "border-neutral-950 bg-white text-neutral-950 shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a]"
                              : "border-neutral-200 bg-white text-neutral-400"
                        )}
                      >
                        {done ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          num
                        )}
                      </div>
                      <span
                        className={cn(
                          "mt-1.5 text-center text-[10px] leading-tight whitespace-nowrap",
                          active ? "text-neutral-950 font-medium" : "text-neutral-400"
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "mt-4 h-px flex-1 mx-1.5",
                          done ? "bg-neutral-950" : "bg-neutral-200"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step content */}
            {step === 1 && <StepOrgSetup data={data} update={update} onNext={() => setStep(2)} />}
            {step === 2 && <StepBranding data={data} update={update} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
            {step === 3 && <StepPlanSelection data={data} update={update} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
            {step === 4 && <StepFirstInvoice data={data} onBack={() => setStep(3)} onComplete={complete} saving={saving} />}
          </div>
        </div>
      </div>

      {/* Right: dark panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-neutral-950 p-24 overflow-hidden">
        <div className="max-w-md pt-8">
          <h2 className="text-5xl font-serif text-white leading-tight mb-6">
            Everything you need to run your business
          </h2>
          <p className="text-lg text-neutral-400">
            Set up in minutes. Start invoicing today.
          </p>
        </div>

        <div className="space-y-8">
          <blockquote className="space-y-4">
            <p className="text-xl font-serif text-white leading-relaxed">
              &ldquo;Invoyr cut our billing time in half. Clients pay faster and we always know what&rsquo;s outstanding.&rdquo;
            </p>
            <footer className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center">
                <span className="text-xs font-medium text-neutral-300">SB</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Sarah Blake</p>
                <p className="text-xs text-neutral-500">Founder, Blake Creative</p>
              </div>
            </footer>
          </blockquote>

          <div className="grid grid-cols-2 gap-4">
            {[
              { stat: "2 min", label: "Avg. invoice creation time" },
              { stat: "48 hrs", label: "Avg. time to get paid" },
            ].map(({ stat, label }) => (
              <div key={stat} className="rounded-xl bg-white/5 p-4">
                <p className="text-2xl font-serif text-white">{stat}</p>
                <p className="mt-1 text-xs text-neutral-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
