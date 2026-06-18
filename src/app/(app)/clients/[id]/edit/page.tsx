import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import ClientForm from "@/components/clients/ClientForm";
import type { Metadata } from "next";
import type { Client } from "@/lib/supabase/types";

interface Props { params: Promise<{ id: string }> }
export const metadata: Metadata = { title: "Edit Client" };

export default async function EditClientPage({ params }: Props) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  const client = data as Client | null;
  if (!client) notFound();

  return (
    <div>
      <Topbar title={`Edit ${client.name}`} />
      <div className="p-6">
        <ClientForm org={org} client={client} mode="edit" />
      </div>
    </div>
  );
}
