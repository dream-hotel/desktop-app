import { ReactNode } from "react";

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
        <svg className="cursor-pointer opacity-50 transition-opacity hover:opacity-100" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 8h8M8 4l4 4-4 4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
