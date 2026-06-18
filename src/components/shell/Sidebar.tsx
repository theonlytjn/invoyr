"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  BarChart2,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Organisation } from "@/lib/supabase/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface Props {
  org: Organisation | null;
  userEmail: string;
}

export default function Sidebar({ org, userEmail }: Props) {
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
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[10px] font-bold">IV</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {org?.name ?? "invoyr"}
          </p>
          <p className="text-xs text-gray-400 truncate">Starter plan</p>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/invoices/new"
          className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
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
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
