"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDownIcon, PlusIcon, CheckIcon } from "@/components/icons";
import type { Organisation } from "@/lib/supabase/types";

interface Props {
  activeOrg: Organisation | null;
  orgs: Organisation[];
  plan?: string | null;
}

export default function OrgSwitcher({ activeOrg, orgs, plan }: Props) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function switchOrg(orgId: string) {
    if (orgId === activeOrg?.id) { setOpen(false); return; }
    setSwitching(orgId);
    try {
      await fetch("/api/org/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      router.refresh();
      setOpen(false);
    } finally {
      setSwitching(null);
    }
  }

  if (!activeOrg) return null;

  return (
    <div ref={ref} className="relative px-4 pb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2.5 flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {activeOrg.logo_url ? (
          <img
            src={activeOrg.logo_url}
            alt={activeOrg.name}
            className="object-contain flex-shrink-0 bg-white border border-neutral-200 rounded"
            style={{ width: 32, height: 32, padding: 1 }}
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">{activeOrg.name?.[0]?.toUpperCase()}</span>
          </div>
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50 truncate leading-5">{activeOrg.name}</p>
          <p className="text-xs text-neutral-500 capitalize leading-4">
            {plan ? `${plan} plan` : "Free plan"}
          </p>
        </div>
        {orgs.length > 1 && (
          <ChevronDownIcon
            size={14}
            className={`text-neutral-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-4 right-4 top-full mt-1 z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden"
        >
          {orgs.map((org) => {
            const isActive = org.id === activeOrg.id;
            const isLoading = switching === org.id;
            return (
              <button
                key={org.id}
                role="option"
                aria-selected={isActive}
                onClick={() => switchOrg(org.id)}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-left"
              >
                {org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={org.name}
                    className="object-contain flex-shrink-0 bg-white border border-neutral-200 rounded"
                    style={{ width: 28, height: 28, padding: 1 }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-neutral-950 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-semibold text-white">{org.name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <span className={`flex-1 text-sm truncate ${isActive ? "font-medium text-neutral-950 dark:text-neutral-50" : "text-neutral-700 dark:text-neutral-300"}`}>
                  {org.name}
                </span>
                {isActive && !isLoading && <CheckIcon size={14} className="text-neutral-950 dark:text-neutral-50 shrink-0" />}
                {isLoading && (
                  <svg className="animate-spin h-3.5 w-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
              </button>
            );
          })}
          <div className="border-t border-neutral-100 dark:border-neutral-700">
            <Link
              href="/org/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <PlusIcon size={14} />
              New organisation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
