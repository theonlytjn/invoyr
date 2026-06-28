import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/supabase/types";

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  draft:   { label: "Draft",    className: "bg-[#f5f5f5] text-[#737373] border border-[#e5e5e5]" },
  issued:  { label: "Issued",   className: "bg-[#fef9c2] text-[#a65f00] border border-[#fff085]" },
  sent:    { label: "Sent",     className: "bg-blue-50 text-blue-700 border border-blue-100" },
  partial: { label: "Partial",  className: "bg-orange-50 text-orange-700 border border-orange-100" },
  paid:    { label: "Paid",     className: "bg-[#dcfce7] text-[#00a63e] border border-[#bbf7d0]" },
  overdue: { label: "Overdue",  className: "bg-red-50 text-red-700 border border-red-100" },
  void:    { label: "Void",     className: "bg-[#f5f5f5] text-[#a3a3a3] border border-[#e5e5e5]" },
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
