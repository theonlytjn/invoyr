import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminAuditLogsPage() {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: orgs } = await supabase.from("organisations").select("id, name");
  const orgMap = Object.fromEntries((orgs ?? []).map((o) => [o.id, o.name]));

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-neutral-950">Audit logs</h1>
        <p className="text-neutral-500 mt-1 text-sm">Most recent 200 actions across all organisations.</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Organisation</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Action</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Entity</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Entity ID</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(logs ?? []).map((log) => (
              <tr key={log.id} className="hover:bg-neutral-50">
                <td className="px-5 py-3 text-neutral-600 text-xs">{log.org_id ? (orgMap[log.org_id] ?? log.org_id.slice(0, 8) + "…") : "—"}</td>
                <td className="px-5 py-3 font-mono text-xs text-neutral-950">{log.action}</td>
                <td className="px-5 py-3 text-neutral-400 text-xs capitalize">{log.entity_type}</td>
                <td className="px-5 py-3 font-mono text-xs text-neutral-400 max-w-[120px] truncate">{log.entity_id ?? "—"}</td>
                <td className="px-5 py-3 text-neutral-400 text-xs">{new Date(log.created_at).toLocaleString("en-GB")}</td>
              </tr>
            ))}
            {(logs ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-400">No audit logs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
