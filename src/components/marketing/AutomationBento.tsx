import { cn } from "@/lib/utils";

const CARD = "rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-emerald-50/70 dark:from-emerald-800/20 via-white dark:via-neutral-900 to-white dark:to-neutral-950";

/**
 * Automation and insight bento: automatic chasing, reporting and exports.
 * Used on the features page and the early-access page.
 */
export default function AutomationBento({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-3", className)}>
      {/* Reminders */}
      <div className={`flex flex-col p-8 ${CARD}`}>
        <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">Chase automatically</h3>
        <p className="mt-3 text-neutral-600 dark:text-neutral-200 leading-relaxed">Polite nudges at 7, 14 and 30 days overdue — sent in your name.</p>
        <div className="mt-6 flex items-center gap-2">
          {["7d", "14d", "30d"].map((d, i) => (
            <div key={d} className="flex items-center gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 font-mono text-xs text-emerald-600 dark:text-emerald-400">{d}</span>
              {i < 2 && <span className="h-px w-6 bg-neutral-200 dark:bg-neutral-800" />}
            </div>
          ))}
          <span className="ml-auto font-mono text-[11px] text-neutral-500 dark:text-neutral-400">auto</span>
        </div>
      </div>

      {/* Reports */}
      <div className={`flex flex-col p-8 ${CARD}`}>
        <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">Real reporting</h3>
        <p className="mt-3 text-neutral-600 dark:text-neutral-200 leading-relaxed">Revenue, ageing and top clients — see exactly where you stand.</p>
        <div className="mt-6 flex items-end gap-1.5">
          {[26, 38, 30, 48, 42, 58, 50, 68, 62, 80].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}px`, backgroundColor: "rgba(52, 211, 153, 0.8)" }} />
          ))}
        </div>
      </div>

      {/* Exports */}
      <div className={`flex flex-col p-8 ${CARD}`}>
        <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">Export clean</h3>
        <p className="mt-3 text-neutral-600 dark:text-neutral-200 leading-relaxed">QuickBooks, Xero and CSV — one click, no reformatting.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {["QuickBooks", "Xero", "CSV"].map((x) => (
            <span key={x} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-700 dark:text-neutral-300">{x}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
