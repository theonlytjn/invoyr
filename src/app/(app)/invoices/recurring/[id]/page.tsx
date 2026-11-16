import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import Topbar from "@/components/shell/Topbar";
import RecurringForm from "@/components/recurring/RecurringForm";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import type { Metadata } from "next";
import type { Client, RecurringInvoiceWithClient } from "@/lib/supabase/types";
import { canAccess } from "@/config/plans";

export const metadata: Metadata = { title: "Edit recurring schedule" };

export default async function EditRecurringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrg();
  const plan = await getOrgPlan(org.id);

  if (!canAccess(plan, "recurring_invoices")) {
    return (
      <div>
        <Topbar title="Edit recurring schedule" />
        <UpgradePrompt feature="recurring_invoices" />
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: schedule }, { data: clients }] = await Promise.all([
    supabase
      .from("recurring_invoices")
      .select("*, clients(name), recurring_invoice_items(*)")
      .eq("id", id)
      .eq("org_id", org.id)
      .maybeSingle(),
    supabase.from("clients").select("*").eq("org_id", org.id).eq("archived", false).order("name"),
  ]);

  if (!schedule) notFound();

  const existing = schedule as RecurringInvoiceWithClient;
  existing.recurring_invoice_items = [...(existing.recurring_invoice_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <div>
      <Topbar title="Edit recurring schedule" />
      <div className="p-6">
        <RecurringForm clients={(clients ?? []) as Client[]} existing={existing} />
      </div>
    </div>
  );
}
