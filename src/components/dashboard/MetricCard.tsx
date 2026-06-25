import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "neutral";

interface Props {
  title: string;
  value: string;
  change?: { value: string; trend: Trend };
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function MetricCard({ title, value, change, subtitle, icon }: Props) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Top */}
      <div className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {title}
          </p>
          <p className="text-3xl font-serif text-neutral-950 dark:text-neutral-50">
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700">
            {icon}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 px-5 py-4">
        <p className="text-sm">
          {change && (
            <span
              className={cn(
                "font-medium",
                change.trend === "up" && "text-green-600",
                change.trend === "down" && "text-red-600",
                change.trend === "neutral" && "text-neutral-500",
              )}
            >
              {change.value}{" "}
            </span>
          )}
          {subtitle && (
            <span className="text-neutral-500">{subtitle}</span>
          )}
        </p>
      </div>
    </div>
  );
}
