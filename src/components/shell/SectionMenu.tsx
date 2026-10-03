"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SectionMenuItem {
  href: string;
  label: string;
}

interface Props {
  items: SectionMenuItem[];
  /** Matched exactly rather than by prefix — e.g. "/settings" itself. */
  exactHref?: string;
  /** Shown before the current section name, e.g. "Settings". */
  srLabel: string;
  id?: string;
}

/**
 * A single dropdown standing in for a row of tabs on narrow screens.
 *
 * Settings has eleven tabs, which on a phone becomes a long horizontal scroll
 * where most destinations are off-screen with nothing to suggest they exist.
 */
export default function SectionMenu({ items, exactHref, srLabel, id = "section-menu" }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActive = (href: string) =>
    href === exactHref ? pathname === href : pathname.startsWith(href);

  // Longest match wins, so /settings/invoices doesn't also light up /settings.
  const current =
    [...items].sort((a, b) => b.href.length - a.href.length).find((item) => isActive(item.href)) ??
    items[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-neutral-950 dark:text-neutral-50 sm:px-6"
      >
        <span className="flex items-center gap-2">
          <span className="sr-only">{srLabel}: </span>
          {current?.label}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-neutral-950/20"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <ul
            id={id}
            className="absolute left-2 right-2 z-50 mt-1 max-h-[65vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            {items.map((item) => {
              const active = isActive(item.href) && item.href === current?.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-neutral-100 text-neutral-950 dark:bg-neutral-800 dark:text-neutral-50"
                        : "text-neutral-600 dark:text-neutral-400"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
