import Link from "next/link";
import type { Metadata } from "next";
import ScrollReveal from "@/app/(marketing)/ScrollReveal";
import ScrollToTop from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: "Invoyr — Light preview",
  description: "Light-theme preview of the Invoyr homepage.",
};

const CONTAINER = "max-w-[1600px] mx-auto px-6 lg:px-12";
const KICKER = "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500";
const CARD =
  "rounded-2xl border border-neutral-200 bg-gradient-to-br from-emerald-50/70 via-white to-white shadow-[0_2px_18px_-6px_rgba(16,24,40,0.10)]";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
];

const TRUST_LOGOS = [
  "/scroll-logos/imgi_29_ZmlFdgHmuu7gfT6zg4q9mfz9pes.png",
  "/scroll-logos/imgi_30_AVyrr7uVWe2GLaTTJezwa0k8UW0.png",
  "/scroll-logos/imgi_31_114rWgMR70jq21kOoQqs1B03Ws.png",
  "/scroll-logos/imgi_32_ge6mYzyMHQjA1jBP7XFP1BKOKgI.png",
  "/scroll-logos/imgi_33_SdMXdJWeCzEzCDhNgnWwERY.png",
  "/scroll-logos/imgi_34_OruCoiwuzQE8nrhoIt1Z11Ycg.png",
];

const FEATURES = [
  { title: "Invoices & estimates", body: "Send quotes, convert to invoices, set recurring bills for retainers." },
  { title: "Payments, built in", body: "A pay link with Stripe, PayPal and bank transfer. Marked paid automatically." },
  { title: "Reminders & reporting", body: "Auto-chases overdue invoices; ageing and exports keep the books tidy." },
];

const PLANS = [
  { name: "Starter", price: "£79", period: "/year", users: "1 user" },
  { name: "Business", price: "£149", period: "/year", users: "Up to 5 users", popular: true },
  { name: "Pro", price: "£249", period: "/year", users: "Unlimited users" },
];

const FAQS = [
  { q: "Do my clients need an account to pay?", a: "No. They tap the link in your invoice and pay by card, PayPal or bank transfer — no sign-up." },
  { q: "How fast do payments reach me?", a: "Payments go straight to your own Stripe account. We never hold your money or take a cut of invoices." },
  { q: "Can I use my own branding?", a: "Yes — add your logo and accent colour on every plan, and remove “Powered by Invoyr” on Business and up." },
  { q: "Is there a free trial?", a: "Every plan includes a 7-day free trial, no credit card required." },
];

export default function LightHomePage() {
  return (
    <div className="marketing min-h-screen bg-white text-neutral-900">
      <ScrollReveal />
      <ScrollToTop className="bg-neutral-950 text-white hover:bg-neutral-800 focus-visible:ring-neutral-300 focus-visible:ring-offset-white" />
      {/* Preview strip */}
      <div className="bg-emerald-50 text-emerald-800 text-center text-xs py-2 px-4">
        Light-theme preview ·{" "}
        <Link href="/" className="underline underline-offset-2 hover:text-emerald-900">
          View the current (dark) site →
        </Link>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/75 backdrop-blur">
        <div className={`${CONTAINER} py-[25px] flex items-center justify-between`}>
          <Link href="/light" className="flex items-center" aria-label="Invoyr home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/main-logo-flat-black.svg" alt="Invoyr" className="h-12 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[1.15rem] text-neutral-600">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-neutral-950 transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hidden sm:inline text-[1.15rem] text-neutral-600 hover:text-neutral-950 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="text-[1.15rem] font-medium text-white bg-neutral-950 hover:bg-neutral-800 px-4 py-2.5 rounded-lg transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
      {/* HERO */}
      <section
        className="relative"
        style={{ backgroundImage: "radial-gradient(900px 460px at 50% -8%, rgba(16,185,129,0.10), transparent 70%)" }}
      >
        <div className="mx-auto flex min-h-[calc(100svh-140px)] max-w-4xl flex-col px-6 pt-16 pb-12 text-center">
          <div className="flex flex-1 flex-col justify-center pb-16 sm:pb-24">
            <p className={`${KICKER} mb-8`}>Invoicing for service businesses</p>
            <h1 className="font-serif text-[clamp(3rem,8vw,6.5rem)] leading-[0.9] tracking-tight text-neutral-950">
              Get paid faster.
              <br />
              <span className="text-neutral-400">Invoicing that runs itself.</span>
            </h1>
            <p className="mt-8 mx-auto max-w-xl text-xl text-neutral-600 leading-relaxed">
              Send invoices that look the part, take card payments with Stripe, and let reminders chase for you — so you get paid without the admin.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/signup" className="px-6 py-3.5 rounded-xl bg-neutral-950 text-white font-medium text-base hover:bg-neutral-800 transition-colors">
                Start free trial
              </Link>
              <Link href="/pricing" className="px-6 py-3.5 rounded-xl border border-neutral-300 text-neutral-800 text-base hover:bg-neutral-50 transition-colors">
                View pricing
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-base text-neutral-500">
              <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />No credit card needed</span>
              <span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />7-day free trial</span>
            </div>
          </div>
          <div className="pt-12">
            <p className={`${KICKER} text-center`}>Trusted by freelancers, agencies &amp; service businesses</p>
            <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
              <div className="flex w-max animate-marquee items-center gap-14">
                {[...TRUST_LOGOS, ...TRUST_LOGOS].map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="h-6 w-auto shrink-0 object-contain opacity-70 invert" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHOWCASE — reports + reminders */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className={`${CONTAINER} py-24`}>
          <p className={KICKER}>Reports &amp; reminders</p>
          <h2 className="mt-6 max-w-4xl font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-950">
            See where you stand — then never chase again.
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-neutral-600 leading-relaxed">
            Invoyr shows you exactly what&apos;s paid, outstanding and overdue, then chases the late ones for you — so nothing slips and you never send another awkward “just following up”.
          </p>

          <div className="mt-16 grid lg:grid-cols-2 gap-8">
            {/* Reports */}
            <div>
              <div className={`flex h-96 items-center overflow-hidden ${CARD} p-6 sm:p-10`}>
                <div className="w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xl text-neutral-950">Revenue</span>
                    <span className="font-mono text-[11px] text-neutral-500">Last 6 months</span>
                  </div>
                  <div className="mt-6 flex items-end gap-2.5">
                    {[52, 74, 62, 96, 82, 118].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}px`, backgroundColor: "rgba(16, 185, 129, 0.85)" }} />
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-3 border-t border-neutral-200 pt-5 text-center">
                    <div><p className="font-serif text-2xl text-neutral-950">£18.2k</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-neutral-500">Collected</p></div>
                    <div><p className="font-serif text-2xl text-neutral-950">£3.6k</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-neutral-500">Outstanding</p></div>
                    <div><p className="font-serif text-2xl text-red-500">£420</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-neutral-500">Overdue</p></div>
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <h3 className="font-serif text-2xl text-neutral-950">Reports &amp; insights</h3>
                <p className="mt-3 text-lg text-neutral-600 leading-relaxed">Revenue, outstanding and overdue at a glance — with ageing, top clients and CSV export whenever your accountant asks.</p>
              </div>
            </div>

            {/* Reminders */}
            <div>
              <div className={`flex h-96 items-center overflow-hidden ${CARD} p-6 sm:p-10`}>
                <div className="w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xl text-neutral-950">INV-0042 · Northwind</span>
                    <span className="rounded-full bg-red-50 px-2.5 py-1 font-mono text-[10px] text-red-600">7 DAYS OVERDUE</span>
                  </div>
                  <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-wide text-neutral-500">Auto-reminder · sent in your name</p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-700">Hi Sarah — a friendly reminder that invoice INV-0042 for £6,000 is now 7 days overdue. You can pay securely below. Thank you!</p>
                    <span className="mt-3 inline-block rounded-md bg-neutral-950 px-3 py-1.5 text-xs font-medium text-white">Pay now</span>
                  </div>
                  <div className="mt-5 flex items-center gap-2.5 border-t border-neutral-200 pt-5 font-mono text-[11px] text-neutral-500">
                    <span className="inline-flex items-center gap-1.5 text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />7 days</span>
                    <span>→</span><span>14 days</span><span>→</span><span>30 days</span>
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <h3 className="font-serif text-2xl text-neutral-950">Automated reminders</h3>
                <p className="mt-3 text-lg text-neutral-600 leading-relaxed">Polite nudges at 7, 14 and 30 days overdue go out automatically in your name. You stop chasing; clients still pay on time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS — bento */}
      <section className="border-t border-neutral-200">
        <div className={`${CONTAINER} py-24`}>
          <p className={`${KICKER} text-center`}>Everything you need</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-950">
            Why businesses get paid faster with Invoyr
          </h2>

          <div className="mt-16 grid gap-4 lg:grid-cols-3">
            {/* Payments — tall, phone */}
            <div className={`relative flex flex-col overflow-hidden ${CARD} p-8`}>
              <h3 className="font-serif text-2xl text-neutral-950">Payments everywhere</h3>
              <p className="mt-3 text-neutral-600 leading-relaxed">Card, PayPal or bank transfer — your client taps the link and pays from their phone, so you get paid on the go.</p>
              <div className="h-80" aria-hidden />
              <div aria-hidden="true" className="absolute inset-x-0 top-44 flex justify-center">
                <div className="w-72 rounded-t-3xl border-8 border-b-0 border-neutral-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between px-5 pb-1 pt-3 font-mono text-[10px] text-neutral-500">
                    <span>9:41</span><span>5G ▬▬▬</span>
                  </div>
                  <div className="px-5 pb-8 pt-2">
                    <div className="rounded-lg bg-neutral-50 px-4 py-3">
                      <p className="font-serif text-base text-neutral-950">TJN Agency</p>
                      <p className="font-mono text-[10px] text-neutral-500">#INV-0042</p>
                    </div>
                    <div className="mt-4 flex items-baseline justify-between">
                      <span className="text-xs text-neutral-500">Amount due</span>
                      <span className="font-serif text-2xl text-neutral-950">£6,000</span>
                    </div>
                    <div className="mt-4 rounded-lg bg-neutral-950 py-2.5 text-center text-xs font-medium text-white">Pay now</div>
                    <div className="mt-2 rounded-lg border border-neutral-200 py-2.5 text-center text-xs text-neutral-700">Pay with PayPal</div>
                    <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-neutral-500">Or pay by bank transfer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle column */}
            <div className="flex flex-col gap-4">
              <div className={`flex flex-1 flex-col ${CARD} p-8`}>
                <h3 className="font-serif text-2xl text-neutral-950">Estimates &amp; recurring</h3>
                <p className="mt-3 text-neutral-600 leading-relaxed">Send quotes that convert to invoices in a click, and put retainers on autopilot.</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-700">EST-0018</span>
                  <span className="text-neutral-400">→</span>
                  <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-neutral-700">INV-0043</span>
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-2.5 py-1 font-mono text-[11px] text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Monthly</span>
                </div>
              </div>
              <div className={`flex flex-1 flex-col ${CARD} p-8`}>
                <h3 className="font-serif text-2xl text-neutral-950">Multi-currency &amp; VAT</h3>
                <p className="mt-3 text-neutral-600 leading-relaxed">Invoice in any currency with the right VAT, and export clean for your accountant.</p>
                <div className="mt-6 flex items-center gap-2">
                  {["£", "$", "€"].map((c) => (
                    <span key={c} className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-neutral-50 font-serif text-lg text-neutral-700">{c}</span>
                  ))}
                  <span className="ml-auto rounded-full border border-neutral-200 px-3 py-1 font-mono text-[11px] text-emerald-600">VAT 20%</span>
                </div>
              </div>
            </div>

            {/* Professional invoices — tall, invoice */}
            <div className={`relative flex flex-col overflow-hidden ${CARD} p-8`}>
              <h3 className="font-serif text-2xl text-neutral-950">Professional invoices</h3>
              <p className="mt-3 text-neutral-600 leading-relaxed">Four templates, your logo and accent colour — sent as a polished PDF or a pay link.</p>
              <div className="h-80" aria-hidden />
              <div aria-hidden="true" className="absolute inset-x-8 top-44">
                <div className="rounded-t-xl border border-b-0 border-neutral-200 bg-white p-6 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-serif text-lg text-neutral-950">TJN Agency</p>
                      <p className="mt-0.5 font-mono text-[10px] text-neutral-500">Invoice · INV-0042</p>
                    </div>
                    <span className="h-8 w-8 rounded" style={{ backgroundColor: "rgba(16, 185, 129, 0.9)" }} />
                  </div>
                  <div className="mt-5 flex justify-between border-t border-neutral-200 pt-4 text-[11px]">
                    <div><p className="text-neutral-500">Billed to</p><p className="mt-0.5 text-neutral-800">Northwind Studio</p></div>
                    <div className="text-right"><p className="text-neutral-500">Due</p><p className="mt-0.5 text-neutral-800">07 Jul 2026</p></div>
                  </div>
                  <div className="mt-5 space-y-3 border-t border-neutral-200 pt-4 text-xs">
                    <div className="flex justify-between text-neutral-700"><span>Brand identity — phase 2</span><span>£4,200.00</span></div>
                    <div className="flex justify-between text-neutral-700"><span>Web design retainer</span><span>£1,800.00</span></div>
                    <div className="flex justify-between text-neutral-700"><span>Consultation — 6 hrs</span><span>£600.00</span></div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-4">
                    <span className="text-xs text-neutral-500">Total due</span>
                    <span className="font-serif text-2xl text-neutral-950">£6,600.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE SPLIT — dashboard showcase */}
      <section className="relative overflow-hidden border-t border-neutral-200 bg-neutral-50">
        <div className={`${CONTAINER} py-24`}>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-neutral-950">
                A calmer way to
                <br />
                run your money.
              </h2>
              <p className="mt-5 max-w-md text-lg text-neutral-600">Invoices, payments and reminders — all in one place, all working while you don&apos;t.</p>
              <div className="mt-12 space-y-8">
                {FEATURES.map((f) => (
                  <div key={f.title} className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-emerald-600">◆</span>
                      <h3 className="text-base text-neutral-900">{f.title}</h3>
                    </div>
                    <p className="text-neutral-500 sm:pt-2.5">{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block" aria-hidden />
          </div>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute left-[50%] top-1/2 hidden w-[58rem] -translate-y-1/2 lg:block xl:left-[54%]">
          <div className="relative flex overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-300/50">
            <div className="w-52 shrink-0 border-r border-neutral-200 p-4">
              <span className="px-1 font-serif text-lg text-neutral-950">Invoyr</span>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-200 p-2.5">
                <span className="grid h-7 w-7 place-items-center rounded bg-neutral-100 text-xs text-neutral-700">T</span>
                <div><p className="text-xs text-neutral-900">TJN Agency</p><p className="text-[10px] text-neutral-500">Pro Plan</p></div>
              </div>
              <div className="mt-3 rounded-lg bg-neutral-950 py-2 text-center text-xs font-medium text-white">+ New invoice</div>
              <nav className="mt-4 space-y-0.5 text-xs">
                {[["Overview", true], ["Invoices", false], ["Estimates", false], ["Clients", false], ["Payments", false], ["Reports", false], ["Settings", false]].map(([label, active]) => (
                  <div key={label as string} className={`rounded-md px-2.5 py-1.5 ${active ? "bg-neutral-100 text-neutral-900" : "text-neutral-500"}`}>{label}</div>
                ))}
              </nav>
            </div>
            <div className="min-w-[38rem] flex-1 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Dashboard</span>
                <span className="rounded-lg bg-neutral-950 px-3 py-1.5 text-xs font-medium text-white">+ New invoice</span>
              </div>
              <p className="mt-5 font-serif text-2xl text-neutral-950">Welcome back, Tony</p>
              <p className="text-xs text-neutral-500">Here&apos;s what&apos;s happening with TJN Agency.</p>
              <div className="mt-5 grid grid-cols-4 gap-3">
                {[
                  ["Revenue this month", "£4.2k", "£61.8k all time"],
                  ["Outstanding", "£3.6k", "4 awaiting"],
                  ["Overdue", "£420", "1 to chase"],
                  ["Total invoices", "42", "38 paid"],
                ].map(([label, value, sub]) => (
                  <div key={label} className="rounded-xl border border-neutral-200 p-3">
                    <p className="font-mono text-[9px] uppercase tracking-wide text-neutral-500">{label}</p>
                    <p className="mt-1.5 font-serif text-xl text-neutral-950">{value}</p>
                    <p className="mt-1 text-[10px] text-neutral-400">{sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3"><span className="text-xs text-neutral-700">Latest invoices</span><span className="text-[10px] text-neutral-500">View all →</span></div>
                {[
                  ["INV-0042", "Northwind Studio", "Sent", "#2563eb", "£6,000.00"],
                  ["INV-0039", "Bright & Co", "Overdue", "#dc2626", "£420.00"],
                  ["INV-0037", "Harbor Films", "Paid", "#059669", "£2,150.00"],
                ].map(([num, client, status, color, amount]) => (
                  <div key={num} className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 text-xs last:border-b-0">
                    <span className="w-24 text-neutral-900">{num}</span>
                    <span className="flex-1 text-neutral-500">{client}</span>
                    <span className="w-20 font-mono text-[10px]" style={{ color }}>{status}</span>
                    <span className="w-24 text-right text-neutral-800">{amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="border-t border-neutral-200">
        <div className={`${CONTAINER} py-24 text-center`}>
          <p className="mx-auto max-w-5xl font-serif text-3xl md:text-4xl leading-snug text-neutral-950">
            “Since switching to Invoyr, invoicing has become effortless. No unnecessary complexity, no wasted time, and no endless chasing for payments. We get invoices out faster, clients pay quicker, and cash flow has never been better.”
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/adam-testimonial.jpeg" alt="Adam Joy" className="h-11 w-11 rounded-full object-cover" />
            <div className="text-left">
              <p className="text-base text-neutral-900">Adam Joy</p>
              <p className="text-sm text-neutral-500">Nokha</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className={`${CONTAINER} py-24`}>
          <p className={`${KICKER} text-center`}>Pricing</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-950">
            One price a year. No per-invoice fees.
          </h2>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 flex flex-col ${plan.popular ? "border-emerald-300 bg-white shadow-[0_8px_30px_-8px_rgba(16,185,129,0.25)]" : "border-neutral-200 bg-white shadow-sm"}`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-2xl text-neutral-950">{plan.name}</h3>
                  {plan.popular && <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-600">Popular</span>}
                </div>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-serif text-4xl text-neutral-950">{plan.price}</span>
                  <span className="text-sm text-neutral-500">{plan.period}</span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">{plan.users}</p>
                <Link
                  href="/signup"
                  className={`mt-8 block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${plan.popular ? "bg-neutral-950 text-white hover:bg-neutral-800" : "border border-neutral-300 text-neutral-900 hover:bg-neutral-50"}`}
                >
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-neutral-200">
        <div className={`${CONTAINER} py-24 grid lg:grid-cols-3 gap-10`}>
          <div>
            <p className={KICKER}>FAQ</p>
            <h2 className="mt-6 font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight text-neutral-950">
              Questions, answered.
            </h2>
          </div>
          <div className="lg:col-span-2 divide-y divide-neutral-200 border-y border-neutral-200">
            {FAQS.map((item) => (
              <details key={item.q} className="py-5 group">
                <summary className="flex items-center justify-between cursor-pointer list-none text-lg text-neutral-900">
                  <span>{item.q}</span>
                  <span className="text-neutral-400 transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-base text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200 py-24 text-center">
        <h2 className="font-serif text-4xl md:text-5xl text-neutral-950">Get paid faster, starting today.</h2>
        <p className="mt-4 text-neutral-600">7-day free trial. No credit card required.</p>
        <div className="mt-9 flex items-center justify-center gap-5">
          <Link href="/signup" className="px-6 py-3.5 rounded-xl bg-neutral-950 text-white font-medium hover:bg-neutral-800 transition-colors">
            Start free trial
          </Link>
          <Link href="/pricing" className="text-base text-neutral-600 hover:text-neutral-950 transition-colors">
            View pricing →
          </Link>
        </div>
      </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className={`${CONTAINER} py-14 flex flex-col sm:flex-row items-center justify-between gap-6`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/main-logo-flat-black.svg" alt="Invoyr" className="h-10 w-auto" />
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-neutral-500">
            © {new Date().getFullYear()} Invoyr. Light preview.
          </p>
        </div>
      </footer>
    </div>
  );
}
