import {
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  Clock,
  Loader,
} from "lucide-react";
import {
  BackendTaskListItem,
  priorityNameLabel,
  shortName,
} from "../../types/models/Task";

const PRIORITY_TONE: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-[#c5a059]", text: "text-[#3a2c08]" },
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
    <section className="flex h-full min-w-0 flex-col lg:pr-8">
      <div className="mb-3 flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck size={17} strokeWidth={1.7} className="text-primary" />
            <h2 className="m-0 font-inter text-[16px] font-semibold leading-6 text-text-primary">
              {title}
            </h2>
            {tasks.length > 0 && (
              <span className="rounded-full bg-neutral-soft px-2 py-0.5 font-inter text-[10px] font-semibold text-text-secondary">
                {tasks.length}
              </span>
            )}
          </div>
          <p className="mt-1 font-inter text-[11px] text-text-secondary">
            Vencimiento primero; después prioridad y fecha.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenTasks()}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 font-inter text-[11px] font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
        >
          Ver todas
          <ArrowUpRight size={12} strokeWidth={2} />
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex min-h-48 flex-1 flex-col items-center justify-center text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 size={21} strokeWidth={1.7} />
          </span>
          <p className="font-inter text-[13px] font-medium text-text-primary">Turno al día</p>
          <p className="mt-1 max-w-[280px] font-inter text-[11px] leading-4 text-text-secondary">
            {emptyMessage}
          </p>
        </div>
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
                  type="button"
                  onClick={() => onOpenTasks(task.id)}
                  className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 border-l-2 border-l-transparent px-3 py-3 text-left transition-colors hover:border-l-primary hover:bg-primary-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-inset"
                >
                  <StatusIcon name={task.status.name} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-inter text-[13px] font-semibold text-text-primary">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 font-inter text-[10.5px] text-text-secondary">
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
                  <div className={`flex shrink-0 items-center gap-1 font-inter text-[11px] font-medium ${deadlineColor}`}>
                    <Clock size={11} strokeWidth={1.6} />
                    {deadline.label}
                  </div>
                  <ChevronRight
                    aria-hidden="true"
                    size={14}
                    strokeWidth={1.8}
                    className="-ml-1 shrink-0 text-text-secondary opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-70 group-focus-visible:opacity-70"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
