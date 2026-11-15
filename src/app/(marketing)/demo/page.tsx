import type { Metadata } from "next";
import ContactForm from "../contact/ContactForm";
import { DEMO_COPY } from "@/config/demo";

export const metadata: Metadata = {
  title: "Book a demo",
  description: "A 20-minute walkthrough of Invoyr: branding, clients, invoices, sending and getting paid.",
};

const KICKER = "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400";

export default function DemoPage() {
  const bookingUrl = DEMO_COPY.bookingUrl;
  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 pb-24">
      <p className={`${KICKER} mb-8`}>{DEMO_COPY.kicker}</p>
      <h1 className="font-serif text-[clamp(2.4rem,5.5vw,4rem)] leading-[0.98] tracking-tight text-neutral-900 dark:text-neutral-50">
        {DEMO_COPY.title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-neutral-600 dark:text-neutral-200">{DEMO_COPY.intro}</p>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-12 lg:gap-16">
        <section data-reveal aria-labelledby="demo-agenda" className="border-t border-neutral-200 dark:border-neutral-900 pt-6">
          <h2 id="demo-agenda" className={KICKER}>{DEMO_COPY.agendaHeading}</h2>
          <ol className="mt-4 space-y-4">
            {DEMO_COPY.agenda.map((item, i) => (
              <li key={item} className="flex gap-4 text-base text-neutral-700 dark:text-neutral-200">
                <span className="font-mono text-sm text-brand pt-0.5" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section data-reveal aria-labelledby="demo-form" className="border-t border-neutral-200 dark:border-neutral-900 pt-6">
          <h2 id="demo-form" className="font-serif text-2xl text-neutral-900 dark:text-neutral-50 mb-6">
            {DEMO_COPY.formHeading}
          </h2>
          {bookingUrl && (
            <div className="mb-8">
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-5 py-3 rounded-lg bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-base font-medium hover:bg-neutral-800 dark:hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
              >
                {DEMO_COPY.bookingCta}
              </a>
              <p className="mt-4 text-base text-neutral-500 dark:text-neutral-400">{DEMO_COPY.bookingAlt}</p>
            </div>
          )}
          <ContactForm kind="demo" />
        </section>
      </div>
    </div>
  );
}
