import { Task, TaskPriority, TaskStatus } from "../../types/response/TaskResponse";

const STATUS_LABEL: Record<TaskStatus, string> = {
  in_progress: "In Progress",
  pending: "Pending",
  done: "Done",
  blocked: "Blocked",
};

const STATUS_STYLE: Record<TaskStatus, { bg: string; border: string; text: string }> = {
  in_progress: { bg: "bg-[#fef3c7]", border: "border-[rgba(197,160,89,0.2)]", text: "text-[#92400e]" },
  pending: { bg: "bg-[#f3f4f6]", border: "border-[rgba(209,213,219,0.3)]", text: "text-text-secondary" },
  done: { bg: "bg-[#ecfdf5]", border: "border-[rgba(118,199,194,0.2)]", text: "text-[#065f46]" },
  blocked: { bg: "bg-[#fee2e2]", border: "border-[rgba(239,68,68,0.2)]", text: "text-[#991b1b]" },
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
    <div className="flex h-full flex-col bg-white">
      {/* Header: status + menu */}
      <div className="border-b border-border p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
              {task.status === "in_progress" && (
                <>
                  <circle cx="8" cy="8" r="6.5" stroke="#c5a059" strokeWidth="1.2" />
                  <path d="M8 4.5v3.5l2 1.5" stroke="#c5a059" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
              {task.status === "pending" && <circle cx="8" cy="8" r="6.5" stroke="#d1d5db" strokeWidth="1.2" />}
              {task.status === "done" && (
                <>
                  <circle cx="8" cy="8" r="6.5" stroke="#76c7c2" strokeWidth="1.2" />
                  <path d="M5.5 8l2 2 3.5-3.5" stroke="#76c7c2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
              {task.status === "blocked" && (
                <>
                  <circle cx="8" cy="8" r="6.5" stroke="#ef4444" strokeWidth="1.2" />
                  <path d="M8 5v3" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
                  <circle cx="8" cy="10.5" r="0.6" fill="#ef4444" />
                </>
              )}
            </svg>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
            >
              {STATUS_LABEL[task.status]}
            </span>
          </div>
          <button className="flex h-[26px] w-[26px] items-center justify-center rounded text-text-secondary hover:bg-[#f3f4f6]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="4" r="1" fill="#6b7280" />
              <circle cx="9" cy="9" r="1" fill="#6b7280" />
              <circle cx="9" cy="14" r="1" fill="#6b7280" />
            </svg>
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
          <span className="font-inter text-[11px] leading-[16.5px] text-[#9ca3af]">Asignado a</span>
          <span className="font-inter text-sm font-medium leading-[21px] text-text-primary">
            {task.assignee}
          </span>
        </div>
        <div className="flex w-[175px] flex-col gap-[2px]">
          <span className="font-inter text-[11px] leading-[16.5px] text-[#9ca3af]">Hora límite</span>
          <span className="font-inter text-sm font-medium leading-[21px] text-text-primary">
            {task.deadline}
          </span>
        </div>
        <div className="flex w-[175px] flex-col gap-[2px]">
          <span className="font-inter text-[11px] leading-[16.5px] text-[#9ca3af]">Prioridad</span>
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
                      index === 0 ? "bg-[#c5a059]" : "bg-[#d1d5db]"
                    }`}
                  />
                </div>
                <div className="flex flex-col">
                  <p className="font-inter text-[13px] leading-[19.5px]">
                    <span className="font-medium text-text-primary">{entry.authorName}</span>{" "}
                    <span className="text-text-secondary">{entry.action}</span>
                  </p>
                  <span className="font-inter text-[11px] leading-[16.5px] text-[#9ca3af]">
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
