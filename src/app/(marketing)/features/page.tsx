import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features — Invoyr",
  description: "Everything you need to invoice clients, collect payments, and run your business.",
};

const KICKER = "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-400";
const CONTAINER = "max-w-[1600px] mx-auto px-6 lg:px-12";
const CARD = "rounded-2xl border border-neutral-800 bg-gradient-to-br from-emerald-800/20 via-neutral-900 to-neutral-950";

export default function FeaturesPage() {
  return (
    <div>
      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-8 text-center">
        <p className={`${KICKER} mb-8`}>Features</p>
        <h1 className="font-serif text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] tracking-tight text-neutral-50">
          Built for the way you work
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-xl text-neutral-200 leading-relaxed">
          Invoyr brings invoicing, payments and reporting into one calm platform — modular, mobile-friendly, and made for the real world.
        </p>
        <div className="mt-9 flex items-center justify-center gap-4">
          <Link href="/signup" className="px-5 py-3 rounded-xl bg-neutral-50 text-neutral-950 font-medium hover:bg-white transition-colors">
            Start free trial
          </Link>
          <Link href="/pricing" className="text-base text-neutral-200 hover:text-neutral-100 transition-colors">
            View pricing →
          </Link>
        </div>
      </section>

      {/* BENTO — invoicing & payments */}
      <section className="border-t border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <p className={`${KICKER} text-center`}>Invoicing &amp; payments</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-50">
            Invoicing, simplified.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-neutral-200">
            Send invoices that look the part, take payment any way your client likes, and let the admin run itself.
          </p>

          <div className="mt-16 grid gap-4 lg:grid-cols-3">
            {/* Tall left — phone */}
            <div className={`relative flex flex-col overflow-hidden p-8 ${CARD}`}>
              <h3 className="font-serif text-2xl text-neutral-50">Get paid on the go</h3>
              <p className="mt-3 text-neutral-200 leading-relaxed">Your client taps the link and pays from their phone — card, PayPal or bank transfer.</p>
              <div className="h-80" aria-hidden />
              <div aria-hidden="true" className="absolute inset-x-0 top-44 flex justify-center">
                <div className="w-72 rounded-t-3xl border-8 border-b-0 border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/60">
                  <div className="flex items-center justify-between px-5 pb-1 pt-3 font-mono text-[10px] text-neutral-200"><span>9:41</span><span>5G ▬▬▬</span></div>
                  <div className="px-5 pb-8 pt-2">
                    <div className="rounded-lg bg-neutral-900 px-4 py-3"><p className="font-serif text-base text-neutral-50">TJN Agency</p><p className="font-mono text-[10px] text-neutral-400">#INV-0042</p></div>
                    <div className="mt-4 flex items-baseline justify-between"><span className="text-xs text-neutral-400">Amount due</span><span className="font-serif text-2xl text-neutral-50">£6,000</span></div>
                    <div className="mt-4 rounded-lg bg-neutral-50 py-2.5 text-center text-xs font-medium text-neutral-950">Pay now</div>
                    <div className="mt-2 rounded-lg border border-neutral-800 py-2.5 text-center text-xs text-neutral-300">Pay with PayPal</div>
                    <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-400">Or pay by bank transfer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle column */}
            <div className="flex flex-col gap-4">
              <div className={`flex flex-1 flex-col p-8 ${CARD}`}>
                <h3 className="font-serif text-2xl text-neutral-50">Your terms, your way</h3>
                <p className="mt-3 text-neutral-200 leading-relaxed">Net 7, 14, 30 or a custom due date — and recurring bills for retainers.</p>
                <div className="mt-6">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-neutral-400">Payment terms</p>
                  <div className="mt-1.5 flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3">
                    <span className="font-serif text-lg text-neutral-100">Net 30</span>
                    <span className="text-neutral-400">▾</span>
                  </div>
                </div>
              </div>
              <div className={`flex flex-1 flex-col p-8 ${CARD}`}>
                <h3 className="font-serif text-2xl text-neutral-50">Multi-currency &amp; VAT</h3>
                <p className="mt-3 text-neutral-200 leading-relaxed">Invoice in any currency with the right VAT, ready for your accountant.</p>
                <div className="mt-6 flex items-center gap-2">
                  {["£", "$", "€"].map((c) => (
                    <span key={c} className="grid h-10 w-10 place-items-center rounded-full border border-neutral-800 bg-neutral-950 font-serif text-lg text-neutral-200">{c}</span>
                  ))}
                  <span className="ml-auto rounded-full border border-neutral-800 px-3 py-1 font-mono text-[11px] text-emerald-400">VAT 20%</span>
                </div>
              </div>
            </div>

            {/* Tall right — invoice */}
            <div className={`relative flex flex-col overflow-hidden p-8 ${CARD}`}>
              <h3 className="font-serif text-2xl text-neutral-50">Invoices that look considered</h3>
              <p className="mt-3 text-neutral-200 leading-relaxed">Four templates, your logo and accent colour — sent as a polished PDF or a pay link.</p>
              <div className="h-80" aria-hidden />
              <div aria-hidden="true" className="absolute inset-x-8 top-44">
                <div className="rounded-t-xl border border-b-0 border-white/10 bg-neutral-950 p-6 shadow-2xl shadow-black/60">
                  <div className="flex items-start justify-between">
                    <div><p className="font-serif text-lg text-neutral-50">TJN Agency</p><p className="mt-0.5 font-mono text-[10px] text-neutral-400">Invoice · INV-0042</p></div>
                    <span className="h-8 w-8 rounded" style={{ backgroundColor: "rgba(52, 211, 153, 0.9)" }} />
                  </div>
                  <div className="mt-5 flex justify-between border-t border-neutral-900 pt-4 text-[11px]">
                    <div><p className="text-neutral-400">Billed to</p><p className="mt-0.5 text-neutral-200">Northwind Studio</p></div>
                    <div className="text-right"><p className="text-neutral-400">Due</p><p className="mt-0.5 text-neutral-200">07 Jul 2026</p></div>
                  </div>
                  <div className="mt-5 space-y-3 border-t border-neutral-900 pt-4 text-xs">
                    <div className="flex justify-between text-neutral-200"><span>Brand identity — phase 2</span><span className="text-neutral-200">£4,200.00</span></div>
                    <div className="flex justify-between text-neutral-200"><span>Web design retainer</span><span className="text-neutral-200">£1,800.00</span></div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between border-t border-neutral-900 pt-4">
                    <span className="text-xs text-neutral-400">Total due</span>
                    <span className="font-serif text-2xl text-neutral-50">£6,000.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO — automation & insight */}
      <section className="border-t border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <p className={`${KICKER} text-center`}>Automation &amp; insight</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-50">
            It runs while you don&apos;t.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-neutral-200">
            Reminders that chase for you, reporting that keeps you honest, and exports your accountant will thank you for.
          </p>

          <div className="mt-16 grid gap-4 lg:grid-cols-3">
            {/* Reminders */}
            <div className={`flex flex-col p-8 ${CARD}`}>
              <h3 className="font-serif text-2xl text-neutral-50">Chase automatically</h3>
              <p className="mt-3 text-neutral-200 leading-relaxed">Polite nudges at 7, 14 and 30 days overdue — sent in your name.</p>
              <div className="mt-6 flex items-center gap-2">
                {["7d", "14d", "30d"].map((d, i) => (
                  <div key={d} className="flex items-center gap-2">
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-neutral-800 bg-neutral-950 font-mono text-xs text-emerald-400">{d}</span>
                    {i < 2 && <span className="h-px w-6 bg-neutral-800" />}
                  </div>
                ))}
                <span className="ml-auto font-mono text-[11px] text-neutral-400">auto</span>
              </div>
            </div>

            {/* Reports */}
            <div className={`flex flex-col p-8 ${CARD}`}>
              <h3 className="font-serif text-2xl text-neutral-50">Real reporting</h3>
              <p className="mt-3 text-neutral-200 leading-relaxed">Revenue, ageing and top clients — see exactly where you stand.</p>
              <div className="mt-6 flex items-end gap-1.5">
                {[26, 38, 30, 48, 42, 58, 50, 68, 62, 80].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}px`, backgroundColor: "rgba(52, 211, 153, 0.8)" }} />
                ))}
              </div>
            </div>

            {/* Exports */}
            <div className={`flex flex-col p-8 ${CARD}`}>
              <h3 className="font-serif text-2xl text-neutral-50">Export clean</h3>
              <p className="mt-3 text-neutral-200 leading-relaxed">QuickBooks, Xero and CSV — one click, no reformatting.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["QuickBooks", "Xero", "CSV"].map((x) => (
                  <span key={x} className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-300">{x}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEVICE SHOWCASE */}
      <section className="relative overflow-hidden border-t border-neutral-900">
        <div className={`${CONTAINER} pt-24 text-center`}>
          <p className={KICKER}>Everything you need</p>
          <h2 className="mx-auto mt-6 max-w-3xl font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-50">
            No busywork. Just a tool that runs the money.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-200">
            Invoyr brings clarity and control to every stage — without the usual admin headaches.
          </p>
        </div>

        <div aria-hidden="true" className="relative mx-auto mt-14 max-w-[1600px] px-6 lg:px-12">
          <div className="absolute -top-6 left-1/4 right-1/4 h-24 rounded-full opacity-50 blur-2xl" style={{ background: "radial-gradient(ellipse at center, rgba(52,211,153,0.4), transparent 70%)" }} />
          <div className="relative overflow-hidden rounded-t-2xl border border-b-0 border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/70">
            <div className="flex">
              <div className="w-52 shrink-0 border-r border-neutral-900 p-4">
                <span className="px-1 font-serif text-lg text-neutral-50">Invoyr</span>
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-800 p-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded bg-neutral-800 text-xs text-neutral-200">T</span>
                  <div><p className="text-xs text-neutral-100">TJN Agency</p><p className="text-[10px] text-neutral-400">Pro Plan</p></div>
                </div>
                <div className="mt-3 rounded-lg bg-neutral-50 py-2 text-center text-xs font-medium text-neutral-950">+ New invoice</div>
                <nav className="mt-4 space-y-0.5 text-xs">
                  {[["Overview", true], ["Invoices", false], ["Estimates", false], ["Clients", false], ["Payments", false], ["Expenses", false], ["Reports", false], ["Settings", false]].map(([label, active]) => (
                    <div key={label as string} className={`rounded-md px-2.5 py-1.5 ${active ? "bg-neutral-900 text-neutral-100" : "text-neutral-400"}`}>{label}</div>
                  ))}
                </nav>
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Dashboard</span>
                  <span className="rounded-lg bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-950">+ New invoice</span>
                </div>
                <p className="mt-5 font-serif text-2xl text-neutral-50">Welcome back, Tony</p>
                <p className="text-xs text-neutral-400">Here&apos;s what&apos;s happening with TJN Agency.</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Revenue this month", "£0.00", "£180.00 all time"],
                    ["Outstanding", "£12.00", "1 awaiting payment"],
                    ["Overdue", "£0.00", "None overdue"],
                    ["Total invoices", "3", "1 paid"],
                  ].map(([label, value, sub]) => (
                    <div key={label} className="rounded-xl border border-neutral-900 p-3">
                      <p className="font-mono text-[9px] uppercase tracking-wide text-neutral-400">{label}</p>
                      <p className="mt-1.5 font-serif text-xl text-neutral-50">{value}</p>
                      <p className="mt-1 text-[10px] text-neutral-400">{sub}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-neutral-900">
                  <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3"><span className="text-xs text-neutral-300">Latest invoices</span><span className="text-[10px] text-neutral-400">View all →</span></div>
                  {[
                    ["INV-0006", "Junior Tee", "Sent", "#60a5fa", "£12.00"],
                    ["INV-0004", "Junior Tee", "Overdue", "#f87171", "£0.00"],
                    ["INV-0003", "Junior Tee", "Paid", "#34d399", "£180.00"],
                  ].map(([num, client, status, color, amount]) => (
                    <div key={num} className="flex items-center justify-between border-b border-neutral-900 px-4 py-3 text-xs last:border-b-0">
                      <span className="w-24 text-neutral-100">{num}</span>
                      <span className="flex-1 text-neutral-400">{client}</span>
                      <span className="w-20 font-mono text-[10px]" style={{ color }}>{status}</span>
                      <span className="w-20 text-right text-neutral-200">{amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-900 py-24 text-center">
        <h2 className="font-serif text-4xl md:text-5xl text-neutral-50">Everything included from day one</h2>
        <p className="mt-4 text-neutral-200">7-day free trial. No credit card required.</p>
        <Link href="/signup" className="mt-9 inline-block px-6 py-3.5 rounded-xl bg-neutral-50 text-neutral-950 font-medium hover:bg-white transition-colors">
          Get started free →
        </Link>
      </section>
    </div>
  );
}
