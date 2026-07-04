"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const PRESETS = [
  { label: "All time",      value: "all" },
  { label: "This month",    value: "this_month" },
  { label: "Last month",    value: "last_month" },
  { label: "Last 3 months", value: "last_3_months" },
  { label: "This year",     value: "this_year" },
] as const;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function PaymentsFilter() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get("period") ?? "all";
  const currentFrom   = searchParams.get("from") ?? "";
  const currentTo     = searchParams.get("to")   ?? "";
  const isCustom      = !!(currentFrom || currentTo);

  const [open, setOpen]     = useState(false);
  const [from, setFrom]     = useState(currentFrom);
  const [to,   setTo]       = useState(currentTo);
  const [showDates, setShowDates] = useState(isCustom);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function selectPreset(value: string) {
    setShowDates(false);
    setFrom("");
    setTo("");
    setOpen(false);
    const params = new URLSearchParams();
    if (value !== "all") params.set("period", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyCustom(f: string, t: string) {
    if (!f && !t) return;
    const params = new URLSearchParams();
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleFrom(val: string) {
    setFrom(val);
    applyCustom(val, to);
  }

  function handleTo(val: string) {
    setTo(val);
    applyCustom(from, val);
  }

  function clear() {
    setFrom("");
    setTo("");
    setShowDates(false);
    setOpen(false);
    router.push(pathname);
  }

  const activePreset = PRESETS.find((p) => p.value === currentPeriod);
  const label = isCustom
    ? from && to
      ? `${fmt(from)} – ${fmt(to)}`
      : from
        ? `From ${fmt(from)}`
        : to
          ? `To ${fmt(to)}`
          : "Custom"
    : (activePreset?.label ?? "All time");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-neutral-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {label}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={`w-3 h-3 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-30 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg min-w-[180px] py-1 overflow-hidden">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => selectPreset(p.value)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <span className={`w-3.5 h-3.5 shrink-0 ${!isCustom && currentPeriod === p.value ? "text-neutral-950 dark:text-neutral-50" : "text-transparent"}`}>
                {!isCustom && currentPeriod === p.value && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {p.label}
            </button>
          ))}

          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

          <button
            onClick={() => setShowDates((s) => !s)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className={`w-3.5 h-3.5 shrink-0 ${isCustom ? "text-neutral-950 dark:text-neutral-50" : "text-transparent"}`}>
              {isCustom && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            Custom range
          </button>

          {showDates && (
            <div className="px-3 pb-3 pt-1 space-y-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => handleFrom(e.target.value)}
                  max={to || undefined}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-neutral-400">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => handleTo(e.target.value)}
                  min={from || undefined}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-950 dark:text-neutral-50 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-50"
                />
              </div>
              {(from || to) && (
                <button
                  onClick={clear}
                  className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  Clear range
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
