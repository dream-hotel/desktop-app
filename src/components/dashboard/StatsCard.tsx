import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface StatsCardProps {
  icon: ReactNode;
  value: number | string;
  label: string;
  diff: string;
  diffColor?: string;
  suffix?: string;
}

export default function StatsCard({
  icon,
  value,
  label,
  diff,
  diffColor = "#16a34a",
  suffix = "",
}: StatsCardProps) {
  return (
    <div className="flex min-w-[180px] flex-1 flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary-light text-primary">
          {icon}
        </div>
        <ArrowRight size={16} strokeWidth={1.8} className="cursor-pointer text-text-secondary opacity-50 transition-opacity hover:opacity-100" />
      </div>
      <div className="flex flex-col gap-[2px]">
        <span className="font-inter text-[32px] leading-[38px] font-semibold text-text-primary">
          {value}{suffix}
        </span>
        <span className="font-inter text-[13px] leading-[18px] text-text-secondary">
          {label}
        </span>
      </div>
      <span className="font-inter text-xs leading-4 font-medium" style={{ color: diffColor }}>
        {diff}
      </span>
    </div>
  );
}
