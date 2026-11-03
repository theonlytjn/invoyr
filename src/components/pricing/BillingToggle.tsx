"use client";

import { useRef } from "react";
import type { BillingPeriod } from "@/config/plans";
import { cn } from "@/lib/utils";

const OPTIONS: { value: BillingPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

interface Props {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
  className?: string;
}

/**
 * Monthly | Yearly segmented control. A radiogroup, so the arrow keys move
 * between the two options and only the selected one is in the tab order.
 */
export default function BillingToggle({ value, onChange, className }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const next = (index + 1) % OPTIONS.length;
    onChange(OPTIONS[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Billing period"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border p-1",
        "border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
    >
      {OPTIONS.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100 dark:focus-visible:ring-offset-neutral-900",
              selected
                ? "bg-neutral-950 text-white dark:bg-neutral-50 dark:text-neutral-950"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            )}
          >
            {option.label}
            {option.value === "yearly" && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold leading-none text-brand-foreground">
                2 months free
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
