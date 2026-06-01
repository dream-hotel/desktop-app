import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader,
  MessageSquare,
  Paperclip,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import {
  BackendTask,
  BackendTaskActivityLog,
  fullName,
  priorityNameLabel,
  statusLabel,
} from "../../types/models/Task";
import CommentComposer from "./CommentComposer";
import CommentDetailModal from "./CommentDetailModal";
import TaskFilesGallery from "./TaskFilesGallery";
import { getFullUrl } from "../../service/apiConfig";

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

interface TaskFullViewProps {
  task: BackendTask;
  comments: BackendTaskActivityLog[];
  isLoadingComments: boolean;
  canManage: boolean;
  canDelete: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskFullView({
  task,
  comments,
  isLoadingComments,
  canManage,
  canDelete,
  onClose,
  onCommentAdded,
  onEdit,
  onDelete,
}: TaskFullViewProps) {
  const [openComment, setOpenComment] = useState<BackendTaskActivityLog | null>(null);

  const statusStyle = STATUS_STYLE[task.status.name] ?? STATUS_STYLE.pending;
  const priorityStyle = PRIORITY_STYLE[task.priority.name] ?? PRIORITY_STYLE.low;

  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [comments],
  );

  return (
    <div className="flex h-full flex-col bg-bg">
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
        <div className="ml-auto flex items-center gap-2 font-inter text-[11px] text-text-secondary">
          <span>Tarea #{task.id}</span>
          {canManage && (
            <button
              onClick={onEdit}
              className="ml-2 flex h-8 items-center gap-1.5 rounded-md border border-border-strong px-2.5 font-inter text-[11px] font-medium text-text-primary hover:bg-neutral-soft"
              title="Editar tarea"
            >
              <Pencil size={12} strokeWidth={1.8} /> Editar
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="flex h-8 items-center gap-1.5 rounded-md border border-danger/40 px-2.5 font-inter text-[11px] font-medium text-danger hover:bg-danger/10"
              title="Eliminar tarea"
            >
              <Trash2 size={12} strokeWidth={1.8} /> Eliminar
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
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
              <div className="mt-2">
                <TaskFilesGallery files={task.files} variant="full" />
              </div>
            </section>
          )}

          <section className="mt-8 flex flex-col">
            <SectionHeader icon={<MessageSquare size={14} strokeWidth={1.8} />}>
              Comentarios de relevo ({sortedComments.length})
            </SectionHeader>
            <p className="mt-1 font-inter text-[12px] leading-[18px] text-text-secondary">
              Cuando dejes una tarea a medio terminar, deja aquí una nota explicando en qué estado quedó para que otro compañero pueda retomarla. Haz clic sobre un comentario para verlo completo.
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {isLoadingComments ? (
                <p className="font-inter text-sm text-text-secondary">Cargando comentarios...</p>
              ) : sortedComments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-center font-inter text-[12px] text-text-secondary">
                  Aún no hay comentarios para esta tarea.
                </div>
              ) : (
                sortedComments.map((entry) => (
                  <FullComment
                    key={entry.id}
                    entry={entry}
                    onClick={() => setOpenComment(entry)}
                  />
                ))
              )}
            </div>

            <div className="mt-4">
              <CommentComposer
                taskId={task.id}
                onAdded={onCommentAdded}
                variant="full"
              />
            </div>
          </section>
        </div>

        <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-border bg-surface px-5 py-6">
          <h3 className="font-alexandria text-[14px] font-medium uppercase tracking-wide text-text-secondary">
            Detalles
          </h3>

          <DetailRow icon={<Users size={13} strokeWidth={1.6} />} label="Responsables">
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

          <DetailRow icon={<Calendar size={13} strokeWidth={1.6} />} label="Inicio">
            <span className="font-inter text-sm text-text-primary">
              {formatDateTime(task.startDate)}
            </span>
          </DetailRow>

          <DetailRow icon={<Clock size={13} strokeWidth={1.6} />} label="Fecha límite">
            <span className="font-inter text-sm text-text-primary">
              {formatDateTime(task.limitDate)}
            </span>
          </DetailRow>

          <DetailRow icon={<FileText size={13} strokeWidth={1.6} />} label="Creada por">
            <span className="font-inter text-sm text-text-primary">
              {fullName(task.creator)}
            </span>
            <span className="mt-0.5 block font-inter text-[11px] text-text-secondary">
              {formatDateTime(task.createdAt)}
            </span>
          </DetailRow>

          {task.updatedAt && (
            <DetailRow icon={<Clock size={13} strokeWidth={1.6} />} label="Última actualización">
              <span className="font-inter text-sm text-text-primary">
                {formatDateTime(task.updatedAt)}
              </span>
            </DetailRow>
          )}
        </aside>
      </div>

      {openComment && (
        <CommentDetailModal
          comment={openComment}
          onClose={() => setOpenComment(null)}
        />
      )}
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

function FullComment({
  entry,
  onClick,
}: {
  entry: BackendTaskActivityLog;
  onClick: () => void;
}) {
  const name = entry.user ? fullName(entry.user) : "Sistema";
  const images = entry.imageUrls ?? [];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-primary/40"
    >
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
        <p className="line-clamp-3 whitespace-pre-wrap break-words font-inter text-[13px] leading-[20px] text-text-primary">
          {entry.action}
        </p>

        {images.length > 0 && (
          <div className="mt-1 flex items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {images.slice(0, 4).map((url) => (
                <img
                  key={url}
                  src={getFullUrl(url)}
                  alt=""
                  className="h-10 w-10 rounded-md border border-border object-cover"
                />
              ))}
              {images.length > 4 && (
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-neutral-soft font-inter text-[10px] text-text-secondary">
                  +{images.length - 4}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 font-inter text-[11px] text-text-secondary">
              <ImageIcon size={11} strokeWidth={1.6} />
              {images.length} imagen{images.length === 1 ? "" : "es"}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
