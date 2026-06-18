import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/lib/supabase/types";

const ACTION_LABELS: Record<string, string> = {
  "invoice.created": "Invoice created",
  "invoice.sent": "Invoice sent",
  "invoice.paid": "Invoice marked paid",
  "invoice.voided": "Invoice voided",
  "invoice.overdue": "Invoice marked overdue",
  "payment.recorded": "Payment recorded",
  "client.created": "Client added",
};

interface Props {
  logs: AuditLog[];
}

export default function ActivityFeed({ logs }: Props) {
  if (logs.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">No activity yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {logs.map((log) => (
        <li key={log.id} className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-gray-900">
              {ACTION_LABELS[log.action] ?? log.action}
              {log.entity_id && (
                <span className="ml-1 text-gray-500 font-mono text-xs">
                  #{log.entity_id.slice(0, 8)}
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
