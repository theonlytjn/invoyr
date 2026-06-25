import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const users = authUsers?.users ?? [];

  const { data: profiles } = await supabase.from("profiles").select("id, full_name, onboarding_completed, created_at");
  const { data: members } = await supabase.from("org_members").select("user_id, org_id, role, organisations(name)");

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberMap = Object.fromEntries((members ?? []).map((m) => [m.user_id, m as any]));

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-neutral-950 dark:text-neutral-50">Users</h1>
        <p className="text-neutral-500 mt-1 text-sm">{users.length} total accounts</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800">
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Organisation</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Signed up</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {users.map((u) => {
              const profile = profileMap[u.id];
              const member = memberMap[u.id];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const orgName = Array.isArray(member?.organisations) ? (member.organisations[0] as any)?.name : (member?.organisations as any)?.name;
              return (
                <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <td className="px-5 py-3 text-neutral-950 dark:text-neutral-50">{u.email}</td>
                  <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">{profile?.full_name ?? "—"}</td>
                  <td className="px-5 py-3 text-neutral-600 dark:text-neutral-400">{orgName ?? "—"}</td>
                  <td className="px-5 py-3 text-neutral-400 capitalize">{member?.role ?? "—"}</td>
                  <td className="px-5 py-3 text-neutral-400">
                    {new Date(u.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/users/${u.id}`} className="text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50 text-xs">
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
