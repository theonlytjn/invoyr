import { PlusIcon } from "@/components/icons";

// Sample rows for the preview only — never real data.
const SAMPLE_ACCOUNTS = [
  { name: "Business Current Account", meta: "Current · GBP · Last synced today" },
  { name: "Business Savings", meta: "Savings · GBP · Last synced today" },
];

/**
 * Shown on Settings → Banking while Open Banking awaits production approval.
 * Mirrors BankConnectionsPanel so customers can see what's coming, but nothing
 * in it is interactive.
 */
export default function OpenBankingPreview() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 p-4">
        <span className="shrink-0 rounded-full bg-neutral-950 dark:bg-neutral-50 px-2.5 py-0.5 text-xs font-semibold text-white dark:text-neutral-950">
          Coming soon
        </span>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Bank sync is in final approval with our Open Banking provider. Here&apos;s a preview of
          how it will work — we&apos;ll let you know as soon as it&apos;s switched on.
        </p>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none select-none opacity-60 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-neutral-950 dark:text-neutral-50">Connected accounts</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Bank accounts linked via Open Banking. Transactions are pulled and matched to expenses.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-xs font-medium">
            <PlusIcon size={13} /> Connect bank
          </span>
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {SAMPLE_ACCOUNTS.map((account) => (
            <div key={account.name} className="px-5 py-4">
              <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50">{account.name}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{account.meta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
