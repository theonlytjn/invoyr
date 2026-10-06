import Link from "next/link";
import type { Metadata } from "next";
import { HELP_GUIDES, HELP_SECTIONS } from "@/config/help-guides";

export const metadata: Metadata = {
  title: "Help & guides — Invoyr",
  description:
    "Step-by-step guides for invoicing with Invoyr: sending invoices, taking payments, chasing late payers and managing your account.",
};

export default function HelpIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
      <p className="font-mono text-[13px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        Help
      </p>
      <h1 className="mt-3 font-serif text-4xl text-neutral-900 dark:text-neutral-50 sm:text-5xl">
        Guides and walkthroughs
      </h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
        Short, practical guides to getting paid faster. No jargon, no 40-page manual.
      </p>

      <div className="mt-16 space-y-14">
        {HELP_SECTIONS.map((section) => {
          const guides = HELP_GUIDES.filter((g) => g.section === section);
          if (guides.length === 0) return null;

          return (
            <section key={section}>
              <h2 className="font-mono text-[13px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                {section}
              </h2>
              <ul className="mt-5 space-y-3">
                {guides.map((guide) => (
                  <li key={guide.slug}>
                    <Link
                      href={`/help/${guide.slug}`}
                      className="group block rounded-2xl border border-neutral-200 p-5 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-serif text-xl text-neutral-900 dark:text-neutral-50">
                          {guide.title}
                        </h3>
                        <span className="shrink-0 text-xs text-neutral-400">{guide.minutes} min</span>
                      </div>
                      <p className="mt-2 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                        {guide.summary}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="mt-16 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Can&apos;t find what you need? Email{" "}
          <a href="mailto:support@invoyr.io" className="underline underline-offset-2">
            support@invoyr.io
          </a>
          .
        </p>
      </div>
    </div>
  );
}
