"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const options = [
  {
    value: "light",
    label: "Light",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    value: "system",
    label: "System",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-[100px] rounded-lg bg-neutral-100 dark:bg-neutral-800" />;
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5">
      {options.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            aria-label={`Switch to ${opt.label} mode`}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150",
              active
                ? "bg-white dark:bg-neutral-700 text-neutral-950 dark:text-neutral-50 shadow-sm"
                : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            )}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
