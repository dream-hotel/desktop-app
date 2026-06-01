import { useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Maximize2,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  Trash2,
  Users,
  X,
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
  canManage: boolean;
  canDelete: boolean;
  onCommentAdded: () => void;
  onExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function TaskDetail({
  task,
  comments,
  isLoadingComments,
  canManage,
  canDelete,
  onCommentAdded,
  onExpand,
  onEdit,
  onDelete,
  onClose,
}: TaskDetailProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openComment, setOpenComment] = useState<BackendTaskActivityLog | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusStyle = STATUS_STYLE[task.status.name] ?? STATUS_STYLE.pending;

  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [comments],
  );

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="border-b border-border p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-full text-text-secondary hover:bg-neutral-soft hover:text-text-primary transition-colors shrink-0"
              title="Cerrar detalles"
            >
              <X size={16} strokeWidth={2} />
            </button>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
            >
              {statusLabel(task.status.name)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onExpand}
              className="flex h-[26px] items-center gap-1 rounded-md border border-border-strong px-2 font-inter text-[11px] font-medium text-text-secondary hover:bg-neutral-soft"
              title="Ver pantalla completa"
            >
              <Maximize2 size={12} strokeWidth={1.8} />
              Ver completo
            </button>
            {(canManage || canDelete) && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-[26px] w-[26px] items-center justify-center rounded text-text-secondary hover:bg-neutral-soft"
                  title="Más acciones"
                >
                  <MoreVertical size={16} strokeWidth={1.8} />
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-md border border-border bg-surface shadow-md"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    {canManage && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left font-inter text-[12px] text-text-primary hover:bg-neutral-soft"
                      >
                        <Pencil size={12} strokeWidth={1.8} /> Editar tarea
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left font-inter text-[12px] text-danger hover:bg-danger/10"
                      >
                        <Trash2 size={12} strokeWidth={1.8} /> Eliminar tarea
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
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

      {/* Files (read-only) */}
      {task.files.length > 0 && (
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Paperclip size={13} strokeWidth={1.6} className="text-text-secondary" />
            <span className="font-inter text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              Archivos ({task.files.length})
            </span>
          </div>
          <div className="mt-2">
            <TaskFilesGallery files={task.files} variant="compact" />
          </div>
        </div>
      )}

      {/* Comments thread */}
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
          Haz clic sobre un comentario para verlo completo. Puedes adjuntar fotos al escribir uno nuevo.
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
                <CommentBubble
                  key={entry.id}
                  entry={entry}
                  onClick={() => setOpenComment(entry)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 shrink-0 border-t border-border pt-3 pb-4">
          <CommentComposer taskId={task.id} onAdded={onCommentAdded} />
        </div>
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

function CommentBubble({
  entry,
  onClick,
}: {
  entry: BackendTaskActivityLog;
  onClick: () => void;
}) {
  const images = entry.imageUrls ?? [];
  const hasImages = images.length > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full gap-3 text-left transition-colors hover:opacity-90"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light font-inter text-[11px] font-semibold text-primary">
        {(entry.user?.fullName ?? "?").charAt(0).toUpperCase()}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg border border-[rgba(0,0,0,0.06)] bg-bg p-2.5 hover:border-primary/40">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-inter text-[12px] font-medium text-text-primary">
            {authorName(entry)}
          </span>
          <span className="shrink-0 font-inter text-[10px] text-text-secondary">
            {formatRelativeTime(entry.createdAt)}
          </span>
        </div>
        <p className="line-clamp-3 whitespace-pre-wrap break-words font-inter text-[12px] leading-[18px] text-text-primary">
          {entry.action}
        </p>

        {hasImages && (
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex -space-x-2">
              {images.slice(0, 3).map((url) => (
                <img
                  key={url}
                  src={getFullUrl(url)}
                  alt=""
                  className="h-7 w-7 rounded-md border-2 border-bg object-cover"
                />
              ))}
            </div>
            <span className="flex items-center gap-1 font-inter text-[10px] text-text-secondary">
              <ImageIcon size={10} strokeWidth={1.6} />
              {images.length} imagen{images.length === 1 ? "" : "es"}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
