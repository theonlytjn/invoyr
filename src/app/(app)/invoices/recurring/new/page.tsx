import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import Topbar from "@/components/shell/Topbar";
import RecurringForm from "@/components/recurring/RecurringForm";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import type { Metadata } from "next";
import type { Client } from "@/lib/supabase/types";
import { canAccess } from "@/config/plans";

export const metadata: Metadata = { title: "New recurring schedule" };

export default async function NewRecurringPage() {
  const org = await requireOrg();
  const plan = await getOrgPlan(org.id);

  if (!canAccess(plan, "recurring_invoices")) {
    return (
      <div>
        <Topbar title="New recurring schedule" />
        <UpgradePrompt feature="recurring_invoices" />
      </div>
    );
  }

  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("org_id", org.id)
    .eq("archived", false)
    .order("name");

  return (
    <div>
      <Topbar title="New recurring schedule" />
      <div className="p-6">
        <RecurringForm clients={(clients ?? []) as Client[]} />
      </div>
    </div>
  );
}
