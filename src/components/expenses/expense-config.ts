import type { ExpenseCategory } from "@/lib/supabase/types";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: "travel",       label: "Travel & Transport",      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "software",     label: "Software & Subscriptions", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  { value: "office",       label: "Office & Supplies",        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { value: "meals",        label: "Meals & Entertainment",    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  { value: "marketing",    label: "Marketing & Advertising",  color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  { value: "professional", label: "Professional Services",    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
  { value: "equipment",    label: "Equipment & Hardware",     color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  { value: "other",        label: "Other",                    color: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" },
];

export const CATEGORY_MAP = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c])
) as Record<ExpenseCategory, (typeof EXPENSE_CATEGORIES)[number]>;
