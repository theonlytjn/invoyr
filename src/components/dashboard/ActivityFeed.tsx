import { formatDate } from "@/lib/utils";
import type { AuditLog } from "@/lib/supabase/types";

const ACTION_LABELS: Record<string, string> = {
  "invoice.created": "Invoice created",
  "invoice.issued": "Invoice issued",
  "invoice.sent": "Invoice sent",
  "invoice.paid": "Invoice paid",
  "invoice.voided": "Invoice voided",
  "invoice.overdue": "Invoice overdue",
  "payment.recorded": "Payment recorded",
  "client.created": "Client added",
};

function logDescription(log: AuditLog): string {
  const label = ACTION_LABELS[log.action] ?? log.action;
  const num = (log.meta as Record<string, string> | null)?.invoice_number;
  return num ? `${label} — #${num}` : label;
}

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
            <p className="text-sm text-gray-900">{logDescription(log)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
