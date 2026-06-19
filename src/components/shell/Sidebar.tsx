"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  InvoiceIcon,
  UsersIcon,
  CreditCardIcon,
  AnalyticsIcon,
  SettingsIcon,
  LogOutIcon,
  PlusIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Organisation } from "@/lib/supabase/types";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: DashboardIcon },
  { href: "/invoices", label: "Invoices", icon: InvoiceIcon },
  { href: "/clients", label: "Clients", icon: UsersIcon },
  { href: "/payments", label: "Payments", icon: CreditCardIcon },
  { href: "/reports", label: "Reports", icon: AnalyticsIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

interface Props {
  org: Organisation | null;
  userEmail: string;
  plan?: string | null;
}

export default function Sidebar({ org, userEmail, plan }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <Image src="/main-logo.svg" alt="Invoyr" width={135} height={40} priority />
        {org && (
          <div className="mt-4 flex items-center gap-3">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-9 h-9 rounded-md object-contain flex-shrink-0 border border-gray-100 bg-white p-0.5" />
            ) : (
              <div className="w-9 h-9 rounded-md bg-gray-900 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">{org.name?.[0]?.toUpperCase()}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{org.name}</p>
              <p className="text-xs text-gray-400 capitalize">
                {plan ? `${plan} plan` : "Free trial"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick action */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/invoices/new"
          className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          <PlusIcon size={14} />
          New invoice
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-600">
              {userEmail?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <p className="text-xs text-gray-600 truncate flex-1">{userEmail}</p>
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="Sign out"
          >
            <LogOutIcon size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
