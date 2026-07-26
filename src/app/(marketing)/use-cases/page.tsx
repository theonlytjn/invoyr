import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Use Cases — Invoyr",
  description: "How freelancers, agencies, and service businesses use Invoyr to get paid faster.",
};

const KICKER = "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400";
const CONTAINER = "max-w-[1600px] mx-auto px-6 lg:px-12";
const CARD = "rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-emerald-50/70 dark:from-emerald-800/20 via-white dark:via-neutral-900 to-white dark:to-neutral-950";

const USE_CASES = [
  {
    role: "Freelance designers & developers",
    description:
      "Send a polished invoice the moment a project wraps. Clients pay by card from the email link — no chasing, no spreadsheets. See everything outstanding at a glance.",
    benefits: [
      "Professional branded invoices in seconds",
      "Stripe card payments — clients don't need a Stripe account",
      "Overdue reminders sent automatically",
    ],
  },
  {
    role: "Creative agencies",
    description:
      "Manage multiple clients and projects without the complexity of full accounting software. Duplicate invoices for recurring retainers and export data for your bookkeeper.",
    benefits: [
      "Duplicate invoices for repeat work",
      "CSV export for your accounting software",
      "Top clients report to spot your most valuable relationships",
    ],
  },
  {
    role: "Consultants & coaches",
    description:
      "Quote cleanly, invoice immediately, and track payment status from your dashboard. VAT-registered? The VAT summary has you covered at quarter-end.",
    benefits: [
      "Custom payment terms (immediate, Net 14, Net 30)",
      "VAT summary by month for VAT returns",
      "Audit log for every invoice action",
    ],
  },
  {
    role: "Tradespeople & service pros",
    description:
      "Simple enough to use on the go between jobs. Add your logo, pick a template, and share the invoice link. Clients pay immediately — you see it in your Stripe dashboard.",
    benefits: [
      "Works on any device",
      "Payment notifications when clients pay",
      "Partial payment tracking for deposit-based jobs",
    ],
  },
];

export default function UseCasesPage() {
  return (
    <div>
      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-8 text-center">
        <p className={`${KICKER} mb-8`}>Use cases</p>
        <h1 className="font-serif text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] tracking-tight text-neutral-900 dark:text-neutral-50">
          Made for anyone who
          <br />
          invoices for a living
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-xl text-neutral-600 dark:text-neutral-200 leading-relaxed">
          Whether you&apos;re a solo freelancer or running a small agency, Invoyr adapts to how you work.
        </p>
        <div className="mt-9 flex items-center justify-center gap-4">
          <Link href="/signup" className="px-5 py-3 rounded-xl bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 font-medium hover:bg-neutral-800 dark:hover:bg-white transition-colors">
            Start free trial
          </Link>
          <Link href="/features" className="text-base text-neutral-600 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Explore features →
          </Link>
        </div>
      </section>

      {/* SHOWCASE — one dashboard for every kind of business */}
      <section className="relative overflow-hidden border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} pt-24 text-center`}>
          <p className={KICKER}>One place for all of it</p>
          <h2 className="mx-auto mt-6 max-w-3xl font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-900 dark:text-neutral-50">
            See where every client stands.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-200">
            Whatever the work, the same calm dashboard shows what&apos;s paid, outstanding and overdue — across every client, in one view.
          </p>
        </div>

        <div aria-hidden="true" className="relative mx-auto mt-14 max-w-[1600px] px-6 lg:px-12">
          <div className="absolute -top-6 left-1/4 right-1/4 h-24 rounded-full opacity-50 blur-2xl" style={{ background: "radial-gradient(ellipse at center, rgba(52,211,153,0.4), transparent 70%)" }} />
          <div className="relative overflow-hidden rounded-t-2xl border border-b-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl shadow-neutral-900/10 dark:shadow-black/70">
            <div className="flex">
              <div className="w-52 shrink-0 border-r border-neutral-200 dark:border-neutral-900 p-4">
                <span className="px-1 font-serif text-lg text-neutral-900 dark:text-neutral-50">Invoyr</span>
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 p-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded bg-neutral-200 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-200">T</span>
                  <div><p className="text-xs text-neutral-900 dark:text-neutral-100">TJN Agency</p><p className="text-[10px] text-neutral-500 dark:text-neutral-400">Pro Plan</p></div>
                </div>
                <div className="mt-3 rounded-lg bg-neutral-950 dark:bg-neutral-50 py-2 text-center text-xs font-medium text-white dark:text-neutral-950">+ New invoice</div>
                <nav className="mt-4 space-y-0.5 text-xs">
                  {[["Overview", true], ["Invoices", false], ["Estimates", false], ["Clients", false], ["Payments", false], ["Expenses", false], ["Reports", false], ["Settings", false]].map(([label, active]) => (
                    <div key={label as string} className={`rounded-md px-2.5 py-1.5 ${active ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"}`}>{label}</div>
                  ))}
                </nav>
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Dashboard</span>
                  <span className="rounded-lg bg-neutral-950 dark:bg-neutral-50 px-3 py-1.5 text-xs font-medium text-white dark:text-neutral-950">+ New invoice</span>
                </div>
                <p className="mt-5 font-serif text-2xl text-neutral-900 dark:text-neutral-50">Welcome back, Tony</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Here&apos;s what&apos;s happening with TJN Agency.</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Revenue this month", "£4.2k", "£61.8k all time"],
                    ["Outstanding", "£3.6k", "4 awaiting payment"],
                    ["Overdue", "£420", "1 client to chase"],
                    ["Total invoices", "42", "38 paid"],
                  ].map(([label, value, sub]) => (
                    <div key={label} className="rounded-xl border border-neutral-200 dark:border-neutral-900 p-3">
                      <p className="font-mono text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
                      <p className="mt-1.5 font-serif text-xl text-neutral-900 dark:text-neutral-50">{value}</p>
                      <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">{sub}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-neutral-200 dark:border-neutral-900">
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-900 px-4 py-3"><span className="text-xs text-neutral-700 dark:text-neutral-300">Latest invoices</span><span className="text-[10px] text-neutral-500 dark:text-neutral-400">View all →</span></div>
                  {[
                    ["INV-0042", "Northwind Studio", "Sent", "#60a5fa", "£6,000.00"],
                    ["INV-0039", "Bright & Co", "Overdue", "#f87171", "£420.00"],
                    ["INV-0037", "Harbor Films", "Paid", "#34d399", "£2,150.00"],
                  ].map(([num, client, status, color, amount]) => (
                    <div key={num} className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-900 px-4 py-3 text-xs last:border-b-0">
                      <span className="w-24 text-neutral-900 dark:text-neutral-100">{num}</span>
                      <span className="flex-1 text-neutral-500 dark:text-neutral-400">{client}</span>
                      <span className="w-20 font-mono text-[10px]" style={{ color }}>{status}</span>
                      <span className="w-24 text-right text-neutral-600 dark:text-neutral-200">{amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERSONAS — bento */}
      <section className="border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-24`}>
          <p className={`${KICKER} text-center`}>Who it&apos;s for</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-900 dark:text-neutral-50">
            One tool, however you work.
          </h2>
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {USE_CASES.map((useCase) => (
              <div key={useCase.role} className={`${CARD} flex flex-col p-8`}>
                <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">{useCase.role}</h3>
                <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-200 leading-relaxed">{useCase.description}</p>
                <ul className="mt-6 space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-6">
                  {useCase.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-base text-neutral-700 dark:text-neutral-300">
                      <span className="mt-0.5 text-emerald-600 dark:text-emerald-400" aria-hidden>✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200 dark:border-neutral-900 py-24 text-center">
        <h2 className="font-serif text-4xl md:text-5xl text-neutral-900 dark:text-neutral-50">See it in action</h2>
        <p className="mt-4 text-neutral-600 dark:text-neutral-200">Start a free 7-day trial — no credit card needed.</p>
        <Link href="/signup" className="mt-9 inline-block px-6 py-3.5 rounded-xl bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 font-medium hover:bg-neutral-800 dark:hover:bg-white transition-colors">
          Start free trial →
        </Link>
      </section>
    </div>
  );
}
