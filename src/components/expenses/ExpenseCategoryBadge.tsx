import type { ExpenseCategory } from "@/lib/supabase/types";
import { CATEGORY_MAP } from "./expense-config";
import { cn } from "@/lib/utils";

export default function ExpenseCategoryBadge({ category, className }: { category: ExpenseCategory; className?: string }) {
  const cfg = CATEGORY_MAP[category];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", cfg?.color, className)}>
      {cfg?.label ?? category}
    </span>
  );
}
