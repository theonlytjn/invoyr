"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSignOut } from "@/hooks/useSignOut";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "./admin-nav";

/**
 * Admin navigation for phones and tablets.
 *
 * The desktop sidebar is `hidden lg:flex`, so below 1024px the admin area had
 * no navigation at all — and no sign-out or way back to the app either. A
 * bottom bar like the main app's would not fit six destinations plus those
 * actions, so this is a top bar with a slide-down menu.
 */
export default function AdminMobileNav() {
  const pathname = usePathname();
  const { signOut, signingOut } = useSignOut();
  const [open, setOpen] = useState(false);

  // Close on navigation, so tapping a destination doesn't leave the menu over it.
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

  const current = ADMIN_NAV.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
  );

  return (
    <div className="lg:hidden">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] dark:border-neutral-800 dark:bg-neutral-950">
        <Link href="/admin" className="flex items-center gap-2 min-w-0">
          <Image src="/main-logo.svg" alt="Invoyr" width={88} height={27} priority className="dark:hidden" />
          <Image src="/main-logo-dark.svg" alt="Invoyr" width={88} height={27} priority className="hidden dark:block" />
          <span className="rounded-md bg-neutral-950 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white dark:bg-neutral-50 dark:text-neutral-950">
            Admin
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-mobile-menu"
          className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-950 dark:border-neutral-800 dark:text-neutral-50"
        >
          <span className="max-w-[9rem] truncate">{current?.label ?? "Menu"}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("transition-transform", open && "rotate-180")}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="sr-only">{open ? "Close admin menu" : "Open admin menu"}</span>
        </button>
      </header>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-neutral-950/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="admin-mobile-menu"
            className="fixed left-0 right-0 top-[calc(57px+env(safe-area-inset-top))] z-50 max-h-[calc(100dvh-57px-env(safe-area-inset-top))] overflow-y-auto border-b border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-800 dark:bg-neutral-950"
          >
            <ul className="space-y-1">
              {ADMIN_NAV.map(({ href, label, icon }) => {
                const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50"
                          : "text-neutral-600 dark:text-neutral-400"
                      )}
                    >
                      <span className="flex-shrink-0">{icon}</span>
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 space-y-1 border-t border-neutral-200 pt-3 dark:border-neutral-800">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-neutral-600 dark:text-neutral-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Back to app
              </Link>

              <div className="px-3 py-2">
                <ThemeToggle />
              </div>

              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-neutral-600 disabled:opacity-50 dark:text-neutral-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
