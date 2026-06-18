import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import BrandingForm from "@/components/settings/BrandingForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const org = await requireOrg();
  return (
    <div>
      <Topbar title="Settings" />
      <div className="p-6 max-w-xl">
        <BrandingForm org={org} />
      </div>
    </div>
  );
}
