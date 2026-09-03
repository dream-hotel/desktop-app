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
  { iconBg: string; iconText: string; edge: string }
> = {
  default: { iconBg: "bg-primary-light", iconText: "text-primary", edge: "bg-primary" },
  warning: { iconBg: "bg-warning/15", iconText: "text-warning", edge: "bg-warning" },
  danger: { iconBg: "bg-danger/10", iconText: "text-danger", edge: "bg-danger" },
  success: { iconBg: "bg-success/15", iconText: "text-success", edge: "bg-success" },
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
    "group relative flex min-h-[138px] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface p-4 text-left transition-[background-color,border-color,box-shadow] duration-200";
  const interactiveClasses = interactive
    ? "cursor-pointer hover:border-border-strong hover:bg-surface-hover hover:shadow-[0_8px_24px_rgba(30,29,22,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    : "";

  const content = (
    <>
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-[3px] ${styles.edge}`} />
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${styles.iconBg} ${styles.iconText}`}
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
      <div className="mt-3 flex flex-col gap-0.5">
        <span className="font-inter text-[30px] font-semibold leading-8 tracking-[-0.02em] text-text-primary">
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
