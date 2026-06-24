import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminOrgsPage() {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { data: orgs } = await supabase
    .from("organisations")
    .select("id, name, slug, email, country, created_at")
    .order("created_at", { ascending: false });

  const { data: subs } = await supabase.from("subscriptions").select("org_id, plan, status");
  const { data: memberCounts } = await supabase.from("org_members").select("org_id");

  const subMap = Object.fromEntries((subs ?? []).map((s) => [s.org_id, s]));
  const memberCountMap: Record<string, number> = {};
  (memberCounts ?? []).forEach((m) => { memberCountMap[m.org_id] = (memberCountMap[m.org_id] ?? 0) + 1; });

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Organisations</h1>
        <p className="text-gray-400 mt-1 text-sm">{orgs?.length ?? 0} total</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Members</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(orgs ?? []).map((org) => {
              const sub = subMap[org.id];
              return (
                <tr key={org.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-white">{org.name}</td>
                  <td className="px-5 py-3 text-gray-300">{org.email ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-300 capitalize">{sub?.plan ?? "Free"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={sub?.status ?? null} />
                  </td>
                  <td className="px-5 py-3 text-gray-400">{memberCountMap[org.id] ?? 0}</td>
                  <td className="px-5 py-3 text-gray-400">{new Date(org.created_at).toLocaleDateString("en-GB")}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/organisations/${org.id}`} className="text-blue-400 hover:text-blue-300 text-xs">
                      Manage →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    active: "text-green-400 bg-green-400/10",
    trialing: "text-yellow-400 bg-yellow-400/10",
    past_due: "text-orange-400 bg-orange-400/10",
    canceled: "text-red-400 bg-red-400/10",
    incomplete: "text-gray-400 bg-gray-400/10",
  };
  const label = status ?? "free";
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${map[label] ?? "text-gray-400 bg-gray-400/10"}`}>
      {label}
    </span>
  );
}
