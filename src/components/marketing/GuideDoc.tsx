import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shell for a help guide. Shares the prose treatment with LegalDoc but adds the
 * things a guide needs and a legal page doesn't: a way back to the index, a
 * reading time, and a lead paragraph.
 */
export default function GuideDoc({
  title,
  summary,
  minutes,
  children,
}: {
  title: string;
  summary: string;
  minutes: number;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
      <Link
        href="/help"
        className="font-mono text-[13px] uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        ← Help
      </Link>
      <h1 className="mt-4 font-serif text-4xl text-neutral-900 dark:text-neutral-50 sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">{summary}</p>
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{minutes} min read</p>

      <div
        className="mt-12 space-y-6 text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300
          [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-neutral-900 dark:[&_h2]:text-neutral-100
          [&_h3]:mt-8 [&_h3]:font-medium [&_h3]:text-lg [&_h3]:text-neutral-900 dark:[&_h3]:text-neutral-100
          [&_a]:text-emerald-600 dark:[&_a]:text-emerald-400 [&_a]:underline [&_a]:underline-offset-2
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2
          [&_strong]:text-neutral-900 dark:[&_strong]:text-neutral-100"
      >
        {children}
      </div>

      <div className="mt-16 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Still stuck? Email{" "}
          <a href="mailto:support@invoyr.io" className="underline underline-offset-2">
            support@invoyr.io
          </a>{" "}
          and a human will help.
        </p>
      </div>
    </article>
  );
}
