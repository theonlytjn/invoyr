import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoyr — Get paid faster",
  description:
    "Send professional invoices, take card payments with Stripe, and let reminders chase for you. Invoicing for freelancers, agencies and service businesses.",
};

const KICKER = "font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500";

const PROBLEMS = [
  { n: "01 — Late payments", body: "Invoices sit unpaid for weeks while your cash flow takes the hit." },
  { n: "02 — Manual admin", body: "Rebuilding the same invoice, tracking who paid, reconciling by hand." },
  { n: "03 — Awkward chasing", body: "Nobody likes the “just following up” email — so it never gets sent." },
];

const BENEFITS = [
  { n: "01", title: "Professional invoices", body: "Four templates, your logo and accent colour. Send as a PDF or a pay link." },
  { n: "02", title: "Payments everywhere", body: "Stripe card payments on every plan, plus PayPal and bank transfer." },
  { n: "03", title: "Automated reminders", body: "Polite nudges at 7, 14 and 30 days overdue — sent automatically, in your name." },
  { n: "04", title: "Full visibility", body: "Paid, outstanding and overdue at a glance — with estimates, expenses and reports." },
];

const FEATURES = [
  { title: "Invoices & estimates", body: "Send quotes, convert to invoices, set recurring bills for retainers." },
  { title: "Payments, built in", body: "A pay link with Stripe, PayPal and bank transfer. Marked paid automatically." },
  { title: "Reminders & reporting", body: "Auto-chases overdue invoices; ageing and exports keep the books tidy." },
];

const INTEGRATIONS = ["Stripe", "PayPal", "QuickBooks", "Xero"];

const PLANS = [
  {
    name: "Starter", price: "£79", users: "1 user", popular: false, cta: "Start free trial",
    features: ["Unlimited invoices & estimates", "Stripe card payments", "Bank transfer & 4 templates", "Expenses & multi-currency"],
  },
  {
    name: "Business", price: "£149", users: "Up to 5 users", popular: true, cta: "Start free trial",
    features: ["Everything in Starter", "PayPal payments", "Remove “Powered by Invoyr”", "Recurring invoices & reports"],
  },
  {
    name: "Pro", price: "£249", users: "Unlimited users", popular: false, cta: "Start free trial",
    features: ["Everything in Business", "Open Banking sync & import", "Automated reminders", "API access & webhooks"],
  },
];

const FAQS = [
  { q: "Is there a free trial?", a: "Yes — every plan starts with a 7-day free trial, no card required." },
  { q: "What payment methods can my clients use?", a: "Stripe card payments on every plan, plus PayPal (Business+) and bank transfer." },
  { q: "Are there per-invoice fees?", a: "No. One price a year — send as many invoices as you like." },
  { q: "Can I change plan later?", a: "Any time. Start on Starter and move up as your business grows." },
  { q: "Does the money go straight to me?", a: "Yes — payments settle directly to your own Stripe or PayPal account." },
];

const glow = {
  background:
    "radial-gradient(50% 55% at 50% 0%, color-mix(in oklab, var(--brand) 14%, transparent), transparent 70%)",
};

export default function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative" style={glow}>
        <div className="max-w-4xl mx-auto px-6 pt-28 pb-20 text-center">
          <p className={`reveal ${KICKER} mb-8`}>Invoicing for service businesses</p>
          <h1 className="reveal font-serif text-[clamp(3rem,8vw,6.5rem)] leading-[0.9] tracking-tight text-neutral-50">
            Get paid faster.
            <br />
            <span className="text-neutral-500">Invoicing that runs itself.</span>
          </h1>
          <p className="reveal mt-8 mx-auto max-w-xl text-lg text-neutral-400 leading-relaxed">
            Send invoices that look the part, take card payments with Stripe, and let reminders chase for you — so you get paid without the admin.
          </p>
          <div className="reveal mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="px-5 py-3 rounded-xl bg-neutral-50 text-neutral-950 font-medium hover:bg-white transition-colors">
              Start free trial
            </Link>
            <Link href="/pricing" className="px-5 py-3 rounded-xl border border-neutral-800 text-neutral-200 hover:bg-neutral-900 transition-colors">
              View pricing
            </Link>
          </div>
          <div className="reveal mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-brand" />No credit card needed</span>
            <span className="inline-flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-brand" />7-day free trial</span>
          </div>
          <div className="reveal mt-16">
            <p className={KICKER}>Trusted by freelancers, agencies &amp; service businesses</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-neutral-600 font-serif text-xl">
              <span>Northwind</span><span>Orbit&amp;Co</span><span>Kelu Studio</span><span>Fern</span><span>Maple Row</span><span>Vecta</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.02] text-neutral-50">
              Chasing invoices is
              <br />
              <span className="text-neutral-600">killing your cash flow.</span>
            </h2>
            <p className="mt-5 text-neutral-400">Late payments, manual admin and awkward follow-ups. Invoyr takes all three off your plate.</p>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-x-10 gap-y-10">
            {PROBLEMS.map((p) => (
              <div key={p.n} className="border-t border-neutral-800 pt-6">
                <span className={KICKER}>{p.n}</span>
                <p className="mt-3 text-neutral-400 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.02] text-neutral-50 max-w-2xl">
            Why businesses get
            <br />
            paid faster with Invoyr
          </h2>
          <div className="mt-14 grid sm:grid-cols-2 gap-x-12 gap-y-12">
            {BENEFITS.map((b) => (
              <div key={b.n} className="flex gap-5">
                <span className="font-serif text-3xl text-neutral-600 leading-none pt-1">{b.n}</span>
                <div>
                  <h3 className="font-serif text-2xl text-neutral-50">{b.title}</h3>
                  <p className="mt-2 text-neutral-400 leading-relaxed">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE SPLIT */}
      <section className="border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.02] text-neutral-50">
              A calmer way to
              <br />
              run your money.
            </h2>
            <p className="mt-5 text-neutral-400 max-w-md">Invoices, payments and reminders — all in one place, all working while you don’t.</p>
            <div className="mt-10 divide-y divide-neutral-900 border-t border-neutral-900">
              {FEATURES.map((f) => (
                <div key={f.title} className="py-5">
                  <h3 className="text-lg text-neutral-100">{f.title}</h3>
                  <p className="mt-1 text-neutral-500">{f.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* product panel */}
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950 overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-900 flex items-center justify-between">
              <span className="font-serif text-xl text-neutral-50">Overview</span>
              <span className={KICKER}>Jul 2026</span>
            </div>
            <div className="p-6 grid grid-cols-3 gap-px bg-neutral-900 border border-neutral-900 rounded-xl overflow-hidden">
              <div className="bg-neutral-950 p-4"><p className={KICKER}>Collected</p><p className="font-serif text-2xl text-neutral-50 mt-1">£18,240</p></div>
              <div className="bg-neutral-950 p-4"><p className={KICKER}>Outstanding</p><p className="font-serif text-2xl text-neutral-50 mt-1">£3,600</p></div>
              <div className="bg-neutral-950 p-4"><p className={KICKER}>Overdue</p><p className="font-serif text-2xl text-red-400 mt-1">£420</p></div>
            </div>
            <div className="px-6 pb-6 pt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-neutral-900"><span className="text-neutral-300">INV-0042 · Northwind</span><span className="font-mono text-xs text-emerald-500">PAID</span></div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-900"><span className="text-neutral-300">INV-0041 · Orbit &amp; Co</span><span className="font-mono text-xs text-emerald-500">PAID</span></div>
              <div className="flex items-center justify-between py-2"><span className="text-neutral-300">INV-0040 · Fern</span><span className="font-mono text-xs text-neutral-500">SENT</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h2 className="font-serif text-3xl md:text-4xl text-neutral-50">Works with the tools you already use</h2>
            <p className="text-neutral-500">Get paid and keep the books in sync.</p>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-900 border-y border-neutral-900">
            {INTEGRATIONS.map((name, i) => (
              <div key={name} className="px-6 py-8">
                <span className={KICKER}>/{String(i + 1).padStart(2, "0")}</span>
                <p className="font-serif text-2xl text-neutral-100 mt-3">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="border-t border-neutral-900">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <p className="font-serif text-3xl md:text-4xl leading-snug text-neutral-100">
            “Invoyr paid for itself in the first week. Invoices go out in minutes and clients actually pay on time now.”
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="w-9 h-9 rounded-full bg-neutral-800" />
            <div className="text-left text-sm">
              <p className="text-neutral-200">Placeholder Name</p>
              <p className="text-neutral-500">Founder, Placeholder Studio</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-t border-neutral-900">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.05] text-neutral-50">
              One price a year.
              <br />
              <span className="text-neutral-500">No per-invoice fees, ever.</span>
            </h2>
            <p className="mt-5 text-neutral-400">Every plan is billed annually and includes a 7-day free trial — no card required.</p>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-px bg-neutral-800/60 border border-neutral-800/60 rounded-2xl overflow-hidden">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`p-8 flex flex-col ${plan.popular ? "bg-neutral-900" : "bg-neutral-950"}`}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-2xl text-neutral-50">{plan.name}</h3>
                  {plan.popular && <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand">Popular</span>}
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-serif text-4xl text-neutral-50">{plan.price}</span>
                  <span className="text-sm text-neutral-500">/year</span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">{plan.users}</p>
                <ul className="mt-7 space-y-2.5 text-sm text-neutral-300 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5"><span className="text-brand" aria-hidden>✓</span>{f}</li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-8 block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    plan.popular ? "bg-neutral-50 text-neutral-950 hover:bg-white" : "border border-neutral-700 text-neutral-100 hover:bg-neutral-900"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-neutral-900">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <h2 className="font-serif text-4xl md:text-5xl text-neutral-50 text-center">Frequently asked questions</h2>
          <div className="mt-12 divide-y divide-neutral-900 border-y border-neutral-900">
            {FAQS.map((item) => (
              <details key={item.q} className="py-5 group">
                <summary className="flex items-center justify-between cursor-pointer list-none text-neutral-100">
                  <span>{item.q}</span>
                  <span className="text-neutral-600 transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-neutral-500">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSE */}
      <section className="border-t border-neutral-900" style={glow}>
        <div className="max-w-4xl mx-auto px-6 py-28 text-center">
          <h2 className="font-serif text-[clamp(3rem,8vw,6rem)] leading-[0.95] text-neutral-50">
            Start getting paid
            <br />
            faster today.
          </h2>
          <Link href="/signup" className="mt-10 inline-block px-6 py-3.5 rounded-xl bg-neutral-50 text-neutral-950 font-medium hover:bg-white transition-colors">
            Start your free trial
          </Link>
          <p className={`mt-4 ${KICKER}`}>7-day free trial · no credit card required</p>
        </div>
      </section>
    </div>
  );
}
