"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
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

const TOTAL_STEPS = 4;

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

    // Create org
    const { data: org, error: orgError } = await supabase
      .from("organisations")
      .insert({
        name: data.orgName,
        slug: data.orgSlug || slugify(data.orgName),
        email: data.email || null,
        phone: data.phone || null,
        address_line1: data.address || null,
        city: data.city || null,
        postcode: data.postcode || null,
        country: data.country,
        vat_number: data.vatNumber || null,
        logo_url: data.logoUrl || null,
        accent_color: data.accentColor,
      })
      .select()
      .single();

    if (orgError || !org) {
      console.error(orgError);
      setSaving(false);
      return;
    }

    // Add user as owner
    await supabase.from("org_members").insert({
      org_id: org.id,
      user_id: userId,
      role: "owner",
    });

    // Mark onboarding complete — upsert handles missing profile rows
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, onboarding_completed: true }, { onConflict: "id" });

    if (profileError) {
      console.error("profile upsert failed", profileError);
      setSaving(false);
      return;
    }

    // Hard redirect so middleware reads fresh profile from Supabase
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((step / TOTAL_STEPS) * 100)}% complete
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-gray-900 rounded-full transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {step === 1 && (
            <StepOrgSetup
              data={data}
              update={update}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepBranding
              data={data}
              update={update}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <StepPlanSelection
              data={data}
              update={update}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <StepFirstInvoice
              data={data}
              onBack={() => setStep(3)}
              onComplete={complete}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}
