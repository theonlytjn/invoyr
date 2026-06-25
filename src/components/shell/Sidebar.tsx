"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import type { Organisation } from "@/lib/supabase/types";

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
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-neutral-100 border-r border-neutral-200 h-screen sticky top-0 transition-[width] duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-[72px]" : "w-60",
      )}
    >
      {/* Brand */}
      <div className={cn("flex items-center gap-3 px-5 py-6", collapsed ? "justify-center" : "justify-between")}>
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-neutral-200"
            aria-label="Expand sidebar"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-neutral-500">
              <rect x="3" y="3" width="7" height="18" rx="1" /><path d="M14 3h7M14 12h7M14 21h7" strokeLinecap="round"/>
            </svg>
          </button>
        ) : (
          <>
            <Image src="/main-logo.svg" alt="Invoyr" width={110} height={34} priority />
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-neutral-200"
              aria-label="Collapse sidebar"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-neutral-500">
                <rect x="3" y="3" width="7" height="18" rx="1" /><path d="M14 3h7M14 12h7M14 21h7" strokeLinecap="round"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Org info */}
      {org && !collapsed && (
        <div className="px-4 pb-4">
          <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 flex items-center gap-3">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="object-contain flex-shrink-0 bg-white border border-neutral-200 rounded"
                style={{ width: 32, height: 32, padding: 1 }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-white">{org.name?.[0]?.toUpperCase()}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-950 truncate leading-5">{org.name}</p>
              <p className="text-xs text-neutral-500 capitalize leading-4">
                {plan ? `${plan} plan` : "Free plan"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New invoice */}
      {!collapsed && (
        <div className="px-4 pb-3">
          <Link
            href="/invoices/new"
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-neutral-950 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <PlusIcon size={14} />
            New invoice
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className={cn("flex-1 py-4 overflow-y-auto", collapsed ? "px-3" : "px-5")}>
        <ul className="space-y-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium border transition-all duration-200 ease-in-out",
                    collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                    active
                      ? "bg-white text-neutral-950 border-neutral-200 shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#0a0a0a]"
                      : "border-transparent text-neutral-500 hover:text-neutral-950",
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", !collapsed && "mr-3")} />
                  {!collapsed && label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className={cn("border-t border-neutral-200", collapsed ? "py-5 px-3" : "py-6 px-5")}>
        <div className="relative flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full bg-neutral-950 flex items-center justify-center shrink-0",
              collapsed && "mx-auto",
            )}
          >
            <span className="text-sm font-semibold text-white">
              {userEmail?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>

          {!collapsed && (
            <div className="flex-1 overflow-hidden space-y-0.5">
              <p className="text-sm font-medium text-neutral-950 truncate">{userEmail}</p>
              <p className="text-xs text-neutral-500 capitalize">{plan ? `${plan} plan` : "Free plan"}</p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="text-neutral-500 hover:text-neutral-950 transition-colors shrink-0"
              aria-label="Sign out"
            >
              <LogOutIcon size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
