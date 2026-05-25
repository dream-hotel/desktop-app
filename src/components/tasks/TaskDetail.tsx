import { useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  CircleDashed,
  Loader,
  Maximize2,
  MessageSquare,
  Send,
  Users,
} from "lucide-react";
import {
  BackendTask,
  BackendTaskActivityLog,
  fullName,
  priorityNameLabel,
  statusLabel,
} from "../../types/models/Task";
import { addTaskComment } from "../../service/taskService";

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  in_progress: { bg: "bg-warning/15", border: "border-[rgba(197,160,89,0.2)]", text: "text-warning" },
  pending: { bg: "bg-neutral-soft", border: "border-[rgba(209,213,219,0.3)]", text: "text-text-secondary" },
  completed: { bg: "bg-success/10", border: "border-[rgba(118,199,194,0.2)]", text: "text-success" },
  archived: { bg: "bg-danger/10", border: "border-[rgba(239,68,68,0.2)]", text: "text-danger" },
};

function StatusIcon({ name }: { name: string }) {
  switch (name) {
    case "in_progress":
      return <Loader size={16} strokeWidth={1.6} className="shrink-0 text-warning" />;
    case "completed":
      return <CheckCircle2 size={16} strokeWidth={1.6} className="shrink-0 text-success" />;
    case "archived":
      return <Ban size={16} strokeWidth={1.6} className="shrink-0 text-danger" />;
    case "pending":
    default:
      return <CircleDashed size={16} strokeWidth={1.6} className="shrink-0 text-text-secondary" />;
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function authorName(entry: BackendTaskActivityLog): string {
  if (entry.user) return fullName(entry.user);
  return "Sistema";
}

interface TaskDetailProps {
  task: BackendTask;
  comments: BackendTaskActivityLog[];
  isLoadingComments: boolean;
  onCommentAdded: () => void;
  onExpand: () => void;
}

export default function TaskDetail({
  task,
  comments,
  isLoadingComments,
  onCommentAdded,
  onExpand,
}: TaskDetailProps) {
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusStyle = STATUS_STYLE[task.status.name] ?? STATUS_STYLE.pending;

  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [comments],
  );

  async function handleSend() {
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    setError(null);
    try {
      await addTaskComment(task.id, text);
      setDraft("");
      onCommentAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el comentario");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="border-b border-border p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon name={task.status.name} />
            <span
              className={`inline-flex items-center rounded-full border px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
            >
              {statusLabel(task.status.name)}
            </span>
          </div>
          <button
            onClick={onExpand}
            className="flex h-[26px] items-center gap-1 rounded-md border border-border-strong px-2 font-inter text-[11px] font-medium text-text-secondary hover:bg-neutral-soft"
            title="Ver pantalla completa"
          >
            <Maximize2 size={12} strokeWidth={1.8} />
            Ver completo
          </button>
        </div>

        <div className="mt-[10px]">
          <h2 className="font-alexandria text-[25px] font-normal leading-[28px] text-text-primary">
            {task.title}
          </h2>
        </div>

        {task.description && (
          <p className="mt-[10px] font-inter text-sm leading-[21px] text-text-secondary">
            {task.description}
          </p>
        )}
      </div>

      {/* Metadata grid */}
      <div className="flex flex-wrap gap-4 border-b border-border p-5">
        <div className="flex w-[175px] flex-col gap-[2px]">
          <span className="font-inter text-[11px] leading-[16.5px] text-text-secondary">
            Asignado a
          </span>
          <span className="flex items-center gap-1 font-inter text-sm font-medium leading-[21px] text-text-primary">
            {task.assignments.length === 0 ? (
              "Sin asignar"
            ) : task.assignments.length === 1 ? (
              fullName(task.assignments[0].user)
            ) : (
              <>
                <Users size={13} strokeWidth={1.6} className="text-text-secondary" />
                {task.assignments.length} colaboradores
              </>
            )}
          </span>
        </div>
        <div className="flex w-[175px] flex-col gap-[2px]">
          <span className="font-inter text-[11px] leading-[16.5px] text-text-secondary">
            Hora límite
          </span>
          <span className="font-inter text-sm font-medium leading-[21px] text-text-primary">
            {formatDateTime(task.limitDate)}
          </span>
        </div>
        <div className="flex w-[175px] flex-col gap-[2px]">
          <span className="font-inter text-[11px] leading-[16.5px] text-text-secondary">
            Prioridad
          </span>
          <span className="font-inter text-sm font-medium leading-[21px] text-text-primary">
            {priorityNameLabel(task.priority.name)}
          </span>
        </div>
      </div>

      {/* Comments thread (handover) */}
      <div className="flex flex-1 flex-col overflow-hidden px-5 pt-5">
        <div className="flex items-center justify-between">
          <h3 className="font-alexandria text-xl font-normal leading-[21px] text-text-primary">
            Comentarios de relevo
          </h3>
          {sortedComments.length > 0 && (
            <span className="flex items-center gap-1 font-inter text-[11px] text-text-secondary">
              <MessageSquare size={11} strokeWidth={1.6} />
              {sortedComments.length}
            </span>
          )}
        </div>
        <p className="mt-1 font-inter text-[11px] leading-[16px] text-text-secondary">
          Deja constancia del estado en que dejas la tarea para que otra persona pueda continuarla.
        </p>

        <div className="relative mt-4 flex-1 overflow-y-auto pr-1">
          {isLoadingComments ? (
            <div className="flex h-full items-center justify-center font-inter text-sm text-text-secondary">
              Cargando comentarios...
            </div>
          ) : sortedComments.length === 0 ? (
            <div className="flex h-full items-center justify-center px-4 text-center font-inter text-[12px] text-text-secondary">
              Aún no hay comentarios. Sé el primero en dejar una nota de relevo.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedComments.map((entry) => (
                <CommentBubble key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="mt-3 shrink-0 border-t border-border pt-3 pb-4">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe tu comentario de relevo..."
              rows={2}
              className="flex-1 resize-none rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-3 py-2 font-inter text-[12px] leading-[18px] text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none focus:border-primary"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || posting}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 font-inter text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={12} strokeWidth={2} />
              {posting ? "Enviando..." : "Enviar"}
            </button>
          </div>
          {error && (
            <p className="mt-1 font-inter text-[11px] text-danger">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentBubble({ entry }: { entry: BackendTaskActivityLog }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light font-inter text-[11px] font-semibold text-primary">
        {(entry.user?.fullName ?? "?").charAt(0).toUpperCase()}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-[rgba(0,0,0,0.06)] bg-bg p-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-inter text-[12px] font-medium text-text-primary">
            {authorName(entry)}
          </span>
          <span className="shrink-0 font-inter text-[10px] text-text-secondary">
            {formatRelativeTime(entry.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words font-inter text-[12px] leading-[18px] text-text-primary">
          {entry.action}
        </p>
      </div>
    </div>
  );
}
