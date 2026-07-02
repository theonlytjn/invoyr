import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
import Topbar from "@/components/shell/Topbar";
import SettingsNav from "@/components/settings/SettingsNav";
import AutomationsPanel from "@/components/settings/AutomationsPanel";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Automations — Settings" };

export default async function AutomationsSettingsPage() {
  const org = await requireOrg();
  const plan = await getOrgPlan(org.id);
  const hasAccess = canAccess(plan, "reminder_automation");

  const supabase = await createClient();
  const { data: rules } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Topbar title="Settings" />
      <SettingsNav />
      <div className="p-4 sm:p-6 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">Automations</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Rules that fire automatically when events occur — send emails, chase invoices, stay informed.
          </p>
        </div>
        {!hasAccess ? (
          <UpgradePrompt feature="reminder_automation" />
        ) : (
          <AutomationsPanel initialRules={rules ?? []} />
        )}
      </div>
    </div>
  );
}
