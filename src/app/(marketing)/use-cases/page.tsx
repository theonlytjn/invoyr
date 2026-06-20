import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Use Cases — Invoyr",
  description: "How freelancers, agencies, and service businesses use Invoyr to get paid faster.",
};

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
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Made for anyone who invoices for a living
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Whether you&apos;re a solo freelancer or running a small agency, Invoyr adapts to how you work.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-6">
        {USE_CASES.map((useCase, i) => (
          <div
            key={useCase.role}
            className="bg-white border border-gray-200 rounded-xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
          >
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                {i + 1 < 10 ? `0${i + 1}` : i + 1}
              </p>
              <h2 className="text-xl font-bold text-gray-900 mb-3">{useCase.role}</h2>
              <p className="text-gray-500 leading-relaxed">{useCase.description}</p>
            </div>
            <ul className="space-y-3">
              {useCase.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-gray-900 text-white flex items-center justify-center shrink-0 text-[10px]">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <section className="bg-gray-50 border-t border-gray-100 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">See it in action</h2>
        <p className="text-gray-500 mb-8">Start a free 14-day trial — no credit card needed.</p>
        <Link
          href="/signup"
          className="inline-block px-8 py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
        >
          Start free trial →
        </Link>
      </section>
    </div>
  );
}
