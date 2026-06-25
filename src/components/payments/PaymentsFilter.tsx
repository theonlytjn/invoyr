"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "All time", value: "all" },
  { label: "This month", value: "this_month" },
  { label: "Last month", value: "last_month" },
  { label: "Last 3 months", value: "last_3_months" },
  { label: "This year", value: "this_year" },
] as const;

export default function PaymentsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("period") ?? "all";

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("period");
    } else {
      params.set("period", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => select(p.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            current === p.value
              ? "bg-neutral-950 text-white"
              : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
