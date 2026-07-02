import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
import Topbar from "@/components/shell/Topbar";
import SettingsNav from "@/components/settings/SettingsNav";
import PortalBrandingPanel from "@/components/settings/PortalBrandingPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Portal branding — Settings" };

export default async function PortalSettingsPage() {
  const org = await requireOrg();
  const supabase = await createClient();
  const plan = await getOrgPlan(org.id);

  const { data: orgData } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", org.id)
    .single();

  const canCustomBranding = canAccess(plan, "custom_branding");
  const canWhiteLabel = canAccess(plan, "white_label");

  return (
    <div>
      <Topbar title="Settings" />
      <SettingsNav />
      <div className="p-4 sm:p-6 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">Portal branding</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Customise what your clients see on the payment and estimate portal.
          </p>
        </div>
        <PortalBrandingPanel
          org={orgData ?? org}
          canCustomBranding={canCustomBranding}
          canWhiteLabel={canWhiteLabel}
        />
      </div>
    </div>
  );
}
