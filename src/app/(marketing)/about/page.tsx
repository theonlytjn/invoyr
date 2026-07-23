import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Invoyr",
  description: "Why we built Invoyr and what we believe about running a business.",
};

const KICKER = "font-mono text-xs uppercase tracking-[0.14em] text-neutral-500";

const STATS = [
  { stat: "7 days", label: "Free trial, no card required" },
  { stat: "Direct", label: "Payments go straight to your Stripe" },
  { stat: "5 min", label: "Average time to first invoice sent" },
];

const BELIEFS = [
  { heading: "Simplicity beats features", body: "Every feature we add should make the product simpler to use, not more powerful-looking." },
  { heading: "Your money is your money", body: "We use Stripe Connect so payments go straight to your account. We don’t earn a cut of your invoices." },
  { heading: "Chasing invoices is embarrassing", body: "Automated reminders are a good thing. Polite, professional, and it works." },
  { heading: "Small businesses deserve good software", body: "Too much SaaS is built for enterprises. Invoyr is built for the person doing the work." },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-24 pb-24">
      <p className={`${KICKER} mb-8`}>About</p>
      <h1 className="font-serif text-[clamp(2.4rem,5.5vw,4.5rem)] leading-[0.98] tracking-tight text-neutral-50">
        We built the tool
        <br />
        we wished we had
      </h1>

      <div className="mt-10 space-y-5 text-xl text-neutral-400 leading-relaxed">
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

      <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-900 border-y border-neutral-900">
        {STATS.map((item) => (
          <div key={item.label} className="px-6 py-8">
            <p className="font-serif text-4xl text-neutral-50">{item.stat}</p>
            <p className="mt-2 text-base text-neutral-500">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="font-serif text-3xl text-neutral-50 mb-8">What we believe</h2>
        <ul className="divide-y divide-neutral-900 border-t border-neutral-900">
          {BELIEFS.map((item) => (
            <li key={item.heading} className="py-6 flex gap-4">
              <span className="mt-3 w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
              <div className="text-lg">
                <span className="text-neutral-100">{item.heading} — </span>
                <span className="text-neutral-400">{item.body}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-14 pt-12 border-t border-neutral-900 flex items-center gap-5">
        <Link href="/signup" className="px-5 py-3 rounded-xl bg-neutral-50 text-neutral-950 font-medium hover:bg-white transition-colors">
          Start free trial
        </Link>
        <Link href="/contact" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">
          Get in touch →
        </Link>
      </div>
    </div>
  );
}
