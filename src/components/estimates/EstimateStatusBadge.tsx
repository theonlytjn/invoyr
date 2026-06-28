import { cn } from "@/lib/utils";
import type { EstimateStatus } from "@/lib/supabase/types";

const CONFIG: Record<EstimateStatus, { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" },
  sent:      { label: "Sent",      className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  approved:  { label: "Approved",  className: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  rejected:  { label: "Declined",  className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  converted: { label: "Converted", className: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
};

export default function EstimateStatusBadge({ status }: { status: EstimateStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.draft;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", className)}>
      {label}
    </span>
  );
}
