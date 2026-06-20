"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings", label: "Company" },
  { href: "/settings/invoices", label: "Invoices" },
  { href: "/settings/payments", label: "Payments" },
  { href: "/settings/billing", label: "Billing" },
  { href: "/settings/account", label: "Account" },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 px-6">
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
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                active
                  ? "text-gray-900 border-gray-900"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
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
