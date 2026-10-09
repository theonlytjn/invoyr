import Link from "next/link";
import type { Metadata } from "next";
import { LEGAL_ENTITY } from "@/config/legal";
import HeroBackdrop from "@/components/marketing/HeroBackdrop";

export const metadata: Metadata = {
  title: "About — Invoyr",
  description: "Why we built Invoyr and what we believe about running a business.",
};

const KICKER = "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400";
const CONTAINER = "max-w-[1600px] mx-auto px-6 lg:px-12";
const CARD = "rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-emerald-50/70 dark:from-emerald-800/20 via-white dark:via-neutral-900 to-white dark:to-neutral-950";

const STATS = [
  { stat: "14 days", label: "Free trial on every plan" },
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
      <section className="relative isolate overflow-hidden">
        <HeroBackdrop images={["/hero/hero-about.jpg"]} />
        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-8 text-center">
        <p className={`${KICKER} mb-8`}>About Invoyr</p>
        <h1 className="font-serif text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] tracking-tight text-neutral-900 dark:text-neutral-50">
          We built the tool we wished we had
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-xl text-neutral-600 dark:text-neutral-200 leading-relaxed">
          A focused invoicing tool for freelancers and small agencies — send a professional invoice, take card payments, and get paid, all without the admin.
        </p>
        </div>
      </section>

      {/* STORY + product panel */}
      <section className="border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-20 grid items-center gap-12 lg:grid-cols-2`}>
          <div className="max-w-[65ch] space-y-5 text-lg text-neutral-600 dark:text-neutral-200 leading-relaxed">
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

          <div className={`${CARD} overflow-hidden p-8 sm:p-10`} aria-hidden="true">
            <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-6 shadow-2xl shadow-neutral-900/10 dark:shadow-black/50">
              <div className="flex items-start justify-between">
                <div><p className="font-serif text-lg text-neutral-900 dark:text-neutral-50">Northbridge Creative Ltd</p><p className="mt-0.5 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">Invoice · INV-0042</p></div>
                <span className="h-8 w-8 rounded" style={{ backgroundColor: "rgba(52, 211, 153, 0.9)" }} />
              </div>
              <div className="mt-5 flex justify-between border-t border-neutral-200 dark:border-neutral-900 pt-4 text-[11px]">
                <div><p className="text-neutral-500 dark:text-neutral-400">Billed to</p><p className="mt-0.5 text-neutral-600 dark:text-neutral-200">Atlas Digital Studio Ltd</p></div>
                <div className="text-right"><p className="text-neutral-500 dark:text-neutral-400">Due</p><p className="mt-0.5 text-neutral-600 dark:text-neutral-200">07 Jul 2026</p></div>
              </div>
              <div className="mt-5 space-y-3 border-t border-neutral-200 dark:border-neutral-900 pt-4 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-200"><span>Brand identity — phase 2</span><span className="text-neutral-600 dark:text-neutral-200">£4,200.00</span></div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-200"><span>Web design retainer</span><span className="text-neutral-600 dark:text-neutral-200">£1,800.00</span></div>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 dark:border-neutral-900 pt-4">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">Total due</span>
                <span className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">£6,000.00</span>
              </div>
              <div className="mt-4 rounded-lg bg-neutral-950 dark:bg-neutral-50 py-2.5 text-center text-xs font-medium text-white dark:text-neutral-950">Pay now</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER'S NOTE — first person, because a one-person company selling to
          one-person companies is the actual differentiator against Xero. */}
      <section className="border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-16 lg:items-start">
            <div>
              {/* Replace with a real photo: public/founder.jpg, 640×800 or
                  thereabouts. Until then this holds the space rather than
                  showing a broken image. */}
              <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900" />
              <p className="mt-4 font-medium text-neutral-900 dark:text-neutral-50">Tony Nwachi</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Founder, Invoyr
              </p>
            </div>

            <div className="space-y-5 text-lg leading-relaxed text-neutral-600 dark:text-neutral-200">
              <p className={KICKER}>From the founder</p>
              <h2 className="font-serif text-4xl leading-tight text-neutral-900 dark:text-neutral-50">
                I built this because I was tired of chasing my own invoices.
              </h2>
              <p>
                I run a design and development studio. For years the worst part of the job
                wasn&apos;t the work — it was everything around it. Building an invoice in a Word
                template. Exporting a PDF. Attaching it to an email and hoping it looked right.
                Then waiting, wondering whether the client had even opened it, and writing the
                awkward follow-up that starts &ldquo;just circling back on the below&rdquo;.
              </p>
              <p>
                I tried the big accounting packages. They&apos;re built for businesses with a
                finance team, and they price like it. I didn&apos;t need a general ledger or a
                chart of accounts. I needed to send a professional invoice, take a card payment,
                and have something chase politely on my behalf so I didn&apos;t have to.
              </p>
              <p>
                So I built it. Invoyr does the invoicing part properly and leaves the rest alone.
                Your payments land straight in your own Stripe account — we never hold your money
                or take a cut. Reminders go out in your name, on your schedule. And you can see
                the moment a client opens an invoice, which turns an awkward chase into a simple
                one.
              </p>
              <p>
                I use it every week to invoice my own clients, as does my partner for her bakery.
                If something is slow or confusing, it annoys me before it annoys you — and it gets
                fixed.
              </p>

              {/* Signature: drop a transparent PNG at public/founder-signature.png
                  (around 360×120) and swap this for an <Image>. */}
              <p className="pt-2 text-neutral-900 dark:text-neutral-50">
                <span className="font-serif text-2xl">Tony Nwachi</span>
                <br />
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  Founder, Invoyr — {LEGAL_ENTITY.name}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BELIEFS — bento */}
      <section className="border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <p className={`${KICKER} text-center`}>What we believe</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-900 dark:text-neutral-50">
            Principles, not features.
          </h2>
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {BELIEFS.map((b) => (
              <div key={b.heading} className={`${CARD} p-8`}>
                <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">{b.heading}</h3>
                <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-200 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS — bento */}
      <section className="border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <div className="grid gap-4 sm:grid-cols-3">
            {STATS.map((item) => (
              <div key={item.label} className={`${CARD} p-8 text-center`}>
                <p className="font-serif text-5xl text-neutral-900 dark:text-neutral-50">{item.stat}</p>
                <p className="mt-3 text-neutral-500 dark:text-neutral-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200 dark:border-neutral-900 py-24 text-center">
        <h2 className="font-serif text-4xl md:text-5xl text-neutral-900 dark:text-neutral-50">Built for the person doing the work.</h2>
        <p className="mt-4 text-neutral-600 dark:text-neutral-200">14-day free trial. Cancel any time before it ends.</p>
        <div className="mt-9 flex items-center justify-center gap-5">
          <Link href="/signup" className="px-6 py-3.5 rounded-xl bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 font-medium hover:bg-neutral-800 dark:hover:bg-white transition-colors">
            Start free trial
          </Link>
          <Link href="/contact" className="text-base text-neutral-600 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            Get in touch →
          </Link>
        </div>
      </section>
    </div>
  );
}
