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
    "group relative flex min-h-[122px] min-w-0 flex-col px-5 py-4 text-left transition-colors duration-200";
  const interactiveClasses = interactive
    ? "cursor-pointer hover:bg-primary-light/45 focus-visible:z-[1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-inset"
    : "";

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${styles.iconBg} ${styles.iconText}`}
        >
          {icon}
        </div>
        {interactive && (
          <ArrowRight
            size={16}
            strokeWidth={1.8}
            className="text-text-secondary opacity-40 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-100"
          />
        )}
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        <span className="font-inter text-[28px] font-semibold leading-8 tracking-[-0.02em] text-text-primary">
          {value}
        </span>
        <span className="font-inter text-[13px] font-medium leading-[18px] text-text-body">
          {label}
        </span>
      </div>
      {hint && (
        <span className="mt-1 font-inter text-[11px] leading-4 text-text-secondary">
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
