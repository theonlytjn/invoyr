import { requireOrg } from "@/lib/auth";
import SmtpSettingsPanel from "@/components/settings/SmtpSettingsPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — Email" };

export default async function EmailSettingsPage() {
  const org = await requireOrg();
  return (
    <div className="space-y-6">
      <SmtpSettingsPanel org={org} />
    </div>
  );
}
