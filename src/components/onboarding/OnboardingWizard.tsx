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

    // Generate org ID client-side to avoid RLS chicken-and-egg:
    // INSERT ... RETURNING checks the SELECT policy (is_org_member),
    // but we're not a member yet. By pre-generating the ID we can
    // insert without RETURNING and add the member row straight after.
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
