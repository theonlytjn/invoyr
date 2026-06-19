import { requireOrg } from "@/lib/auth";
import InvoiceSettingsForm from "@/components/settings/InvoiceSettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — Invoices" };

export default async function InvoiceSettingsPage() {
  const org = await requireOrg();
  return <InvoiceSettingsForm org={org} />;
}
