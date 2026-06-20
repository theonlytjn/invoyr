import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Invoyr",
  description: "Why we built Invoyr and what we believe about running a business.",
};

export default function AboutPage() {
  return (
    <div>
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          We built the tool we wished we had
        </h1>
        <div className="space-y-5 text-gray-600 leading-relaxed text-lg">
          <p>
            Every freelancer and small agency has been there: sending a Word document invoice,
            waiting weeks to be paid, and manually chasing clients via email. It&apos;s slow,
            unprofessional, and wastes time you should be spending on actual work.
          </p>
          <p>
            We built Invoyr to fix that. It&apos;s a focused invoicing tool — not an all-in-one accounting
            suite that requires a CFO to operate. You can create a professional invoice, send it,
            and accept card payments in under two minutes.
          </p>
          <p>
            Invoyr is built on straightforward principles: your money goes directly to your Stripe
            account (we never hold it), your data is yours, and the product should feel fast and
            simple on any device.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { stat: "14 days", label: "Free trial, no card required" },
            { stat: "Direct", label: "Payments go straight to your Stripe" },
            { stat: "5 min", label: "Average time to first invoice sent" },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-gray-900">{item.stat}</p>
              <p className="text-sm text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What we believe</h2>
          <ul className="space-y-4">
            {[
              { heading: "Simplicity beats features", body: "Every feature we add should make the product simpler to use, not more powerful-looking." },
              { heading: "Your money is your money", body: "We use Stripe Connect so payments go straight to your account. We don’t earn a cut of your invoices." },
              { heading: "Chasing invoices is embarrassing", body: "Automated reminders are a good thing. Polite, professional, and it works." },
              { heading: "Small businesses deserve good software", body: "Too much SaaS is built for enterprises. Invoyr is built for the person doing the work." },
            ].map((item) => (
              <li key={item.heading} className="flex gap-4">
                <span className="mt-1 w-1 h-1 rounded-full bg-gray-900 shrink-0 mt-2" />
                <div>
                  <span className="font-semibold text-gray-900">{item.heading} — </span>
                  <span className="text-gray-600">{item.body}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 pt-12 border-t border-gray-100 flex items-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
          >
            Start free trial
          </Link>
          <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-900">
            Get in touch →
          </Link>
        </div>
      </section>
    </div>
  );
}
