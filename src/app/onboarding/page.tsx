import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { isMonthlyBillingAvailable } from "@/config/plans";
import { SIGNUP_INTENT_COOKIE, parseSignupIntent } from "@/lib/onboarding/signup-intent";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) redirect("/dashboard");

  const intent = parseSignupIntent((await cookies()).get(SIGNUP_INTENT_COOKIE)?.value);
  const monthlyAvailable = isMonthlyBillingAvailable();

  return (
    <OnboardingWizard
      userId={user.id}
      userName={profile?.full_name ?? ""}
      initialPlan={intent.plan}
      // Monthly can't be bought until its prices exist, so fall back to yearly.
      initialBilling={intent.billing === "monthly" && !monthlyAvailable ? undefined : intent.billing}
      initialTrialCode={intent.code}
      monthlyAvailable={monthlyAvailable}
    />
  );
}
