import { cn } from "@/lib/utils";

type Variant = "default" | "green" | "blue" | "red";

interface Props {
  title: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  subtitle?: string;
  accentClass?: string;
  variant?: Variant;
}

const VARIANT_STYLES: Record<Variant, { border: string; value: string; bg: string }> = {
  default: { border: "border-l-gray-200",  value: "text-gray-900",   bg: "bg-white" },
  green:   { border: "border-l-green-400", value: "text-green-700",  bg: "bg-green-50/40" },
  blue:    { border: "border-l-blue-400",  value: "text-blue-700",   bg: "bg-blue-50/40" },
  red:     { border: "border-l-red-400",   value: "text-red-600",    bg: "bg-red-50/40" },
};

export default function MetricCard({ title, value, delta, deltaPositive, subtitle, accentClass, variant = "default" }: Props) {
  const styles = VARIANT_STYLES[variant];
  return (
    <div className={cn("rounded-xl border border-gray-200 border-l-4 p-5", styles.border, styles.bg)}>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className={cn("text-2xl font-bold mt-1", accentClass ?? styles.value)}>{value}</p>
      <div className="flex items-center gap-2 mt-1.5">
        {delta && (
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded-full",
              deltaPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            )}
          >
            {delta}
          </span>
        )}
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
    </div>
  );
}
