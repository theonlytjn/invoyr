"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings", label: "Company" },
  { href: "/settings/invoices", label: "Invoices" },
  { href: "/settings/payments", label: "Payments" },
  { href: "/settings/billing", label: "Billing" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/account", label: "Account" },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 px-6">
      <nav className="flex gap-1 -mb-px">
        {TABS.map((tab) => {
          const active = tab.href === "/settings"
            ? pathname === "/settings"
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-3 text-base font-medium border-b-2 transition-colors",
                active
                  ? "text-neutral-950 dark:text-neutral-50 border-neutral-950 dark:border-neutral-50"
                  : "text-neutral-500 border-transparent hover:text-neutral-700 dark:hover:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
