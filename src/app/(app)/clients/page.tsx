import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import type { Metadata } from "next";
import type { Client } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("org_id", org.id)
    .order("name");
  const clients = (data ?? []) as Client[];

  return (
    <div>
      <Topbar
        title="Clients"
        actions={
          <Link
            href="/clients/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            + Add client
          </Link>
        }
      />
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!clients.length ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-3">No clients yet.</p>
              <Link href="/clients/new" className="text-sm font-medium text-gray-900 underline">
                Add your first client
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-5 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Company</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">VAT</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-5">
                      <Link href={`/clients/${client.id}`} className="font-medium text-gray-900 hover:underline">
                        {client.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{client.company_name ?? "—"}</td>
                    <td className="py-3 px-4 text-gray-600">{client.email ?? "—"}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">{client.vat_number ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
