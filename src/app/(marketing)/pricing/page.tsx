import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { PLANS, isMonthlyBillingAvailable } from "@/config/plans";
import HeroBackdrop from "@/components/marketing/HeroBackdrop";
import PricingCards from "@/components/pricing/PricingCards";

export const metadata: Metadata = { title: "Pricing" };

const KICKER = "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400";
// Over the hero photo the grey kicker loses contrast in dark mode, so it goes white there.
const HERO_KICKER = "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-white";

// Marketing-facing comparison. Kept in step with PLAN_FEATURES in config/plans.ts.
// `true` = included; a string = the value shown for that plan (e.g. user count).
type Cell = boolean | string;
type Row = { label: string; starter: Cell; business: Cell; pro: Cell };
type Group = { title: string; rows: Row[] };

const MATRIX: Group[] = [
  {
    title: "Invoicing",
    rows: [
      { label: "Unlimited invoices & estimates", starter: true, business: true, pro: true },
      { label: "Credit notes & late fees", starter: true, business: true, pro: true },
      { label: "4 invoice templates", starter: true, business: true, pro: true },
      { label: "Recurring invoices", starter: false, business: true, pro: true },
      { label: "Bulk send, void, reminders & PDF export", starter: false, business: true, pro: true },
    ],
  },
  {
    title: "Getting paid",
    rows: [
      { label: "Online invoice portal", starter: true, business: true, pro: true },
      { label: "Stripe card payments", starter: true, business: true, pro: true },
      { label: "Pay by bank transfer", starter: true, business: true, pro: true },
      { label: "PayPal payments", starter: false, business: true, pro: true },
    ],
  },
  {
    title: "Clients & expenses",
    rows: [
      { label: "Client management", starter: true, business: true, pro: true },
      { label: "Expenses (manual entry)", starter: true, business: true, pro: true },
      { label: "Client statements", starter: false, business: true, pro: true },
      { label: "Open Banking — bank sync & import", starter: false, business: false, pro: true },
    ],
  },
  {
    title: "Reporting",
    rows: [
      { label: "Dashboard metrics", starter: true, business: true, pro: true },
      { label: "Advanced reports & ageing", starter: false, business: true, pro: true },
      { label: "Accounting exports — QuickBooks & Xero", starter: false, business: true, pro: true },
      { label: "CSV export", starter: false, business: false, pro: true },
    ],
  },
  {
    title: "Team",
    rows: [
      { label: "Users", starter: "1", business: "Up to 5", pro: "Unlimited" },
      { label: "Roles & permissions", starter: false, business: true, pro: true },
    ],
  },
  {
    title: "Automation & developer",
    rows: [
      { label: "Automated payment reminders", starter: false, business: false, pro: true },
      { label: "Custom email domain", starter: false, business: false, pro: true },
      { label: "API access & webhooks", starter: false, business: false, pro: true },
      { label: "Audit log", starter: false, business: false, pro: true },
    ],
  },
  {
    title: "Branding",
    rows: [
      { label: "Custom logo & branding", starter: true, business: true, pro: true },
      { label: "Remove “Powered by Invoyr” branding", starter: false, business: true, pro: true },
    ],
  },
];

function Cell({ value, emphasis }: { value: Cell; emphasis?: boolean }) {
  if (typeof value === "string") {
    return <span className={emphasis ? "text-neutral-900 dark:text-neutral-50" : "text-neutral-700 dark:text-neutral-300"}>{value}</span>;
  }
  if (value) {
    return (
      <svg viewBox="0 0 16 16" className={`w-4 h-4 ${emphasis ? "text-emerald-600 dark:text-emerald-400" : "text-emerald-600 dark:text-emerald-500/80"}`} aria-label="Included">
        <path fill="currentColor" d="M6.2 11.3 3.4 8.5l1.1-1.1 1.7 1.7 4.2-4.2 1.1 1.1z" />
      </svg>
    );
  }
  return <span className="text-neutral-700 dark:text-neutral-300" aria-label="Not included">—</span>;
}

export default function PricingPage() {
  const plans = PLANS;
  const monthlyAvailable = isMonthlyBillingAvailable();

  return (
    <div className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden lg:min-h-[70svh]">
        <HeroBackdrop images={["/hero/hero-pricing.jpg"]} />
        <div className="relative mx-auto w-full max-w-5xl px-6 py-24 text-center lg:px-12">
          <p className={`${HERO_KICKER} mb-8`}>Pricing</p>
          {/* Two lines, not three: the second line was wrapping on its own, so
              the container is wider and the type a touch smaller. */}
          <h1 className="font-serif text-[clamp(2.4rem,5.2vw,4.5rem)] leading-[0.95] tracking-tight text-balance text-neutral-900 dark:text-neutral-50">
            {monthlyAvailable ? "Simple pricing." : "One price a year."}
            <br />
            <span className="text-brand-ink">No per-invoice fees, ever.</span>
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-xl text-neutral-600 dark:text-neutral-200 leading-relaxed">
            {monthlyAvailable
              ? "Pay monthly, or pay yearly and get 2 months free. Every plan includes a 14-day free trial — cancel any time before it ends."
              : "Every plan is billed annually and includes a 14-day free trial — cancel any time before it ends."}{" "}
            Start on Starter, move up when your business does.
          </p>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pb-24 sm:pb-32">
        {/* Plan cards + Monthly | Yearly toggle */}
        <div data-reveal className="mt-16">
          <PricingCards monthlyAvailable={monthlyAvailable} />
        </div>

        {/* Comparison matrix */}
        <div data-reveal className="mt-20">
          <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50 mb-8">What each plan includes</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-base border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left font-normal text-neutral-500 dark:text-neutral-400 pb-4 w-2/5">Feature</th>
                  {plans.map((p) => (
                    <th
                      key={p.id}
                      className={`text-center pb-4 font-medium ${p.popular ? "text-neutral-900 dark:text-neutral-50" : "text-neutral-700 dark:text-neutral-300"}`}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((group) => (
                  <Fragment key={group.title}>
                    <tr>
                      <td
                        colSpan={4}
                        className="pt-8 pb-3 text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800/60"
                      >
                        {group.title}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.label} className="group">
                        <td className="py-3 pr-4 text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-900">{row.label}</td>
                        <td className="py-3 text-center border-b border-neutral-200 dark:border-neutral-900">
                          <span className="inline-flex justify-center w-full"><Cell value={row.starter} /></span>
                        </td>
                        <td className="py-3 text-center border-b border-neutral-200 dark:border-neutral-900 bg-neutral-100 dark:bg-neutral-900/40">
                          <span className="inline-flex justify-center w-full"><Cell value={row.business} emphasis /></span>
                        </td>
                        <td className="py-3 text-center border-b border-neutral-200 dark:border-neutral-900">
                          <span className="inline-flex justify-center w-full"><Cell value={row.pro} /></span>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Close */}
        <div data-reveal className="mt-20 border-t border-neutral-200 dark:border-neutral-800/60 pt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-neutral-600 dark:text-neutral-200">
            Not sure which plan? Start on the 14-day trial — you can change tier any time.
          </p>
          <Link
            href="/signup"
            className="inline-flex justify-center px-5 py-2.5 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-white transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </div>
  );
}
