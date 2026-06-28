import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import Topbar from "@/components/shell/Topbar";
import EstimateStatusBadge from "@/components/estimates/EstimateStatusBadge";
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
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Number</th>
                    <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Client</th>
                    <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Date</th>
                    <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Expires</th>
                    <th className="text-right px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Total</th>
                    <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {estimates.map((est) => (
                    <tr key={est.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link href={`/estimates/${est.id}`} className="font-medium text-neutral-950 dark:text-neutral-50 hover:underline">
                          {est.estimate_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                        {est.clients?.name ?? <span className="text-neutral-400">No client</span>}
                      </td>
                      <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                        {formatDate(est.issue_date)}
                      </td>
                      <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                        {est.expiry_date ? formatDate(est.expiry_date) : <span className="text-neutral-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-neutral-950 dark:text-neutral-50">
                        {formatCurrency(est.total, est.currency)}
                      </td>
                      <td className="px-5 py-3.5">
                        <EstimateStatusBadge status={est.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
