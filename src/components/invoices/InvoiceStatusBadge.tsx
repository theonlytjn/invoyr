import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/supabase/types";

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  issued: { label: "Issued", className: "bg-amber-50 text-amber-700" },
  sent: { label: "Sent", className: "bg-blue-50 text-blue-700" },
  paid: { label: "Paid", className: "bg-green-50 text-green-700" },
  overdue: { label: "Overdue", className: "bg-red-50 text-red-700" },
  void: { label: "Void", className: "bg-gray-100 text-gray-400" },
};

interface Props {
  status: InvoiceStatus;
  className?: string;
}

export default function InvoiceStatusBadge({ status, className }: Props) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
