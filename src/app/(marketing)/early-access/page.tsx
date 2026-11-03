import Link from "next/link";
import type { Metadata } from "next";
import { EARLY_ACCESS, OFFER_OPENS_DAYS_BEFORE_TRIAL_END } from "@/config/early-access";
import { BRAND } from "@/config/brand";
import { PLAN_MAP, formatPounds, isMonthlyBillingAvailable } from "@/config/plans";
import { discountedYearly } from "@/lib/early-offer-window";
import PricingCards from "@/components/pricing/PricingCards";
import BenefitsBento from "@/components/marketing/BenefitsBento";
import AutomationBento from "@/components/marketing/AutomationBento";

// Shared by link with the businesses being invited, so it stays out of search.
export const metadata: Metadata = {
  title: "Early Adopter programme",
  description: `Join Invoyr's Early Adopter programme: ${EARLY_ACCESS.trialDays} days free, then ${EARLY_ACCESS.yearlyOfferPercent}% off your first year.`,
  robots: { index: false, follow: false },
};

const KICKER = "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400";
const CONTAINER = "max-w-[1600px] mx-auto px-6 lg:px-12";
const PERCENT = EARLY_ACCESS.yearlyOfferPercent;
const DAYS = EARLY_ACCESS.trialDays;

const business = PLAN_MAP.business;
const EXAMPLE = `${formatPounds(discountedYearly(business.amounts.yearly, PERCENT))} instead of ${formatPounds(business.amounts.yearly)} on ${business.name}`;

const OFFER = [
  {
    heading: `${DAYS} days free`,
    body: `Full access to every feature on the plan you choose. Nothing is charged for ${DAYS} days, and you can cancel any time before then.`,
  },
  {
    heading: `${PERCENT}% off your first year`,
    body: `In the last week of your trial you'll be offered ${PERCENT}% off a year on the yearly plan (${EXAMPLE}). Take it or leave it.`,
  },
  {
    heading: "A direct line to me",
    body: `Email ${BRAND.supportEmail} and it comes straight to me. Your feedback decides what gets improved and built next.`,
  },
];

const STEPS = [
  { n: "1", heading: "Create your account", body: `Use the button on this page and your early adopter code, ${EARLY_ACCESS.code}, is added for you.` },
  { n: "2", heading: "Pick a plan and add a card", body: `Monthly or yearly, any plan. Nothing is charged for ${DAYS} days.` },
  {
    n: "3",
    heading: "Use it properly",
    body: `Put real invoices through it. ${OFFER_OPENS_DAYS_BEFORE_TRIAL_END} days before the trial ends, your ${PERCENT}% yearly offer appears in Billing.`,
  },
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
        <div className="mx-auto w-full max-w-4xl px-6 pt-32 pb-20 text-center">
          <p className="mb-8 inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-foreground">
            Early Adopter programme · {EARLY_ACCESS.spots} places
          </p>
          <h1 className="font-serif text-[clamp(2.6rem,6vw,5rem)] leading-[0.95] tracking-tight text-neutral-900 dark:text-neutral-50">
            Less financial admin.
            <br />
            More visibility.
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-xl leading-relaxed text-neutral-600 dark:text-neutral-200">
            I&apos;m looking for a small group of businesses to use Invoyr day to day and help shape
            it. {DAYS} days free, then {PERCENT}% off your first year if you&apos;d like to stay.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href={signupHref}
              className="px-6 py-3.5 rounded-xl bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 font-medium text-base hover:bg-neutral-800 dark:hover:bg-white transition-colors"
            >
              Join the Early Adopter programme
            </Link>
            <a href="#letter" className="text-sm text-neutral-500 dark:text-neutral-400 underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100">
              Read my note first
            </a>
          </div>
        </div>
      </section>

      {/* THE LETTER */}
      <section id="letter" className="scroll-mt-24 border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <article className="mx-auto max-w-3xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 sm:p-12">
            <p className={KICKER}>A note from the founder</p>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-neutral-600 dark:text-neutral-200">
              <p className="text-neutral-900 dark:text-neutral-50">Hi,</p>
              <p>
                I wanted to reach out because I&apos;ve been working on something for a while now
                called <strong className="text-neutral-900 dark:text-neutral-50">Invoyr</strong>: an
                invoicing platform I&apos;ve built to make the financial admin side of running a
                business much simpler.
              </p>
              <p>
                From my own experience working with different businesses, I&apos;ve seen how something
                as straightforward as getting paid can quickly become another layer of admin.
              </p>
              <p>
                Creating invoices manually, keeping track of what&apos;s outstanding, chasing late
                payments, managing recurring work and trying to understand what&apos;s actually coming
                into the business all take time, often far more time than they should.
              </p>
              <p className="text-neutral-900 dark:text-neutral-50 font-medium">
                That&apos;s what I&apos;ve built Invoyr to simplify.
              </p>
              <p>
                Rather than manually creating invoices or relying on several different tools, Invoyr
                gives you one place to create and send professional branded invoices and estimates,
                accept payments, manage recurring invoices, track expenses and see exactly what&apos;s
                been paid, what&apos;s outstanding and what needs your attention.
              </p>
              <p>
                It can also take care of some of the repetitive work for you, including automatically
                reminding customers about overdue invoices, so you don&apos;t have to spend your time
                constantly chasing payments.
              </p>
              <p>
                Ultimately, the idea is simple:{" "}
                <strong className="text-neutral-900 dark:text-neutral-50">
                  less time spent on financial admin and more visibility over your business.
                </strong>
              </p>
              <p>
                I&apos;m now at the stage where I&apos;m looking for a small group of businesses to use
                Invoyr properly day to day, and I&apos;d really like you to be one of them.
              </p>
              <p>
                I&apos;d like to give you{" "}
                <strong className="text-neutral-900 dark:text-neutral-50">
                  full access to Invoyr free for {DAYS} days
                </strong>
                . Nothing is charged during that time and you can cancel before it ends. I want you
                to put real invoices through it and see whether it genuinely makes managing this side
                of your business easier.
              </p>
              <p>
                If it has, then towards the end of your trial I&apos;ll offer you{" "}
                <strong className="text-neutral-900 dark:text-neutral-50">
                  {PERCENT}% off your first year
                </strong>{" "}
                as a thank you for being early.
              </p>
              <p>All I&apos;d ask in return is some honest feedback every month or so.</p>
              <p>
                Tell me what works, what could be easier, what you think is missing and, most
                importantly, what would make Invoyr more useful to you and your business.
              </p>
              <p>
                Your feedback will help shape what I improve and build next, while hopefully giving
                you a platform that saves you time, reduces the amount of manual admin you&apos;re
                doing and makes getting paid that little bit easier.
              </p>
              <p>
                And if Invoyr becomes something you genuinely want to keep using, then I&apos;ll know
                I&apos;ve built something worthwhile.
              </p>
              <p>If you&apos;d like to be involved, I&apos;d love to have you as one of our Early Adopters.</p>
            </div>

            <div className="mt-10">
              {/* The signature is drawn in black; it is inverted to white on the dark site. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/tn-signature.svg" alt="Tony's signature" className="h-20 w-auto dark:invert" />
              <p className="mt-2 font-medium text-neutral-900 dark:text-neutral-50">Tony</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Founder, Invoyr</p>
            </div>

            <Link
              href={signupHref}
              className="mt-10 inline-flex items-center gap-2 rounded-xl bg-neutral-950 dark:bg-neutral-50 px-6 py-3.5 font-medium text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white transition-colors"
            >
              Take a look at Invoyr &amp; join the Early Adopter programme →
            </Link>
          </article>
        </div>
      </section>

      {/* THE OFFER */}
      <section className="border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <p className={`${KICKER} text-center`}>What early adopters get</p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {OFFER.map((item) => (
              <div key={item.heading} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8">
                <h3 className="font-serif text-2xl text-neutral-900 dark:text-neutral-50">{item.heading}</h3>
                <p className="mt-3 text-lg leading-relaxed text-neutral-600 dark:text-neutral-200">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU'LL BE USING */}
      <section className="border-t border-neutral-200 dark:border-neutral-900">
        <div className={`${CONTAINER} py-20`}>
          <p className={`${KICKER} text-center`}>What you&apos;ll be using</p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-neutral-900 dark:text-neutral-50">
            One place for getting paid.
          </h2>
          <BenefitsBento className="mt-16" />
          <AutomationBento className="mt-4" />
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
            Pick a plan. The first {DAYS} days are on me.
          </h2>
          <p className="mt-4 mb-12 text-center text-lg text-neutral-600 dark:text-neutral-200">
            After the trial you pay the price below, or {PERCENT}% less for your first year if you
            take the yearly offer. Cancel before the trial ends and you pay nothing.
          </p>
          <PricingCards
            monthlyAvailable={isMonthlyBillingAvailable()}
            showHighlights
            signupParams={{ code: EARLY_ACCESS.code }}
            footnote={`Prices include VAT. Cancel anytime. ${DAYS}-day free trial with code ${EARLY_ACCESS.code}; ${PERCENT}% off the first yearly payment when claimed before the offer closes.`}
          />
        </div>
      </section>
    </div>
  );
}
