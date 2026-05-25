import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface StatsCardProps {
  icon: ReactNode;
  value: number | string;
  label: string;
  hint?: string;
  accent?: "default" | "warning" | "danger" | "success";
  onClick?: () => void;
}

const ACCENT_STYLES: Record<
  NonNullable<StatsCardProps["accent"]>,
  { iconBg: string; iconText: string }
> = {
  default: { iconBg: "bg-primary-light", iconText: "text-primary" },
  warning: { iconBg: "bg-warning/15", iconText: "text-warning" },
  danger: { iconBg: "bg-danger/10", iconText: "text-danger" },
  success: { iconBg: "bg-success/15", iconText: "text-success" },
};

export default function StatsCard({
  icon,
  value,
  label,
  hint,
  accent = "default",
  onClick,
}: StatsCardProps) {
  const styles = ACCENT_STYLES[accent];
  const interactive = typeof onClick === "function";
  const baseClasses =
    "flex min-w-[180px] flex-1 flex-col gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition-colors";
  const interactiveClasses = interactive
    ? "cursor-pointer hover:border-primary/40 hover:bg-primary-light/40"
    : "";

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-[10px] ${styles.iconBg} ${styles.iconText}`}
        >
          {icon}
        </div>
        {interactive && (
          <ArrowRight
            size={16}
            strokeWidth={1.8}
            className="text-text-secondary opacity-50 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
      <div className="flex flex-col gap-[2px]">
        <span className="font-inter text-[32px] font-semibold leading-[38px] text-text-primary">
          {value}
        </span>
        <span className="font-inter text-[13px] leading-[18px] text-text-secondary">
          {label}
        </span>
      </div>
      {hint && (
        <span className="font-inter text-xs leading-4 text-text-secondary">
          {hint}
        </span>
      )}
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group ${baseClasses} ${interactiveClasses}`}
      >
        {content}
      </button>
    );
  }
  return <div className={baseClasses}>{content}</div>;
}
