import BankConnectionsPanel from "@/components/settings/BankConnectionsPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Banking — Settings" };

export default function BankingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif text-neutral-950 dark:text-neutral-50">Banking</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Connect your business bank account to automatically import transactions into expenses.
        </p>
      </div>
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
    </div>
  );
}
