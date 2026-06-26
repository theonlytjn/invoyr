import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import RecurringList from "@/components/recurring/RecurringList";
import type { Metadata } from "next";
import type { RecurringInvoiceWithClient } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Recurring invoices" };

export default async function RecurringInvoicesPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data } = await supabase
    .from("recurring_invoices")
    .select("*, clients(name), recurring_invoice_items(*)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const schedules = (data ?? []) as RecurringInvoiceWithClient[];

  return (
    <div>
      <Topbar
        title="Recurring invoices"
        actions={
          <Link
            href="/invoices/recurring/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            + New schedule
          </Link>
        }
      />
      <div className="p-6">
        <RecurringList schedules={schedules} />
      </div>
    </div>
  );
}
