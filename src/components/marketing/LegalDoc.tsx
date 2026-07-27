import type { ReactNode } from "react";

// Shared shell for legal/prose pages (privacy, terms). Keeps the two documents
// visually consistent and dual-theme aware without duplicating layout.
export default function LegalDoc({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
      <p className="font-mono text-[13px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
        Legal
      </p>
      <h1 className="mt-3 font-serif text-4xl text-neutral-900 dark:text-neutral-50 sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        Last updated: {lastUpdated}
      </p>
      <div
        className="mt-12 space-y-6 text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300
          [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-neutral-900 dark:[&_h2]:text-neutral-100
          [&_h3]:mt-8 [&_h3]:font-medium [&_h3]:text-lg [&_h3]:text-neutral-900 dark:[&_h3]:text-neutral-100
          [&_a]:text-emerald-600 dark:[&_a]:text-emerald-400 [&_a]:underline [&_a]:underline-offset-2
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-neutral-900 dark:[&_strong]:text-neutral-100"
      >
        {children}
      </div>
    </article>
  );
}
