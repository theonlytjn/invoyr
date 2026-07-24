import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { PLANS, type PlanId } from "@/config/plans";

export const metadata: Metadata = { title: "Pricing" };

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
      { label: "Bulk invoice actions", starter: false, business: true, pro: true },
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
    return <span className={emphasis ? "text-neutral-50" : "text-neutral-300"}>{value}</span>;
  }
  if (value) {
    return (
      <svg viewBox="0 0 16 16" className={`w-4 h-4 ${emphasis ? "text-emerald-400" : "text-emerald-500/80"}`} aria-label="Included">
        <path fill="currentColor" d="M6.2 11.3 3.4 8.5l1.1-1.1 1.7 1.7 4.2-4.2 1.1 1.1z" />
      </svg>
    );
  }
  return <span className="text-neutral-700" aria-label="Not included">—</span>;
}

export default function PricingPage() {
  const planOrder: PlanId[] = ["starter", "business", "pro"];
  const plans = planOrder.map((id) => PLANS.find((p) => p.id === id)!);

  return (
    <div className="bg-neutral-950 text-neutral-100">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-24 sm:py-32">
        {/* Header */}
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-neutral-50">
            One price a year.
            <br />
            <span className="text-neutral-400">No per-invoice fees, ever.</span>
          </h1>
          <p className="mt-6 text-lg text-neutral-200">
            Every plan is billed annually and includes a 7-day free trial — no card required.
            Start on Starter, move up when your business does.
          </p>
        </div>

        {/* Plan headers */}
        <div data-reveal className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-800/60 border border-neutral-800/60 rounded-2xl overflow-hidden">
          {plans.map((plan) => {
            const popular = plan.popular;
            return (
              <div
                key={plan.id}
                className={`p-8 flex flex-col ${popular ? "bg-neutral-900" : "bg-neutral-950"}`}
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="font-serif text-2xl text-neutral-50">{plan.name}</h2>
                  {popular && (
                    <span className="text-[11px] uppercase tracking-widest text-emerald-400">Popular</span>
                  )}
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-serif text-4xl text-neutral-50">{plan.price}</span>
                  <span className="text-sm text-neutral-400">{plan.period}</span>
                </div>
                <p className="mt-1 text-sm text-neutral-400">{plan.users}</p>
                <Link
                  href="/signup"
                  className={`mt-8 block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    popular
                      ? "bg-neutral-50 text-neutral-950 hover:bg-white"
                      : "border border-neutral-700 text-neutral-100 hover:bg-neutral-900"
                  }`}
                >
                  Start free trial
                </Link>
              </div>
            );
          })}
        </div>

        {/* Comparison matrix */}
        <div data-reveal className="mt-20">
          <h3 className="font-serif text-2xl text-neutral-50 mb-8">What each plan includes</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-base border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left font-normal text-neutral-400 pb-4 w-2/5">Feature</th>
                  {plans.map((p) => (
                    <th
                      key={p.id}
                      className={`text-center pb-4 font-medium ${p.popular ? "text-neutral-50" : "text-neutral-300"}`}
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
                        className="pt-8 pb-3 text-[11px] uppercase tracking-widest text-neutral-400 border-b border-neutral-800/60"
                      >
                        {group.title}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.label} className="group">
                        <td className="py-3 pr-4 text-neutral-300 border-b border-neutral-900">{row.label}</td>
                        <td className="py-3 text-center border-b border-neutral-900">
                          <span className="inline-flex justify-center w-full"><Cell value={row.starter} /></span>
                        </td>
                        <td className="py-3 text-center border-b border-neutral-900 bg-neutral-900/40">
                          <span className="inline-flex justify-center w-full"><Cell value={row.business} emphasis /></span>
                        </td>
                        <td className="py-3 text-center border-b border-neutral-900">
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
        <div data-reveal className="mt-20 border-t border-neutral-800/60 pt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-neutral-200">
            Not sure which plan? Start on the 7-day trial — you can change tier any time.
          </p>
          <Link
            href="/signup"
            className="inline-flex justify-center px-5 py-2.5 rounded-lg bg-neutral-50 text-neutral-950 text-sm font-medium hover:bg-white transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </div>
  );
}
