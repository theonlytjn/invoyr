"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  InvoiceIcon,
  UsersIcon,
  CreditCardIcon,
  SettingsIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: DashboardIcon },
  { href: "/invoices", label: "Invoices", icon: InvoiceIcon },
  { href: "/clients", label: "Clients", icon: UsersIcon },
  { href: "/payments", label: "Payments", icon: CreditCardIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-stretch">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors",
              active
                ? "text-neutral-950 dark:text-neutral-50"
                : "text-neutral-400 dark:text-neutral-500"
            )}
          >
            <Icon size={20} className={cn(active ? "text-neutral-950 dark:text-neutral-50" : "text-neutral-400 dark:text-neutral-500")} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
