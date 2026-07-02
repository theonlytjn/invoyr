"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "All time",      value: "all" },
  { label: "This month",    value: "this_month" },
  { label: "Last month",    value: "last_month" },
  { label: "Last 3 months", value: "last_3_months" },
  { label: "This year",     value: "this_year" },
] as const;

export default function PaymentsFilter() {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get("period") ?? "all";
  const currentFrom   = searchParams.get("from") ?? "";
  const currentTo     = searchParams.get("to")   ?? "";
  const isCustom      = !!(currentFrom || currentTo);

  const [showCustom, setShowCustom] = useState(isCustom);
  const [from, setFrom] = useState(currentFrom);
  const [to,   setTo]   = useState(currentTo);

  function selectPreset(value: string) {
    setShowCustom(false);
    setFrom("");
    setTo("");
    const params = new URLSearchParams();
    if (value !== "all") params.set("period", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyCustom(newFrom: string, newTo: string) {
    if (!newFrom && !newTo) return;
    const params = new URLSearchParams();
    if (newFrom) params.set("from", newFrom);
    if (newTo)   params.set("to", newTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleFromChange(val: string) {
    setFrom(val);
    applyCustom(val, to);
  }

  function handleToChange(val: string) {
    setTo(val);
    applyCustom(from, val);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => selectPreset(p.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              !isCustom && currentPeriod === p.value
                ? "bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950"
                : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500"
            )}
          >
            {p.label}
          </button>
        ))}

        <button
          onClick={() => { setShowCustom(true); }}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            isCustom || showCustom
              ? "bg-neutral-950 dark:bg-neutral-50 text-white dark:text-neutral-950"
              : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500"
          )}
        >
          Custom
        </button>
      </div>

      {(showCustom || isCustom) && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => handleFromChange(e.target.value)}
            max={to || undefined}
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-neutral-50"
          />
          <span className="text-sm text-neutral-400">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => handleToChange(e.target.value)}
            min={from || undefined}
            className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 dark:focus:ring-neutral-50"
          />
          {(from || to) && (
            <button
              onClick={() => { setFrom(""); setTo(""); selectPreset("all"); }}
              className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
