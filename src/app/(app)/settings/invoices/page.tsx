import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
import InvoiceSettingsForm from "@/components/settings/InvoiceSettingsForm";
import EmailSettingsForm from "@/components/settings/EmailSettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — Invoices" };

export default async function InvoiceSettingsPage() {
  const org = await requireOrg();
  const plan = await getOrgPlan(org.id);
  const canCustomEmail = canAccess(plan, "custom_email_domain");
  const canReminderAutomation = canAccess(plan, "reminder_automation");
  return (
    <div className="space-y-10">
      <InvoiceSettingsForm org={org} />
      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
        <EmailSettingsForm org={org} canCustomEmail={canCustomEmail} canReminderAutomation={canReminderAutomation} />
      </div>
    </div>
  );
}
