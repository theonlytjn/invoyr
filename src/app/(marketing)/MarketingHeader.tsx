"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "@/components/marketing/ThemeToggle";

// About lives in the footer only — not in the top nav.
const NAV = [
  { href: "/features", label: "Features" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
];

export default function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 dark:border-neutral-900/80 bg-white dark:bg-neutral-950/70 backdrop-blur">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-[25px] flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Invoyr home" onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/main-logo-flat-black.svg" alt="Invoyr" className="h-12 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/main-logo-flat-white.svg" alt="Invoyr" className="h-12 w-auto hidden dark:block" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-[1.15rem] text-neutral-600 dark:text-neutral-200">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-1 py-2 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle className="-mr-1" />
          <Link
            href="/login"
            className="rounded px-1 py-2 text-[1.15rem] text-neutral-600 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-[1.15rem] font-medium text-white dark:text-neutral-950 bg-neutral-950 dark:bg-neutral-50 hover:bg-neutral-800 dark:hover:bg-white px-4 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
          >
            Get started
          </Link>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-1 md:hidden -mr-1">
          <ThemeToggle />
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 px-6 py-6">
          <nav className="flex flex-col text-lg">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={close} className="rounded py-3 text-neutral-600 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-3 border-t border-neutral-200 dark:border-neutral-900 pt-5">
            <Link href="/login" onClick={close} className="rounded py-2.5 text-base text-neutral-600 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950">
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={close}
              className="rounded-lg bg-neutral-950 dark:bg-neutral-50 py-3 text-center text-base font-medium text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
