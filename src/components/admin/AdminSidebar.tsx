"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSignOut } from "@/hooks/useSignOut";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "./admin-nav";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { signOut, signingOut } = useSignOut();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/admin">
          <Image src="/main-logo.svg" alt="Invoyr" width={110} height={34} priority className="dark:hidden" />
          <Image src="/main-logo-dark.svg" alt="Invoyr" width={110} height={34} priority className="hidden dark:block" />
        </Link>
        <div className="mt-3">
          <span className="px-2 py-0.5 bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950 text-[10px] font-bold uppercase tracking-widest rounded-md">
            Admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-5 py-4 space-y-1.5 overflow-y-auto">
        {ADMIN_NAV.map(({ href, label, icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 border border-neutral-200 dark:border-neutral-700 shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a] dark:shadow-[0_0_0_2px_#171717,0_0_0_4px_#fafafa]"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50 hover:bg-white/60 dark:hover:bg-neutral-800/60"
              )}
            >
              <span className="flex-shrink-0">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors rounded-lg hover:bg-white/60 dark:hover:bg-neutral-800/60 w-full border border-transparent"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back to app
        </Link>
        <div className="px-2">
          <ThemeToggle />
        </div>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors rounded-lg hover:bg-white/60 dark:hover:bg-neutral-800/60 w-full text-left border border-transparent disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
