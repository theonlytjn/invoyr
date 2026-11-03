import Link from "next/link";
import type { Metadata } from "next";
import { EARLY_ACCESS } from "@/config/early-access";
import { BRAND } from "@/config/brand";
import { isMonthlyBillingAvailable } from "@/config/plans";
import PricingCards from "@/components/pricing/PricingCards";

// Shared by link with the people being invited, so it stays out of search.
export const metadata: Metadata = {
  title: "Early access",
  description: `Join Invoyr early: ${EARLY_ACCESS.trialDays} days free on any plan.`,
  robots: { index: false, follow: false },
};

const KICKER = "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400";
const CONTAINER = "max-w-[1600px] mx-auto px-6 lg:px-12";
const MONTHS = Math.round(EARLY_ACCESS.trialDays / 30);

const PERKS = [
  {
    heading: `${MONTHS} months free`,
    body: `A ${EARLY_ACCESS.trialDays}-day trial on any plan, instead of the usual 14 days. Send real invoices and take real payments the whole time.`,
  },
  {
    heading: "A direct line to me",
    body: `Email ${BRAND.supportEmail} and it comes straight to me. If something's broken or confusing, I'll fix it.`,
  },
  {
    heading: "Shape what comes next",
    body: "Early users decide what gets built. Tell me what you need and it goes to the top of the list.",
  },
];

const STEPS = [
  { n: "1", heading: "Create your account", body: `Your code, ${EARLY_ACCESS.code}, is added for you when you use the button on this page.` },
  { n: "2", heading: "Pick a plan and add a card", body: `Nothing is charged for ${EARLY_ACCESS.trialDays} days. Monthly or yearly, any plan.` },
  { n: "3", heading: "Get paid", body: "Send your first invoice in a couple of minutes. We'll email you before the trial ends, and you can cancel any time before then." },
];

export default function EarlyAccessPage() {
  const signupHref = `/signup?code=${EARLY_ACCESS.code}`;

  return (
    <div>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(55% 60% at 50% 0%, color-mix(in oklab, var(--brand) 16%, transparent), transparent 70%)",
          }}
        />
        <div className="mx-auto w-full max-w-4xl px-6 pt-32 pb-24 text-center">
          <p className="mb-8 inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-foreground">
            Early access · {EARLY_ACCESS.spots} places
          </p>
          <h1 className="font-serif text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] tracking-tight text-neutral-900 dark:text-neutral-50">
            Be one of the first
            <br />
            to get paid with Invoyr.
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-xl leading-relaxed text-neutral-600 dark:text-neutral-200">
            Invoyr launches on 1 December. Join before then and you get {MONTHS} months free on any
            plan, plus a say in what we build next.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href={signupHref}
              className="px-6 py-3.5 rounded-xl bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 font-medium text-base hover:bg-neutral-800 dark:hover:bg-white transition-colors"
            >
              Claim {MONTHS} months free
            </Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Or enter code{" "}
              <span className="font-mono font-semibold tracking-wider text-neutral-900 dark:text-neutral-50">{EARLY_ACCESS.code}</span>{" "}
              when you choose your plan.
            </p>
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-20 grid gap-12 lg:grid-cols-2 lg:gap-16`}>
          <div>
            <p className={KICKER}>A note from the founder</p>
            <h2 className="mt-6 font-serif text-4xl leading-tight text-neutral-900 dark:text-neutral-50">
              Thanks for being early.
            </h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-neutral-600 dark:text-neutral-200">
            <p>
              I&apos;m Tony. I built Invoyr because I was tired of chasing my own invoices: Word
              templates, PDFs attached to emails, and awkward follow-ups weeks later.
            </p>
            <p>
              Invoyr does one job properly. You send a professional invoice, your client pays by
              card, PayPal or bank transfer, and the money lands straight in your own account.
              Reminders go out on your behalf, and you can see the moment an invoice is opened.
            </p>
            <p>
              You&apos;re getting in before the public launch, so you&apos;ll find the odd rough
              edge. When you do, tell me. Early users are the reason it gets better.
            </p>
            <p className="pt-2 text-neutral-900 dark:text-neutral-50">
              <span className="font-serif text-2xl">Tony Nwachi</span>
              <br />
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Founder, Invoyr</span>
            </p>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <p className={`${KICKER} text-center`}>What you get</p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {PERKS.map((perk) => (
              <div key={perk.heading} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8">
                <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">{perk.heading}</h3>
                <p className="mt-3 text-lg leading-relaxed text-neutral-600 dark:text-neutral-200">{perk.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <p className={`${KICKER} text-center`}>How it works</p>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n}>
                <span className="font-mono text-sm text-brand-ink">{step.n}</span>
                <h3 className="mt-3 font-serif text-2xl text-neutral-900 dark:text-neutral-50">{step.heading}</h3>
                <p className="mt-2 text-lg leading-relaxed text-neutral-600 dark:text-neutral-200">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PLANS: every card carries the code to signup */}
      <section className="border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <h2 className="text-center font-serif text-4xl md:text-5xl leading-[1.05] text-neutral-900 dark:text-neutral-50">
            Pick any plan. The first {MONTHS} months are on us.
          </h2>
          <p className="mt-4 mb-12 text-center text-lg text-neutral-600 dark:text-neutral-200">
            After the trial you pay the normal price, unless you cancel before it ends.
          </p>
          <PricingCards
            monthlyAvailable={isMonthlyBillingAvailable()}
            showHighlights
            signupParams={{ code: EARLY_ACCESS.code }}
            footnote={`Prices include VAT. Cancel anytime. ${EARLY_ACCESS.trialDays}-day free trial with code ${EARLY_ACCESS.code}.`}
          />
        </div>
      </section>
    </div>
  );
}
