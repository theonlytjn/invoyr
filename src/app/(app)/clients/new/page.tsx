import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import ClientForm from "@/components/clients/ClientForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Client" };

export default async function NewClientPage() {
  const org = await requireOrg();
  return (
    <div>
      <Topbar title="Add client" />
      <div className="p-6">
        <ClientForm org={org} mode="create" />
      </div>
    </div>
  );
}
