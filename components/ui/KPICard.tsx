import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  color?: string;
  loading?: boolean;
  className?: string;
}

export function KPICard({
  label, value, sub, trend, icon: Icon,
  color = "#22c55e", loading, className,
}: KPICardProps) {
  if (loading) {
    return (
      <div className={cn("bg-bg-3 border border-border rounded-xl p-5", className)}>
        <div className="skeleton h-3 w-20 rounded mb-4" />
        <div className="skeleton h-7 w-28 rounded mb-2" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn("bg-bg-3 border border-border rounded-xl p-5 card-glow flex flex-col gap-2", className)}
      style={{ ["--hover-color" as string]: color }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted tracking-wider uppercase">
          {label}
        </span>
        {Icon && (
          <div className="rounded-lg p-1.5" style={{ background: `${color}18` }}>
            <Icon size={14} style={{ color }} />
          </div>
        )}
      </div>

      <div className="font-syne text-[28px] font-bold text-white tracking-tight leading-none">
        {value}
      </div>

      {sub && (
        <div className="flex items-center gap-1 text-xs">
          {trend === "up" && <TrendingUp size={12} className="text-brand" />}
          {trend === "down" && <TrendingDown size={12} className="text-red-400" />}
          <span className={
            trend === "up" ? "text-brand" :
            trend === "down" ? "text-red-400" :
            "text-muted"
          }>
            {sub}
          </span>
        </div>
      )}
    </div>
  );
}
