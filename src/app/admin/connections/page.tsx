import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminConnectionsPage() {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { data: orgs } = await supabase
    .from("organisations")
    .select("id, name, email, stripe_account_id, stripe_customer_id, created_at")
    .order("created_at", { ascending: false });

  const connected = (orgs ?? []).filter((o) => o.stripe_account_id);
  const unconnected = (orgs ?? []).filter((o) => !o.stripe_account_id);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-neutral-950">Payment connections</h1>
        <p className="text-neutral-500 mt-1 text-sm">
          {connected.length} of {(orgs ?? []).length} organisations have Stripe Connect active.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden mb-8">
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <h2 className="text-sm font-semibold text-neutral-700">Connected — Stripe ({connected.length})</h2>
        </div>
        {connected.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-400">No organisations connected yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Organisation</th>
                <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Stripe account ID</th>
                <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Connected</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {connected.map((org) => (
                <tr key={org.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3 font-medium text-neutral-950">{org.name}</td>
                  <td className="px-5 py-3 text-neutral-500">{org.email ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-neutral-500">{org.stripe_account_id}</td>
                  <td className="px-5 py-3 text-neutral-400 text-xs">{new Date(org.created_at).toLocaleDateString("en-GB")}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/organisations/${org.id}`} className="text-neutral-400 hover:text-neutral-950 text-xs">Manage →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neutral-300 flex-shrink-0" />
          <h2 className="text-sm font-semibold text-neutral-700">Not connected ({unconnected.length})</h2>
        </div>
        {unconnected.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-400">All organisations are connected.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Organisation</th>
                <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {unconnected.map((org) => (
                <tr key={org.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3 font-medium text-neutral-950">{org.name}</td>
                  <td className="px-5 py-3 text-neutral-500">{org.email ?? "—"}</td>
                  <td className="px-5 py-3 text-neutral-400 text-xs">{new Date(org.created_at).toLocaleDateString("en-GB")}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/organisations/${org.id}`} className="text-neutral-400 hover:text-neutral-950 text-xs">Manage →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
