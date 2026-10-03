import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CreateUserModal } from "@/components/admin/CreateUserModal";

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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif text-neutral-950 dark:text-neutral-50">Users</h1>
          <p className="text-neutral-500 mt-1 text-sm">{users.length} total accounts</p>
        </div>
        <CreateUserModal />
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800">
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Email</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Organisation</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Sign-in</th>
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
                  {/* Which methods this person can actually sign in with — the
                      first thing worth knowing when someone can't get in. */}
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(u.identities ?? []).length === 0 ? (
                        <span className="text-neutral-400">—</span>
                      ) : (
                        (u.identities ?? []).map((identity) => (
                          <span
                            key={identity.identity_id ?? identity.provider}
                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                          >
                            {identity.provider === "email" ? "Password" : identity.provider}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
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
