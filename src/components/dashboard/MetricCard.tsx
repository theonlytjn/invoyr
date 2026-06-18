import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  subtitle?: string;
  accentClass?: string;
}

export default function MetricCard({ title, value, delta, deltaPositive, subtitle, accentClass }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className={cn("text-2xl font-bold text-gray-900 mt-1", accentClass)}>{value}</p>
      <div className="flex items-center gap-2 mt-1.5">
        {delta && (
          <span
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded-full",
              deltaPositive
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
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
