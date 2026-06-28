import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
import BrandingForm from "@/components/settings/BrandingForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings — Company" };

export default async function SettingsPage() {
  const org = await requireOrg();
  const plan = await getOrgPlan(org.id);
  const canUploadLogo = canAccess(plan, "custom_branding");
  return <BrandingForm org={org} canUploadLogo={canUploadLogo} />;
}
