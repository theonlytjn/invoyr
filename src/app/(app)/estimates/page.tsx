import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import Topbar from "@/components/shell/Topbar";
import EstimatesTable from "@/components/estimates/EstimatesTable";
import { PlusIcon } from "@/components/icons";
import type { Metadata } from "next";
import type { EstimateWithClient } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Estimates" };

export default async function EstimatesPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data } = await supabase
    .from("estimates")
    .select("*, clients(id, name, email, company_name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const estimates = (data ?? []) as EstimateWithClient[];

  return (
    <div>
      <Topbar
        title="Estimates"
        actions={
          <Link
            href="/estimates/new"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            <PlusIcon size={14} />
            New estimate
          </Link>
        }
      />

      <div className="p-4 sm:p-6">
        {estimates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">No estimates yet</p>
            <Link
              href="/estimates/new"
              className="px-4 py-2 bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Create your first estimate
            </Link>
          </div>
        ) : (
          <EstimatesTable estimates={estimates} />
        )}
      </div>
    </div>
  );
}
