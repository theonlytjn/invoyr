import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoyr — Get paid faster",
  description:
    "Send professional invoices, take card payments with Stripe, and let reminders chase for you. Invoicing for freelancers, agencies and service businesses.",
};

const KICKER = "font-mono text-xs uppercase tracking-[0.14em] text-neutral-500";
const CONTAINER = "max-w-[1600px] mx-auto px-6 lg:px-12";

const FEATURES = [
  { title: "Invoices & estimates", body: "Send quotes, convert to invoices, set recurring bills for retainers." },
  { title: "Payments, built in", body: "A pay link with Stripe, PayPal and bank transfer. Marked paid automatically." },
  { title: "Reminders & reporting", body: "Auto-chases overdue invoices; ageing and exports keep the books tidy." },
];

const INTEGRATIONS = [
  { name: "Stripe", src: "/stripe.svg" },
  { name: "PayPal", src: "/paypal.svg" },
  { name: "QuickBooks", src: "/quickbooks.svg" },
  { name: "Xero", src: "/xero.svg" },
];

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
          <p className="reveal mt-8 mx-auto max-w-xl text-xl text-neutral-400 leading-relaxed">
            Send invoices that look the part, take card payments with Stripe, and let reminders chase for you — so you get paid without the admin.
          </p>
          <div className="reveal mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="px-6 py-3.5 rounded-xl bg-neutral-50 text-neutral-950 font-medium text-base hover:bg-white transition-colors">
              Start free trial
            </Link>
            <Link href="/pricing" className="px-6 py-3.5 rounded-xl border border-neutral-800 text-neutral-200 text-base hover:bg-neutral-900 transition-colors">
              View pricing
            </Link>
          </div>
          <div className="reveal mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-base text-neutral-500">
            <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand" />No credit card needed</span>
            <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand" />7-day free trial</span>
          </div>
          <div className="reveal mt-16">
            <p className={KICKER}>Trusted by freelancers, agencies &amp; service businesses</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-neutral-600 font-serif text-2xl">
              <span>Northwind</span><span>Orbit&amp;Co</span><span>Kelu Studio</span><span>Fern</span><span>Maple Row</span><span>Vecta</span>
            </div>
          </div>
        </div>
      </section>

      {/* SHOWCASE — reports + reminders */}
      <section className="border-t border-neutral-900">
        <div className={`${CONTAINER} py-24`}>
          <p className={KICKER}>Reports &amp; reminders</p>
          <h2 className="mt-6 max-w-4xl font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-50">
            See where you stand — then never chase again.
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-neutral-400 leading-relaxed">
            Invoyr shows you exactly what&apos;s paid, outstanding and overdue, then chases the late ones for you — so nothing slips and you never send another awkward “just following up”.
          </p>

          <div className="mt-16 grid lg:grid-cols-2 gap-8">
            {/* Reports */}
            <div>
              <div className="flex h-96 items-center overflow-hidden rounded-2xl border border-neutral-900 bg-gradient-to-br from-emerald-800/25 via-neutral-900 to-neutral-950 p-6 sm:p-10">
                <div className="w-full rounded-xl border border-white/10 bg-neutral-950 p-6 shadow-2xl shadow-black/50">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xl text-neutral-50">Revenue</span>
                    <span className="font-mono text-[11px] text-neutral-500">Last 6 months</span>
                  </div>
                  <div className="mt-6 flex items-end gap-2.5">
                    {[52, 74, 62, 96, 82, 118].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}px`, backgroundColor: "rgba(52, 211, 153, 0.8)" }} />
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-neutral-900 pt-5 text-center">
                    <div><p className="font-serif text-2xl text-neutral-50">£18.2k</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-neutral-500">Collected</p></div>
                    <div><p className="font-serif text-2xl text-neutral-50">£3.6k</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-neutral-500">Outstanding</p></div>
                    <div><p className="font-serif text-2xl text-red-400">£420</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-neutral-500">Overdue</p></div>
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <h3 className="font-serif text-2xl text-neutral-50">Reports &amp; insights</h3>
                <p className="mt-3 text-lg text-neutral-400 leading-relaxed">Revenue, outstanding and overdue at a glance — with ageing, top clients and CSV export whenever your accountant asks.</p>
                <Link href="/features" className="group mt-4 inline-flex items-center gap-1.5 text-base text-neutral-100 transition-colors hover:text-emerald-400">
                  See how it works <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            </div>

            {/* Reminders */}
            <div>
              <div className="flex h-96 items-center overflow-hidden rounded-2xl border border-neutral-900 bg-gradient-to-br from-slate-600/30 via-neutral-900 to-neutral-950 p-6 sm:p-10">
                <div className="w-full rounded-xl border border-white/10 bg-neutral-950 p-6 shadow-2xl shadow-black/50">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xl text-neutral-50">INV-0042 · Northwind</span>
                    <span className="rounded-full bg-red-500/15 px-2.5 py-1 font-mono text-[10px] text-red-400">7 DAYS OVERDUE</span>
                  </div>
                  <div className="mt-5 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-neutral-500">Auto-reminder · sent in your name</p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-300">Hi Sarah — a friendly reminder that invoice INV-0042 for £6,000 is now 7 days overdue. You can pay securely below. Thank you!</p>
                    <span className="mt-3 inline-block rounded-md bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-950">Pay now</span>
                  </div>
                  <div className="mt-5 flex items-center gap-2.5 border-t border-neutral-900 pt-5 font-mono text-[11px] text-neutral-500">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />7 days</span>
                    <span>→</span><span>14 days</span><span>→</span><span>30 days</span>
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <h3 className="font-serif text-2xl text-neutral-50">Automated reminders</h3>
                <p className="mt-3 text-lg text-neutral-400 leading-relaxed">Polite nudges at 7, 14 and 30 days overdue go out automatically in your name. You stop chasing; clients still pay on time.</p>
                <Link href="/features" className="group mt-4 inline-flex items-center gap-1.5 text-base text-neutral-100 transition-colors hover:text-emerald-400">
                  See how it works <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS — bento grid */}
      <section className="border-t border-neutral-900">
        <div className={`${CONTAINER} py-24`}>
          <p className={`${KICKER} text-center`}>Everything you need</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-50">
            Why businesses get paid faster with Invoyr
          </h2>

          <div className="mt-16 grid gap-4 lg:grid-cols-3">
            {/* Payments — tall, phone */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-emerald-800/25 via-neutral-900 to-neutral-950 p-8">
              <h3 className="font-serif text-2xl text-neutral-50">Payments everywhere</h3>
              <p className="mt-3 text-neutral-400 leading-relaxed">Card, PayPal or bank transfer — your client taps the link and pays from their phone, so you get paid on the go.</p>
              <div className="h-80" aria-hidden />
              <div className="absolute inset-x-0 top-44 flex justify-center">
                <div className="w-72 rounded-t-3xl border-8 border-b-0 border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/60">
                  <div className="flex items-center justify-between px-5 pb-1 pt-3 font-mono text-[10px] text-neutral-400">
                    <span>9:41</span><span>5G ▬▬▬</span>
                  </div>
                  <div className="px-5 pb-8 pt-2">
                    <div className="rounded-lg bg-neutral-900 px-4 py-3">
                      <p className="font-serif text-base text-neutral-50">TJN Agency</p>
                      <p className="font-mono text-[10px] text-neutral-500">#INV-0042</p>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                      <span className="text-xs text-neutral-500">Amount due</span>
                      <span className="font-serif text-2xl text-neutral-50">£6,000</span>
                    </div>
                    <div className="mt-4 rounded-lg bg-neutral-50 py-2.5 text-center text-xs font-medium text-neutral-950">Pay now</div>
                    <div className="mt-2 rounded-lg border border-neutral-800 py-2.5 text-center text-xs text-neutral-300">Pay with PayPal</div>
                    <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-600">Or pay by bank transfer</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                      <div><p className="text-neutral-500">Account</p><p className="text-neutral-200">TJN Agency</p></div>
                      <div><p className="text-neutral-500">Sort code</p><p className="text-neutral-200">04-00-35</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle column */}
            <div className="flex flex-col gap-4">
              {/* Full visibility */}
              <div className="flex flex-1 flex-col rounded-2xl border border-neutral-800 bg-gradient-to-br from-emerald-800/25 via-neutral-900 to-neutral-950 p-8">
                <h3 className="font-serif text-2xl text-neutral-50">Full visibility</h3>
                <p className="mt-3 text-neutral-400 leading-relaxed">Paid, outstanding and overdue at a glance.</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-serif text-4xl text-neutral-50">£18,240</span>
                  <span className="font-mono text-xs text-emerald-400">▲ 22%</span>
                </div>
                <div className="mt-4 flex items-end gap-1.5">
                  {[24, 34, 28, 44, 38, 52, 46, 62, 56, 74].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}px`, backgroundColor: "rgba(52, 211, 153, 0.8)" }} />
                  ))}
                </div>
              </div>
              {/* Automated reminders */}
              <div className="flex flex-1 flex-col rounded-2xl border border-neutral-800 bg-gradient-to-br from-emerald-800/25 via-neutral-900 to-neutral-950 p-8">
                <h3 className="font-serif text-2xl text-neutral-50">Automated reminders</h3>
                <p className="mt-3 text-neutral-400 leading-relaxed">Overdue invoices chased for you at 7, 14 and 30 days — in your name.</p>
                <div className="mt-6 flex items-center gap-2">
                  {["7d", "14d", "30d"].map((d, i) => (
                    <div key={d} className="flex items-center gap-2">
                      <span className="grid h-11 w-11 place-items-center rounded-full border border-neutral-800 bg-neutral-950 font-mono text-xs text-emerald-400">{d}</span>
                      {i < 2 && <span className="h-px w-6 bg-neutral-800" />}
                    </div>
                  ))}
                  <span className="ml-auto font-mono text-[11px] text-neutral-500">auto</span>
                </div>
              </div>
            </div>

            {/* Professional invoices — tall, invoice */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-emerald-800/25 via-neutral-900 to-neutral-950 p-8">
              <h3 className="font-serif text-2xl text-neutral-50">Professional invoices</h3>
              <p className="mt-3 text-neutral-400 leading-relaxed">Four templates, your logo and accent colour — sent as a polished PDF or a pay link.</p>
              <div className="mx-auto mt-8 w-full max-w-xs rounded-t-xl border border-b-0 border-white/10 bg-neutral-950 p-5 shadow-2xl shadow-black/60">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-serif text-base text-neutral-50">TJN Agency</p>
                    <p className="mt-0.5 font-mono text-[9px] text-neutral-500">Invoice · INV-0042</p>
                  </div>
                  <span className="h-6 w-6 rounded bg-emerald-500/80" />
                </div>
                <div className="mt-5 space-y-2 border-t border-neutral-900 pt-4 text-[11px]">
                  <div className="flex justify-between text-neutral-400"><span>Brand identity — phase 2</span><span className="text-neutral-200">£4,200</span></div>
                  <div className="flex justify-between text-neutral-400"><span>Web design retainer</span><span className="text-neutral-200">£1,800</span></div>
                </div>
                <div className="mt-4 flex items-baseline justify-between border-t border-neutral-900 pt-4">
                  <span className="text-[11px] text-neutral-500">Total</span>
                  <span className="font-serif text-xl text-neutral-50">£6,000.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE SPLIT */}
      <section className="border-t border-neutral-900">
        <div className={`${CONTAINER} py-24 grid lg:grid-cols-2 gap-14 items-center`}>
          <div>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.02] text-neutral-50">
              A calmer way to
              <br />
              run your money.
            </h2>
            <p className="mt-5 text-lg text-neutral-400 max-w-md">Invoices, payments and reminders — all in one place, all working while you don’t.</p>
            <div className="mt-10 divide-y divide-neutral-900 border-t border-neutral-900">
              {FEATURES.map((f) => (
                <div key={f.title} className="py-5">
                  <h3 className="text-xl text-neutral-100">{f.title}</h3>
                  <p className="mt-1.5 text-lg text-neutral-500">{f.body}</p>
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
            <div className="px-6 pb-6 pt-4 space-y-2 text-base">
              <div className="flex items-center justify-between py-2 border-b border-neutral-900"><span className="text-neutral-300">INV-0042 · Northwind</span><span className="font-mono text-xs text-emerald-500">PAID</span></div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-900"><span className="text-neutral-300">INV-0041 · Orbit &amp; Co</span><span className="font-mono text-xs text-emerald-500">PAID</span></div>
              <div className="flex items-center justify-between py-2"><span className="text-neutral-300">INV-0040 · Fern</span><span className="font-mono text-xs text-neutral-500">SENT</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="border-t border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h2 className="font-serif text-3xl md:text-4xl text-neutral-50">Works with the tools you already use</h2>
            <p className="text-lg text-neutral-500">Get paid and keep the books in sync.</p>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-900 border-y border-neutral-900">
            {INTEGRATIONS.map((it, i) => (
              <div key={it.name} className="flex items-center justify-between gap-4 px-8 py-14">
                <div>
                  <span className={KICKER}>/{String(i + 1).padStart(2, "0")}</span>
                  <p className="mt-3 font-serif text-2xl text-neutral-100">{it.name}</p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.src} alt={it.name} className="h-20 md:h-28 w-auto object-contain shrink-0" />
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
            <span className="w-10 h-10 rounded-full bg-neutral-800" />
            <div className="text-left">
              <p className="text-neutral-200">Placeholder Name</p>
              <p className="text-sm text-neutral-500">Founder, Placeholder Studio</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-t border-neutral-900">
        <div className={`${CONTAINER} py-24`}>
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.05] text-neutral-50">
              One price a year.
              <br />
              <span className="text-neutral-500">No per-invoice fees, ever.</span>
            </h2>
            <p className="mt-5 text-lg text-neutral-400">Every plan is billed annually and includes a 7-day free trial — no card required.</p>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-px bg-neutral-800/60 border border-neutral-800/60 rounded-2xl overflow-hidden">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`p-8 flex flex-col ${plan.popular ? "bg-neutral-900" : "bg-neutral-950"}`}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-2xl text-neutral-50">{plan.name}</h3>
                  {plan.popular && <span className="font-mono text-xs uppercase tracking-[0.14em] text-brand">Popular</span>}
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-serif text-5xl text-neutral-50">{plan.price}</span>
                  <span className="text-base text-neutral-500">/year</span>
                </div>
                <p className="mt-1 text-base text-neutral-500">{plan.users}</p>
                <ul className="mt-7 space-y-3 text-base text-neutral-300 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5"><span className="text-brand" aria-hidden>✓</span>{f}</li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-8 block text-center py-3 rounded-lg text-base font-medium transition-colors ${
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
                <summary className="flex items-center justify-between cursor-pointer list-none text-lg text-neutral-100">
                  <span>{item.q}</span>
                  <span className="text-neutral-600 transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-base text-neutral-500">{item.a}</p>
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
          <Link href="/signup" className="mt-10 inline-block px-6 py-3.5 rounded-xl bg-neutral-50 text-neutral-950 font-medium text-base hover:bg-white transition-colors">
            Start your free trial
          </Link>
          <p className={`mt-4 ${KICKER}`}>7-day free trial · no credit card required</p>
        </div>
      </section>
    </div>
  );
}
