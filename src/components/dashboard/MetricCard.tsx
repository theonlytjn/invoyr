import { cn } from "@/lib/utils";

type Variant = "default" | "green" | "blue" | "red";

interface Props {
  title: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: Variant;
}

export default function MetricCard({ title, value, delta, deltaPositive, subtitle, icon, variant = "default" }: Props) {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-clip">
      {/* Top: label + icon */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-[#e5e5e5]">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium tracking-widest text-[#737373] uppercase">
            {title}
          </p>
          <p
            className={cn(
              "text-[32px] leading-10 tracking-tight font-normal",
              variant === "red" ? "text-red-600" : variant === "green" ? "text-[#00a63e]" : variant === "blue" ? "text-blue-600" : "text-[#0a0a0a]"
            )}
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            {value}
          </p>
        </div>
        {icon && (
          <div className="border border-[#e5e5e5] rounded-xl p-3 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
      {/* Bottom: delta / subtitle */}
      <div className="px-5 py-3 flex items-center gap-2">
        {delta && (
          <span
            className={cn(
              "text-[13px] font-medium",
              deltaPositive ? "text-[#00a63e]" : "text-red-600"
            )}
          >
            {delta}
          </span>
        )}
        {subtitle && (
          <span className="text-[13px] text-[#737373]">{subtitle}</span>
        )}
        {!delta && !subtitle && <span className="text-[13px] text-[#737373]">&nbsp;</span>}
      </div>
    </div>
  );
}
