import { cn } from "@/lib/utils";

/**
 * "Why businesses get paid faster" bento: payments on a phone, estimates and
 * recurring, multi-currency and VAT, and a professional invoice. Used on the
 * homepage and the early-access page.
 */
export default function BenefitsBento({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-3", className)}>
      {/* Payments — tall, phone */}
      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-emerald-50/70 dark:from-emerald-800/25 via-white dark:via-neutral-900 to-white dark:to-neutral-950 p-8">
        <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">Payments everywhere</h3>
        <p className="mt-3 text-neutral-600 dark:text-neutral-200 leading-relaxed">Card, PayPal or bank transfer — your client taps the link and pays from their phone, so you get paid on the go.</p>
        <div className="h-80" aria-hidden />
        <div aria-hidden="true" className="absolute inset-x-0 top-44 flex justify-center">
          <div className="w-72 rounded-t-3xl border-8 border-b-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between px-5 pb-1 pt-3 font-mono text-[10px] text-neutral-600 dark:text-neutral-200">
              <span>9:41</span><span>5G ▬▬▬</span>
            </div>
            <div className="px-5 pb-8 pt-2">
              <div className="flex items-center gap-3 rounded-lg bg-neutral-100 dark:bg-neutral-900 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-950 ring-1 ring-white/10">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/clients/tjn-agency-badge-white.svg" alt="" className="h-full w-full" /></span>
                <div>
                  <p className="font-serif text-base text-neutral-900 dark:text-neutral-50">TJN Agency</p>
                  <p className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">#INV-0042</p>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Amount due</span>
                <span className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">£11,520</span>
              </div>
              <div className="mt-4 rounded-lg bg-neutral-950 dark:bg-neutral-50 py-2.5 text-center text-xs font-medium text-white dark:text-neutral-950">Pay now</div>
              <div className="mt-2 rounded-lg border border-neutral-200 dark:border-neutral-800 py-2.5 text-center text-xs text-neutral-700 dark:text-neutral-300">Pay with PayPal</div>
              <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-400">Or pay by bank transfer</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div><p className="text-neutral-500 dark:text-neutral-400">Account</p><p className="text-neutral-600 dark:text-neutral-200">TJN Agency</p></div>
                <div><p className="text-neutral-500 dark:text-neutral-400">Sort code</p><p className="text-neutral-600 dark:text-neutral-200">04-00-35</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle column */}
      <div className="flex flex-col gap-4">
        {/* Estimates & recurring */}
        <div className="flex flex-1 flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-emerald-50/70 dark:from-emerald-800/25 via-white dark:via-neutral-900 to-white dark:to-neutral-950 p-8">
          <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">Estimates &amp; recurring</h3>
          <p className="mt-3 text-neutral-600 dark:text-neutral-200 leading-relaxed">Send quotes that convert to invoices in a click, and put retainers on autopilot.</p>
          <div aria-hidden="true" className="mt-6 flex items-center gap-3">
            <span className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-700 dark:text-neutral-300">EST-0018</span>
            <span className="text-neutral-500 dark:text-neutral-400">→</span>
            <span className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-700 dark:text-neutral-300">INV-0043</span>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Monthly</span>
          </div>
        </div>
        {/* Multi-currency & VAT */}
        <div className="flex flex-1 flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-emerald-50/70 dark:from-emerald-800/25 via-white dark:via-neutral-900 to-white dark:to-neutral-950 p-8">
          <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">Multi-currency &amp; VAT</h3>
          <p className="mt-3 text-neutral-600 dark:text-neutral-200 leading-relaxed">Invoice in any currency with the right VAT, and export clean for your accountant.</p>
          <div aria-hidden="true" className="mt-6 flex items-center gap-2">
            {["£", "$", "€"].map((c) => (
              <span key={c} className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 font-serif text-lg text-neutral-600 dark:text-neutral-200">{c}</span>
            ))}
            <span className="ml-auto rounded-full border border-neutral-200 dark:border-neutral-800 px-3 py-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">VAT 20%</span>
          </div>
        </div>
      </div>

      {/* Professional invoices — tall, invoice */}
      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-emerald-50/70 dark:from-emerald-800/25 via-white dark:via-neutral-900 to-white dark:to-neutral-950 p-8">
        <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">Professional invoices</h3>
        <p className="mt-3 text-neutral-600 dark:text-neutral-200 leading-relaxed">Four templates, your logo and accent colour — sent as a polished PDF or a pay link.</p>
        <div className="h-80" aria-hidden />
        <div aria-hidden="true" className="absolute inset-x-8 top-44">
          <div className="rounded-t-xl border border-b-0 border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-6 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-serif text-lg text-neutral-900 dark:text-neutral-50">TJN Agency</p>
                <p className="mt-0.5 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">Invoice · INV-0042</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-950 ring-1 ring-white/10">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/clients/tjn-agency-badge-white.svg" alt="" className="h-full w-full" /></span>
            </div>
            <div className="mt-5 flex justify-between border-t border-neutral-200 dark:border-neutral-900 pt-4 text-[11px]">
              <div><p className="text-neutral-500 dark:text-neutral-400">Billed to</p><p className="mt-0.5 text-neutral-600 dark:text-neutral-200">Finer Fleet</p></div>
              <div className="text-right"><p className="text-neutral-500 dark:text-neutral-400">Due</p><p className="mt-0.5 text-neutral-600 dark:text-neutral-200">07 Jul 2026</p></div>
            </div>
            <div className="mt-5 space-y-3 border-t border-neutral-200 dark:border-neutral-900 pt-4 text-xs">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-200"><span>CRM Development — phase 2</span><span className="text-neutral-600 dark:text-neutral-200">£7,200.00</span></div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-200"><span>Web design retainer</span><span className="text-neutral-600 dark:text-neutral-200">£1,800.00</span></div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-200"><span>Consultation — 6 hrs</span><span className="text-neutral-600 dark:text-neutral-200">£600.00</span></div>
            </div>
            <div className="mt-4 space-y-2 border-t border-neutral-200 dark:border-neutral-900 pt-4 text-xs">
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400"><span>Subtotal</span><span>£9,600.00</span></div>
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400"><span>VAT · 20%</span><span>£1,920.00</span></div>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 dark:border-neutral-900 pt-4">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Total due</span>
              <span className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">£11,520.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
