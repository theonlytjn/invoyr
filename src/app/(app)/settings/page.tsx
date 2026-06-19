import { requireOrg } from "@/lib/auth";
import BrandingForm from "@/components/settings/BrandingForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — Company" };

export default async function SettingsPage() {
  const org = await requireOrg();
  return <BrandingForm org={org} />;
}
