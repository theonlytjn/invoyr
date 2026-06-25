import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import ClientsTable from "@/components/clients/ClientsTable";
import type { Metadata } from "next";
import type { Client } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const org = await requireOrg();
  const supabase = await createClient();
  const { archived } = await searchParams;
  const showArchived = archived === "1";

  let query = supabase
    .from("clients")
    .select("*")
    .eq("org_id", org.id)
    .order("name");

  if (!showArchived) {
    query = query.eq("archived", false);
  }

  const { data } = await query;
  const clients = (data ?? []) as Client[];

  return (
    <div>
      <Topbar
        title="Clients"
        actions={
          <Link
            href="/clients/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            + Add client
          </Link>
        }
      />
      <div className="p-6">
        <ClientsTable clients={clients} showArchived={showArchived} />
      </div>
    </div>
  );
}
