import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import EstimateForm from "@/components/estimates/EstimateForm";
import type { Metadata } from "next";
import type { Estimate, EstimateItem } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Edit Estimate" };

interface Props { params: Promise<{ id: string }> }

export default async function EditEstimatePage({ params }: Props) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const [{ data }, { data: clients }] = await Promise.all([
    supabase
      .from("estimates")
      .select("*, estimate_items(*)")
      .eq("id", id)
      .eq("org_id", org.id)
      .single(),
    supabase
      .from("clients")
      .select("*")
      .eq("org_id", org.id)
      .eq("archived", false)
      .order("name"),
  ]);

  if (!data) notFound();

  const estimate = data as Estimate & { estimate_items: EstimateItem[] };

  return (
    <div>
      <Topbar title={`Edit ${estimate.estimate_number}`} />
      <div className="p-4 sm:p-6">
        <EstimateForm
          org={org}
          clients={clients ?? []}
          estimate={estimate}
          existingItems={estimate.estimate_items}
          mode="edit"
        />
      </div>
    </div>
  );
}
