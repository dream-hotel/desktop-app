import { ArrowUpRight, Ban, CheckCircle2, CircleDashed, Clock, Loader } from "lucide-react";
import {
  BackendTaskListItem,
  priorityNameLabel,
  shortName,
} from "../../types/models/Task";

const PRIORITY_TONE: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-[#c5a059]", text: "text-white" },
  high: { bg: "bg-warning/15", text: "text-warning" },
  medium: { bg: "bg-success/15", text: "text-success" },
  low: { bg: "bg-neutral-soft", text: "text-text-secondary" },
};

function StatusIcon({ name }: { name: string }) {
  switch (name) {
    case "in_progress":
      return <Loader size={14} strokeWidth={1.6} className="shrink-0 text-warning" />;
    case "completed":
      return <CheckCircle2 size={14} strokeWidth={1.6} className="shrink-0 text-success" />;
    case "archived":
      return <Ban size={14} strokeWidth={1.6} className="shrink-0 text-danger" />;
    case "pending":
    default:
      return <CircleDashed size={14} strokeWidth={1.6} className="shrink-0 text-text-secondary" />;
  }
}

function formatDeadline(iso: string | null): { label: string; tone: "muted" | "warn" | "danger" } {
  if (!iso) return { label: "Sin fecha", tone: "muted" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { label: "Sin fecha", tone: "muted" };
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = diffMs / (60 * 60 * 1000);
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffMs < 0) return { label: `Vencida ${isToday ? time : d.toLocaleDateString([], { day: "2-digit", month: "short" })}`, tone: "danger" };
  if (isToday) return { label: `Hoy ${time}`, tone: "warn" };
  if (diffH < 48) return { label: `Mañana ${time}`, tone: "warn" };
  return {
    label: d.toLocaleDateString([], { day: "2-digit", month: "short" }),
    tone: "muted",
  };
}

interface UrgentTasksListProps {
  tasks: BackendTaskListItem[];
  title: string;
  emptyMessage: string;
  onOpenTasks: (taskId?: number) => void;
}

export default function UrgentTasksList({
  tasks,
  title,
  emptyMessage,
  onOpenTasks,
}: UrgentTasksListProps) {
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 font-inter text-lg font-semibold leading-6 text-text-primary">
          {title}
        </h2>
        <button
          onClick={() => onOpenTasks()}
          className="flex items-center gap-1 font-inter text-[12px] font-medium text-primary hover:underline"
        >
          Ver todas
          <ArrowUpRight size={12} strokeWidth={2} />
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center font-inter text-sm text-text-secondary">
          {emptyMessage}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {tasks.map((task) => {
            const priorityTone = PRIORITY_TONE[task.priority.name] ?? PRIORITY_TONE.low;
            const deadline = formatDeadline(task.limitDate);
            const deadlineColor =
              deadline.tone === "danger"
                ? "text-danger"
                : deadline.tone === "warn"
                  ? "text-warning"
                  : "text-text-secondary";
            return (
              <li key={task.id}>
                <button
                  onClick={() => onOpenTasks(task.id)}
                  className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-primary-light/40"
                >
                  <StatusIcon name={task.status.name} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-inter text-sm font-medium text-text-primary">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 font-inter text-[11px] text-text-secondary">
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-[1px] text-[10px] ${priorityTone.bg} ${priorityTone.text}`}
                      >
                        {priorityNameLabel(task.priority.name)}
                      </span>
                      {task.assignments.length > 0 && (
                        <span className="truncate">
                          {shortName(task.assignments[0].user)}
                          {task.assignments.length > 1 ? ` +${task.assignments.length - 1}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`flex shrink-0 items-center gap-1 font-inter text-[12px] font-medium ${deadlineColor}`}>
                    <Clock size={11} strokeWidth={1.6} />
                    {deadline.label}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
