import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Clock,
  ExternalLink,
  FileText,
  Loader,
  MessageSquare,
  Paperclip,
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

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-[#c5a059]", text: "text-white" },
  high: { bg: "bg-warning/15", text: "text-warning" },
  medium: { bg: "bg-success/15", text: "text-success" },
  low: { bg: "bg-neutral-soft", text: "text-text-secondary" },
};

function StatusIcon({ name }: { name: string }) {
  switch (name) {
    case "in_progress":
      return <Loader size={18} strokeWidth={1.6} className="text-warning" />;
    case "completed":
      return <CheckCircle2 size={18} strokeWidth={1.6} className="text-success" />;
    case "archived":
      return <Ban size={18} strokeWidth={1.6} className="text-danger" />;
    case "pending":
    default:
      return <CircleDashed size={18} strokeWidth={1.6} className="text-text-secondary" />;
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function fileNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : url;
  } catch {
    return url;
  }
}

interface TaskFullViewProps {
  task: BackendTask;
  comments: BackendTaskActivityLog[];
  isLoadingComments: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
}

export default function TaskFullView({
  task,
  comments,
  isLoadingComments,
  onClose,
  onCommentAdded,
}: TaskFullViewProps) {
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusStyle = STATUS_STYLE[task.status.name] ?? STATUS_STYLE.pending;
  const priorityStyle = PRIORITY_STYLE[task.priority.name] ?? PRIORITY_STYLE.low;

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
    <div className="flex h-full flex-col bg-bg">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-6 py-3">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-neutral-soft"
          title="Volver"
        >
          <ArrowLeft size={16} strokeWidth={1.8} />
        </button>
        <div className="flex items-center gap-2">
          <StatusIcon name={task.status.name} />
          <span
            className={`inline-flex items-center rounded-full border px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
          >
            {statusLabel(task.status.name)}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${priorityStyle.bg} ${priorityStyle.text}`}
          >
            Prioridad {priorityNameLabel(task.priority.name)}
          </span>
        </div>
        <div className="ml-auto font-inter text-[11px] text-text-secondary">
          Tarea #{task.id}
        </div>
      </div>

      {/* Body — two columns */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-6">
          <h1 className="font-alexandria text-[32px] font-normal leading-[36px] text-text-primary">
            {task.title}
          </h1>

          {task.description && (
            <section className="mt-6">
              <SectionHeader icon={<FileText size={14} strokeWidth={1.8} />}>
                Descripción
              </SectionHeader>
              <p className="mt-2 whitespace-pre-wrap font-inter text-sm leading-[22px] text-text-primary">
                {task.description}
              </p>
            </section>
          )}

          {task.content && (
            <section className="mt-6">
              <SectionHeader icon={<FileText size={14} strokeWidth={1.8} />}>
                Notas adicionales
              </SectionHeader>
              <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-surface px-4 py-3 font-inter text-sm leading-[22px] text-text-primary">
                {task.content}
              </p>
            </section>
          )}

          {task.files.length > 0 && (
            <section className="mt-6">
              <SectionHeader icon={<Paperclip size={14} strokeWidth={1.8} />}>
                Archivos adjuntos ({task.files.length})
              </SectionHeader>
              <ul className="mt-2 flex flex-col gap-1.5">
                {task.files.map((file) => (
                  <li key={file.id}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 hover:bg-neutral-soft"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Paperclip size={12} strokeWidth={1.6} className="shrink-0 text-text-secondary" />
                        <span className="truncate font-inter text-[12px] text-text-primary">
                          {fileNameFromUrl(file.url)}
                        </span>
                      </div>
                      <ExternalLink size={12} strokeWidth={1.6} className="shrink-0 text-text-secondary" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Comments */}
          <section className="mt-8 flex flex-col">
            <SectionHeader icon={<MessageSquare size={14} strokeWidth={1.8} />}>
              Comentarios de relevo ({sortedComments.length})
            </SectionHeader>
            <p className="mt-1 font-inter text-[12px] leading-[18px] text-text-secondary">
              Cuando dejes una tarea a medio terminar, deja aquí una nota explicando en qué estado quedó para que otro compañero pueda retomarla.
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {isLoadingComments ? (
                <p className="font-inter text-sm text-text-secondary">Cargando comentarios...</p>
              ) : sortedComments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-center font-inter text-[12px] text-text-secondary">
                  Aún no hay comentarios para esta tarea.
                </div>
              ) : (
                sortedComments.map((entry) => <FullComment key={entry.id} entry={entry} />)
              )}
            </div>

            <div className="mt-4 rounded-lg border border-border bg-surface p-3">
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
                rows={3}
                className="w-full resize-none rounded-md bg-bg px-3 py-2 font-inter text-sm leading-[20px] text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="font-inter text-[10px] text-text-secondary">
                  Ctrl/Cmd + Enter para enviar
                </span>
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || posting}
                  className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 font-inter text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={12} strokeWidth={2} />
                  {posting ? "Enviando..." : "Enviar comentario"}
                </button>
              </div>
              {error && <p className="mt-2 font-inter text-[11px] text-danger">{error}</p>}
            </div>
          </section>
        </div>

        {/* Side column */}
        <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-border bg-surface px-5 py-6">
          <h3 className="font-alexandria text-[14px] font-medium uppercase tracking-wide text-text-secondary">
            Detalles
          </h3>

          <DetailRow
            icon={<Users size={13} strokeWidth={1.6} />}
            label="Responsables"
          >
            {task.assignments.length === 0 ? (
              <span className="font-inter text-sm text-text-secondary">Sin asignar</span>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {task.assignments.map((a) => (
                  <li key={a.userId} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-light font-inter text-[10px] font-semibold text-primary">
                      {(a.user.fullName ?? "?").charAt(0).toUpperCase()}
                    </span>
                    <span className="font-inter text-sm text-text-primary">
                      {fullName(a.user)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DetailRow>

          <DetailRow
            icon={<Calendar size={13} strokeWidth={1.6} />}
            label="Inicio"
          >
            <span className="font-inter text-sm text-text-primary">
              {formatDateTime(task.startDate)}
            </span>
          </DetailRow>

          <DetailRow
            icon={<Clock size={13} strokeWidth={1.6} />}
            label="Fecha límite"
          >
            <span className="font-inter text-sm text-text-primary">
              {formatDateTime(task.limitDate)}
            </span>
          </DetailRow>

          <DetailRow
            icon={<FileText size={13} strokeWidth={1.6} />}
            label="Creada por"
          >
            <span className="font-inter text-sm text-text-primary">
              {fullName(task.creator)}
            </span>
            <span className="mt-0.5 block font-inter text-[11px] text-text-secondary">
              {formatDateTime(task.createdAt)}
            </span>
          </DetailRow>

          {task.updatedAt && (
            <DetailRow
              icon={<Clock size={13} strokeWidth={1.6} />}
              label="Última actualización"
            >
              <span className="font-inter text-sm text-text-primary">
                {formatDateTime(task.updatedAt)}
              </span>
            </DetailRow>
          )}
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-text-secondary">
      {icon}
      <h3 className="font-alexandria text-[13px] font-medium uppercase tracking-wide">
        {children}
      </h3>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-text-secondary">
        {icon}
        <span className="font-inter text-[11px] font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function FullComment({ entry }: { entry: BackendTaskActivityLog }) {
  const name = entry.user ? fullName(entry.user) : "Sistema";
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light font-inter text-[12px] font-semibold text-primary">
        {(entry.user?.fullName ?? "?").charAt(0).toUpperCase()}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-inter text-[13px] font-medium text-text-primary">
            {name}
          </span>
          <span
            className="shrink-0 font-inter text-[11px] text-text-secondary"
            title={formatDateTime(entry.createdAt)}
          >
            {formatRelativeTime(entry.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words font-inter text-[13px] leading-[20px] text-text-primary">
          {entry.action}
        </p>
      </div>
    </div>
  );
}
