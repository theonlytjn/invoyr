import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import InvoiceSettingsForm from "@/components/settings/InvoiceSettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Invoice Settings" };

export default async function InvoiceSettingsPage() {
  const org = await requireOrg();
  return (
    <div>
      <Topbar title="Invoice settings" />
      <div className="p-6 max-w-xl">
        <InvoiceSettingsForm org={org} />
      </div>
    </div>
  );
}
