import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Invoyr",
  description: "Why we built Invoyr and what we believe about running a business.",
};

const KICKER = "font-mono text-xs uppercase tracking-[0.14em] text-neutral-500";
const CONTAINER = "max-w-[1600px] mx-auto px-6 lg:px-12";
const CARD = "rounded-2xl border border-neutral-800 bg-gradient-to-br from-emerald-800/20 via-neutral-900 to-neutral-950";

const STATS = [
  { stat: "7 days", label: "Free trial, no card required" },
  { stat: "Direct", label: "Payments go straight to your Stripe" },
  { stat: "2 min", label: "From new invoice to sent" },
];

const BELIEFS = [
  { heading: "Simplicity beats features", body: "Every feature we add should make the product simpler to use, not more powerful-looking." },
  { heading: "Your money is your money", body: "We use Stripe Connect so payments go straight to your account. We never take a cut of your invoices." },
  { heading: "Chasing invoices is embarrassing", body: "So we automate it. Polite, professional reminders that go out in your name — and actually work." },
  { heading: "Small businesses deserve good software", body: "Too much SaaS is built for enterprises. Invoyr is built for the person doing the work." },
];

export default function AboutPage() {
  return (
    <div>
      {/* HERO */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-8 text-center">
        <p className={`${KICKER} mb-8`}>About Invoyr</p>
        <h1 className="font-serif text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] tracking-tight text-neutral-50">
          We built the tool we wished we had
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-xl text-neutral-400 leading-relaxed">
          A focused invoicing tool for freelancers and small agencies — send a professional invoice, take card payments, and get paid, all without the admin.
        </p>
      </section>

      {/* STORY + product panel */}
      <section className="border-t border-neutral-900">
        <div className={`${CONTAINER} py-20 grid items-center gap-12 lg:grid-cols-2`}>
          <div className="space-y-5 text-lg text-neutral-400 leading-relaxed">
            <p>
              Every freelancer and small agency has been there: sending a Word-document invoice,
              waiting weeks to be paid, and manually chasing clients over email. It&apos;s slow,
              unprofessional, and wastes time you should be spending on actual work.
            </p>
            <p>
              We built Invoyr to fix that — a focused invoicing tool, not an all-in-one accounting
              suite that needs a CFO to operate. Create a professional invoice, send it, and accept
              card payments in under two minutes.
            </p>
            <p>
              It&apos;s built on straightforward principles: your money goes directly to your own
              Stripe account, your data is yours, and the product should feel fast and simple on any device.
            </p>
          </div>

          <div className={`${CARD} overflow-hidden p-8 sm:p-10`}>
            <div className="rounded-xl border border-white/10 bg-neutral-950 p-6 shadow-2xl shadow-black/50">
              <div className="flex items-start justify-between">
                <div><p className="font-serif text-lg text-neutral-50">TJN Agency</p><p className="mt-0.5 font-mono text-[10px] text-neutral-500">Invoice · INV-0042</p></div>
                <span className="h-8 w-8 rounded" style={{ backgroundColor: "rgba(52, 211, 153, 0.9)" }} />
              </div>
              <div className="mt-5 flex justify-between border-t border-neutral-900 pt-4 text-[11px]">
                <div><p className="text-neutral-500">Billed to</p><p className="mt-0.5 text-neutral-200">Northwind Studio</p></div>
                <div className="text-right"><p className="text-neutral-500">Due</p><p className="mt-0.5 text-neutral-200">07 Jul 2026</p></div>
              </div>
              <div className="mt-5 space-y-3 border-t border-neutral-900 pt-4 text-xs">
                <div className="flex justify-between text-neutral-400"><span>Brand identity — phase 2</span><span className="text-neutral-200">£4,200.00</span></div>
                <div className="flex justify-between text-neutral-400"><span>Web design retainer</span><span className="text-neutral-200">£1,800.00</span></div>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-neutral-900 pt-4">
                <span className="text-xs text-neutral-500">Total due</span>
                <span className="font-serif text-2xl text-neutral-50">£6,000.00</span>
              </div>
              <div className="mt-4 rounded-lg bg-neutral-50 py-2.5 text-center text-xs font-medium text-neutral-950">Pay now</div>
            </div>
          </div>
        </div>
      </section>

      {/* BELIEFS — bento */}
      <section className="border-t border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <p className={`${KICKER} text-center`}>What we believe</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-50">
            Principles, not features.
          </h2>
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {BELIEFS.map((b) => (
              <div key={b.heading} className={`${CARD} p-8`}>
                <h3 className="font-serif text-2xl text-neutral-50">{b.heading}</h3>
                <p className="mt-3 text-lg text-neutral-400 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS — bento */}
      <section className="border-t border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <div className="grid gap-4 sm:grid-cols-3">
            {STATS.map((item) => (
              <div key={item.label} className={`${CARD} p-8 text-center`}>
                <p className="font-serif text-5xl text-neutral-50">{item.stat}</p>
                <p className="mt-3 text-neutral-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-900 py-24 text-center">
        <h2 className="font-serif text-4xl md:text-5xl text-neutral-50">Built for the person doing the work.</h2>
        <p className="mt-4 text-neutral-400">7-day free trial. No credit card required.</p>
        <div className="mt-9 flex items-center justify-center gap-5">
          <Link href="/signup" className="px-6 py-3.5 rounded-xl bg-neutral-50 text-neutral-950 font-medium hover:bg-white transition-colors">
            Start free trial
          </Link>
          <Link href="/contact" className="text-base text-neutral-400 hover:text-neutral-100 transition-colors">
            Get in touch →
          </Link>
        </div>
      </section>
    </div>
  );
}
