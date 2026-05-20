import { Ban, CheckCircle2, CircleDashed, Loader, MoreVertical } from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "../../types/response/TaskResponse";

const STATUS_LABEL: Record<TaskStatus, string> = {
  in_progress: "In Progress",
  pending: "Pending",
  done: "Done",
  blocked: "Blocked",
};

const STATUS_STYLE: Record<TaskStatus, { bg: string; border: string; text: string }> = {
  in_progress: { bg: "bg-warning/15", border: "border-[rgba(197,160,89,0.2)]", text: "text-warning" },
  pending: { bg: "bg-neutral-soft", border: "border-[rgba(209,213,219,0.3)]", text: "text-text-secondary" },
  done: { bg: "bg-success/10", border: "border-[rgba(118,199,194,0.2)]", text: "text-success" },
  blocked: { bg: "bg-danger/10", border: "border-[rgba(239,68,68,0.2)]", text: "text-danger" },
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  critical: "Critica",
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

function TaskDetailTitle({ task }: { task: Task }) {
  // Convert english title to the spanish display version from the design
  const displayTitles: Record<number, string> = {
    1: "Suite 301 — A/C reemplazo del compresor",
  };
  return (
    <h2 className="font-alexandria text-[25px] font-normal leading-[25px] text-text-primary">
      {displayTitles[task.id] ?? task.title}
    </h2>
  );
}

interface TaskDetailProps {
  task: Task;
}

export default function TaskDetail({ task }: TaskDetailProps) {
  const statusStyle = STATUS_STYLE[task.status];

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header: status + menu */}
      <div className="border-b border-border p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {task.status === "in_progress" && <Loader size={16} strokeWidth={1.6} className="shrink-0 text-warning" />}
            {task.status === "pending" && <CircleDashed size={16} strokeWidth={1.6} className="shrink-0 text-text-secondary" />}
            {task.status === "done" && <CheckCircle2 size={16} strokeWidth={1.6} className="shrink-0 text-success" />}
            {task.status === "blocked" && <Ban size={16} strokeWidth={1.6} className="shrink-0 text-danger" />}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
            >
              {STATUS_LABEL[task.status]}
            </span>
          </div>
          <button className="flex h-[26px] w-[26px] items-center justify-center rounded text-text-secondary hover:bg-neutral-soft">
            <MoreVertical size={16} strokeWidth={1.8} className="text-text-secondary" />
          </button>
        </div>

        {/* Title */}
        <div className="mt-[10px]">
          <TaskDetailTitle task={task} />
        </div>

        {/* Description */}
        <p className="mt-[10px] font-inter text-sm leading-[21px] text-text-secondary">
          {task.description}
        </p>
      </div>

      {/* Metadata grid */}
      <div className="flex flex-wrap gap-4 border-b border-border p-5">
        <div className="flex w-[175px] flex-col gap-[2px]">
          <span className="font-inter text-[11px] leading-[16.5px] text-text-secondary">Asignado a</span>
          <span className="font-inter text-sm font-medium leading-[21px] text-text-primary">
            {task.assignee}
          </span>
        </div>
        <div className="flex w-[175px] flex-col gap-[2px]">
          <span className="font-inter text-[11px] leading-[16.5px] text-text-secondary">Hora límite</span>
          <span className="font-inter text-sm font-medium leading-[21px] text-text-primary">
            {task.deadline}
          </span>
        </div>
        <div className="flex w-[175px] flex-col gap-[2px]">
          <span className="font-inter text-[11px] leading-[16.5px] text-text-secondary">Prioridad</span>
          <span className="font-inter text-sm font-medium leading-[21px] text-text-primary">
            {PRIORITY_LABEL[task.priority]}
          </span>
        </div>
      </div>

      {/* Activity log */}
      <div className="flex flex-1 flex-col overflow-hidden px-5 pt-5">
        <h3 className="font-alexandria text-xl font-normal leading-[21px] text-text-primary">
          Registro de Actividad
        </h3>

        <div className="relative mt-4 flex-1 overflow-y-auto">
          {/* Vertical line */}
          {task.activityLog.length > 1 && (
            <div
              className="absolute left-[7px] top-2 w-px bg-[rgba(0,0,0,0.08)]"
              style={{ height: `${(task.activityLog.length - 1) * 52 - 4}px` }}
            />
          )}

          <div className="flex flex-col gap-4">
            {task.activityLog.map((entry, index) => (
              <div key={entry.id} className="flex gap-3">
                <div className="flex shrink-0 items-start justify-center pt-1" style={{ width: 15 }}>
                  <div
                    className={`h-[10px] w-[10px] rounded-full ${
                      index === 0 ? "bg-[#c5a059]" : "bg-neutral-mid"
                    }`}
                  />
                </div>
                <div className="flex flex-col">
                  <p className="font-inter text-[13px] leading-[19.5px]">
                    <span className="font-medium text-text-primary">{entry.authorName}</span>{" "}
                    <span className="text-text-secondary">{entry.action}</span>
                  </p>
                  <span className="font-inter text-[11px] leading-[16.5px] text-text-secondary">
                    {entry.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
