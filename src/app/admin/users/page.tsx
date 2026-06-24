import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const users = authUsers?.users ?? [];

  // Fetch profiles and org memberships
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, onboarding_completed, created_at");
  const { data: members } = await supabase.from("org_members").select("user_id, org_id, role, organisations(name)");

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberMap = Object.fromEntries((members ?? []).map((m) => [m.user_id, m as any]));

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1 text-sm">{users.length} total accounts</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Organisation</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Signed up</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((u) => {
              const profile = profileMap[u.id];
              const member = memberMap[u.id];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const orgName = Array.isArray(member?.organisations) ? (member.organisations[0] as any)?.name : (member?.organisations as any)?.name;
              return (
                <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3 text-white">{u.email}</td>
                  <td className="px-5 py-3 text-gray-300">{profile?.full_name ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-300">{orgName ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-400 capitalize">{member?.role ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-400">
                    {new Date(u.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/users/${u.id}`} className="text-blue-400 hover:text-blue-300 text-xs">
                      View →
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
