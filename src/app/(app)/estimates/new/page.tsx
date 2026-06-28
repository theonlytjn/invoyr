import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import EstimateForm from "@/components/estimates/EstimateForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Estimate" };

export default async function NewEstimatePage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("org_id", org.id)
    .eq("archived", false)
    .order("name");

  return (
    <div>
      <Topbar title="New estimate" />
      <div className="p-4 sm:p-6">
        <EstimateForm
          org={org}
          clients={clients ?? []}
          mode="create"
        />
      </div>
    </div>
  );
}
