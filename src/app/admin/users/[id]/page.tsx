"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface UserDetail {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  profile: { full_name: string | null; onboarding_completed: boolean } | null;
  org: { id: string; name: string; plan: string | null; status: string | null } | null;
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => { setUser(d.user); setLoading(false); });
  }, [id]);

  function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    startTransition(async () => {
      await fetch(`/api/admin/users/${id}/delete`, { method: "DELETE" });
      router.push("/admin/users");
    });
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!user) return <div className="p-8 text-gray-400">User not found.</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/users" className="text-gray-500 hover:text-white text-sm">← Users</Link>
      </div>

      <h1 className="text-xl font-bold text-white mb-1">{user.email}</h1>
      <p className="text-gray-400 text-sm mb-8">User ID: {user.id}</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-3">
        <Row label="Full name" value={user.profile?.full_name ?? "—"} />
        <Row label="Onboarding" value={user.profile?.onboarding_completed ? "Complete" : "Incomplete"} />
        <Row label="Signed up" value={new Date(user.created_at).toLocaleString("en-GB")} />
        <Row label="Last sign in" value={user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("en-GB") : "Never"} />
      </div>

      {user.org && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Organisation</h2>
          <Row label="Name" value={user.org.name} />
          <Row label="Plan" value={user.org.plan ?? "Free"} />
          <Row label="Status" value={user.org.status ?? "—"} />
          <div className="pt-2">
            <Link href={`/admin/organisations/${user.org.id}`} className="text-blue-400 hover:text-blue-300 text-sm">
              Manage organisation →
            </Link>
          </div>
        </div>
      )}

      <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">Danger zone</h2>
        <p className="text-gray-400 text-sm mb-4">
          Permanently deletes this user account. This cannot be undone.
        </p>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? "Deleting…" : deleteConfirm ? "Confirm delete" : "Delete user"}
        </button>
        {deleteConfirm && !isPending && (
          <button onClick={() => setDeleteConfirm(false)} className="ml-3 text-sm text-gray-400 hover:text-white">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-800 last:border-0">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}
