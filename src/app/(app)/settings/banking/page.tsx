import Link from "next/link";
import { requireOrg } from "@/lib/auth";
import { getOrgPlan } from "@/lib/billing";
import { canAccess } from "@/config/plans";
import BankConnectionsPanel from "@/components/settings/BankConnectionsPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Banking — Settings" };

export default async function BankingSettingsPage() {
  const org = await requireOrg();
  const plan = await getOrgPlan(org.id);
  const canBank = canAccess(plan, "open_banking");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">Banking</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Connect your business bank account to automatically import transactions into expenses.
        </p>
      </div>

      {canBank ? (
        <>
          <BankConnectionsPanel />

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">How it works</p>
            <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
              <li>Click &ldquo;Connect bank&rdquo; and log in via your bank&apos;s secure portal</li>
              <li>Go to Expenses → &ldquo;Import from bank&rdquo; to pull in the last 90 days</li>
              <li>Review and categorise each transaction, then confirm the import</li>
              <li>Imported expenses appear in your expenses list and are ready to share with your accountant</li>
            </ol>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center">
          <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50 mb-1">
            Open Banking is a Pro feature
          </p>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mb-6">
            Connect your business bank account and import the last 90 days of transactions
            straight into expenses, with auto-detected categories. Upgrade to Pro to switch it on.
          </p>
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      )}
    </div>
  );
}
