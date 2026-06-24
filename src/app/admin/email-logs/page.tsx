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
    sent: "text-blue-400 bg-blue-400/10",
    delivered: "text-green-400 bg-green-400/10",
    bounced: "text-red-400 bg-red-400/10",
    failed: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Email logs</h1>
        <p className="text-gray-400 mt-1 text-sm">Most recent 200 across all organisations.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">To</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Template</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Sent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(logs ?? []).map((log) => (
              <tr key={log.id} className="hover:bg-gray-800/40">
                <td className="px-5 py-3 text-white">{log.to_email}</td>
                <td className="px-5 py-3 text-gray-300 max-w-[260px] truncate">{log.subject}</td>
                <td className="px-5 py-3 text-gray-400 text-xs font-mono">{log.template_name}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${STATUS_COLORS[log.status] ?? "text-gray-400"}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {new Date(log.created_at).toLocaleString("en-GB")}
                </td>
              </tr>
            ))}
            {(logs ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-500">No email logs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
