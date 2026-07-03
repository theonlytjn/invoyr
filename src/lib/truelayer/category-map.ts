import type { ExpenseCategory } from "@/lib/supabase/types";

const MAP: Record<string, ExpenseCategory> = {
  TRANSPORT: "travel",
  HOLIDAYS: "travel",
  EATING_OUT: "meals",
  ENTERTAINMENT: "meals",
  BILL_PAYMENT: "software",
  DIRECT_DEBIT: "software",
  SUBSCRIPTION: "software",
  SHOPPING: "other",
  GROCERIES: "office",
  UTILITIES: "office",
  INSURANCE: "professional",
  PROFESSIONAL_SERVICES: "professional",
  EQUIPMENT: "equipment",
  GENERAL: "other",
  EXPENSE: "other",
  PURCHASE: "other",
  ATM: "other",
  CASH: "other",
};

export function mapCategory(tlCategory: string | null | undefined): ExpenseCategory {
  if (!tlCategory) return "other";
  return MAP[tlCategory.toUpperCase()] ?? "other";
}
