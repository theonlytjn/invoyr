"use client";

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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-[#f5f5f5] border-r border-[#e5e5e5] h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <Image src="/main-logo.svg" alt="Invoyr" width={120} height={36} priority />
      </div>

      {/* Org info */}
      {org && (
        <div className="px-4 pb-4">
          <div className="bg-white border border-[#e5e5e5] rounded-xl px-3 py-2.5 flex items-center gap-3">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="object-contain flex-shrink-0 bg-white border border-[#e5e5e5]"
                style={{ width: 32, height: 32, padding: 1 }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#0a0a0a] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-white">{org.name?.[0]?.toUpperCase()}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#0a0a0a] truncate leading-5">{org.name}</p>
              <p className="text-xs text-[#737373] capitalize leading-4">
                {plan ? `${plan} plan` : "Free plan"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New invoice */}
      <div className="px-4 pb-3">
        <Link
          href="/invoices/new"
          className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-[#0a0a0a] text-white text-sm font-medium rounded-lg hover:bg-[#171717] transition-colors"
        >
          <PlusIcon size={14} />
          New invoice
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                active
                  ? "bg-white border border-[#e5e5e5] text-[#0a0a0a] font-medium shadow-[0px_0px_0px_2px_#f5f5f5,0px_0px_0px_4px_#1c1917]"
                  : "text-[#737373] hover:text-[#0a0a0a] hover:bg-white/60"
              )}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-[#e5e5e5]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/60 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#0a0a0a] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">
              {userEmail?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#0a0a0a] truncate leading-4">{userEmail}</p>
            <p className="text-[11px] text-[#737373] leading-4 capitalize">{plan ? `${plan} plan` : "Free plan"}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-[#737373] hover:text-[#0a0a0a] transition-colors flex-shrink-0"
            aria-label="Sign out"
          >
            <LogOutIcon size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
