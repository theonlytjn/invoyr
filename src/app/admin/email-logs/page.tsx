import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminEmailLogsPage() {
  await requireAdmin();
  const supabase = await createServiceClient();

  const { data: logs } = await supabase
    .from("email_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const STATUS_COLORS: Record<string, string> = {
    sent: "text-blue-700 bg-blue-50",
    delivered: "text-green-700 bg-green-50",
    bounced: "text-red-700 bg-red-50",
    failed: "text-red-700 bg-red-50",
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-neutral-950">Email logs</h1>
        <p className="text-neutral-500 mt-1 text-sm">Most recent 200 across all organisations.</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">To</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Subject</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Template</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs text-neutral-400 uppercase tracking-wider">Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(logs ?? []).map((log) => (
              <tr key={log.id} className="hover:bg-neutral-50">
                <td className="px-5 py-3 text-neutral-950">{log.to_email}</td>
                <td className="px-5 py-3 text-neutral-600 max-w-[260px] truncate">{log.subject}</td>
                <td className="px-5 py-3 text-neutral-400 text-xs font-mono">{log.template_name}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${STATUS_COLORS[log.status] ?? "text-neutral-500 bg-neutral-100"}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-neutral-400 text-xs">
                  {new Date(log.created_at).toLocaleString("en-GB")}
                </td>
              </tr>
            ))}
            {(logs ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-400">No email logs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
