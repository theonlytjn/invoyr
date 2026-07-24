import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Use Cases — Invoyr",
  description: "How freelancers, agencies, and service businesses use Invoyr to get paid faster.",
};

const KICKER = "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-400";

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
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <p className={`${KICKER} mb-8`}>Use cases</p>
        <h1 className="font-serif text-[clamp(2.4rem,5.5vw,4.5rem)] leading-[0.98] tracking-tight text-neutral-50">
          Made for anyone who
          <br />
          invoices for a living
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-xl text-neutral-200 leading-relaxed">
          Whether you&apos;re a solo freelancer or running a small agency, Invoyr adapts to how you work.
        </p>
      </section>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pb-8">
        {USE_CASES.map((useCase, i) => (
          <div key={useCase.role} className="border-t border-neutral-900 py-14 grid md:grid-cols-2 gap-10 items-start">
            <div>
              <span className={KICKER}>{`0${i + 1}`}</span>
              <h2 className="mt-3 font-serif text-3xl text-neutral-50">{useCase.role}</h2>
              <p className="mt-4 text-lg text-neutral-200 leading-relaxed max-w-md">{useCase.description}</p>
            </div>
            <ul className="space-y-4 md:pt-10">
              {useCase.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-lg text-neutral-300">
                  <span className="text-brand mt-0.5" aria-hidden>✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <section className="border-t border-neutral-900 py-24 text-center">
        <h2 className="font-serif text-4xl md:text-5xl text-neutral-50">See it in action</h2>
        <p className="mt-4 text-neutral-200">Start a free 7-day trial — no credit card needed.</p>
        <Link href="/signup" className="mt-9 inline-block px-6 py-3.5 rounded-xl bg-neutral-50 text-neutral-950 font-medium hover:bg-white transition-colors">
          Start free trial →
        </Link>
      </section>
    </div>
  );
}
