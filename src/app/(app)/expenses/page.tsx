import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import ExpensesList from "@/components/expenses/ExpensesList";
import type { ExpenseWithClient, Client } from "@/lib/supabase/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [{ data: expenses }, { data: clients }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, clients(id, name, company_name)")
      .eq("org_id", org.id)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name, company_name")
      .eq("org_id", org.id)
      .eq("archived", false)
      .order("name"),
  ]);

  return (
    <div>
      <Topbar title="Expenses" />
      <div className="p-4 sm:p-6">
        <ExpensesList
          initialExpenses={(expenses ?? []) as ExpenseWithClient[]}
          clients={(clients ?? []) as Pick<Client, "id" | "name" | "company_name">[]}
          orgId={org.id}
          orgCurrency={org.currency ?? "GBP"}
        />
      </div>
    </div>
  );
}
