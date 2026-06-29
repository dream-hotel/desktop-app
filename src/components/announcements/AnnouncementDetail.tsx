import { useEffect, useState } from "react";
import { ArrowUpRight, CheckSquare, FileText, Megaphone, Pencil, Trash2 } from "lucide-react";
import {
  Announcement,
  AnnouncementType,
  priorityLabel,
  priorityTone,
} from "../../types/models/Announcement";
import { getTask } from "../../service/taskService";
import { getArticle } from "../../service/wikiService";
import { requestNavigate } from "../../hooks/useAnnouncementBell";

interface AnnouncementDetailProps {
  announcement: Announcement | null;
  loading: boolean;
  isAdmin: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const MONTHS_ES_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} de ${MONTHS_ES_LONG[d.getMonth()]} de ${d.getFullYear()}, ${String(
    d.getHours(),
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function isExpired(visibleUntil: string | null): boolean {
  if (!visibleUntil) return false;
  return new Date(visibleUntil).getTime() < Date.now();
}

function typeLabel(t: AnnouncementType): string {
  if (t === "task") return "Tarea";
  if (t === "article") return "Artículo";
  return "Comunicado";
}

function typeDescription(t: AnnouncementType): string {
  if (t === "task") return "Anuncio vinculado a una tarea";
  if (t === "article") return "Anuncio vinculado a un artículo de la wiki";
  return "Comunicado libre para el equipo";
}

function TypeIcon({ type, size = 18 }: { type: AnnouncementType; size?: number }) {
  if (type === "task") return <CheckSquare size={size} strokeWidth={1.7} />;
  if (type === "article") return <FileText size={size} strokeWidth={1.7} />;
  return <Megaphone size={size} strokeWidth={1.7} />;
}

export default function AnnouncementDetail({
  announcement,
  loading,
  isAdmin,
  onEditClick,
  onDeleteClick,
}: AnnouncementDetailProps) {
  if (loading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-surface font-inter text-[13px] text-text-secondary">
        Cargando anuncio...
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-surface">
        <div className="flex max-w-sm flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Megaphone size={22} strokeWidth={1.6} />
          </div>
          <h3 className="font-alexandria text-[17px] font-medium text-text-primary">
            Ningún anuncio seleccionado
          </h3>
          <p className="mt-1 font-inter text-[13px] text-text-secondary">
            Selecciona un anuncio de la lista para ver sus detalles.
          </p>
        </div>
      </div>
    );
  }

  const expired = isExpired(announcement.visibleUntil);

  const referencedId =
    announcement.type === "task"
      ? announcement.taskId
      : announcement.type === "article"
        ? announcement.articleId
        : null;

  return (
    <AnnouncementDetailInner
      announcement={announcement}
      referencedId={referencedId}
      expired={expired}
      isAdmin={isAdmin}
      onEditClick={onEditClick}
      onDeleteClick={onDeleteClick}
    />
  );
}

interface AnnouncementDetailInnerProps {
  announcement: Announcement;
  referencedId: number | null;
  expired: boolean;
  isAdmin: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

type RefStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "loaded"; title: string; subtitle?: string }
  | { state: "error"; message: string };

function AnnouncementDetailInner({
  announcement,
  referencedId,
  expired,
  isAdmin,
  onEditClick,
  onDeleteClick,
}: AnnouncementDetailInnerProps) {
  const [refStatus, setRefStatus] = useState<RefStatus>({ state: "idle" });

  useEffect(() => {
    if (referencedId == null || announcement.type === "text") {
      setRefStatus({ state: "idle" });
      return;
    }
    let cancelled = false;
    setRefStatus({ state: "loading" });
    const load = async () => {
      try {
        if (announcement.type === "task") {
          const task = await getTask(referencedId);
          if (!cancelled) {
            setRefStatus({
              state: "loaded",
              title: task.title,
              subtitle: task.status?.name ? `Estado: ${task.status.name}` : undefined,
            });
          }
        } else if (announcement.type === "article") {
          const article = await getArticle(referencedId);
          if (!cancelled) {
            setRefStatus({
              state: "loaded",
              title: article.title,
              subtitle: article.categoryName ?? undefined,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setRefStatus({
            state: "error",
            message:
              err instanceof Error
                ? err.message
                : announcement.type === "task"
                  ? "No se pudo cargar la tarea referenciada."
                  : "No se pudo cargar el artículo referenciado.",
          });
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [referencedId, announcement.type]);

  const handleNavigate = () => {
    if (announcement.type === "task" && announcement.taskId != null) {
      requestNavigate({ section: "tareas", taskId: announcement.taskId });
    } else if (announcement.type === "article" && announcement.articleId != null) {
      requestNavigate({ section: "wiki", articleId: announcement.articleId });
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-surface">
      <div className="flex w-full items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-inter text-[11.5px] font-medium ${
              announcement.type === "task"
                ? "bg-info/10 text-info"
                : announcement.type === "article"
                  ? "bg-primary/10 text-primary"
                  : "bg-text-secondary/10 text-text-secondary"
            }`}
          >
            <TypeIcon type={announcement.type} size={13} />
            {typeLabel(announcement.type)}
          </span>
          {(() => {
            const pTone = priorityTone(announcement.priority.name);
            return (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-inter text-[11.5px] font-medium ${pTone.bg} ${pTone.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${pTone.dot}`} />
                {priorityLabel(announcement.priority.name)}
              </span>
            );
          })()}
          <span className="font-inter text-[11px] text-text-secondary">
            ID #{announcement.id}
          </span>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEditClick}
              className="flex h-7 items-center gap-1.5 rounded-[8px] border border-primary/30 bg-primary/5 px-2.5 font-inter text-[11.5px] font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Pencil size={12} strokeWidth={1.8} />
              Editar
            </button>
            <button
              onClick={onDeleteClick}
              className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-border text-danger transition-colors hover:bg-danger/10"
              aria-label="Eliminar anuncio"
            >
              <Trash2 size={13} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] px-8 py-7">
          <p className="font-inter text-[11.5px] uppercase tracking-wide text-text-secondary">
            {typeDescription(announcement.type)}
          </p>

          <h1 className="mt-2 font-alexandria text-[26px] font-medium leading-tight text-text-primary">
            {announcement.title}
          </h1>

          <div className="mt-4 rounded-[14px] border border-border bg-bg p-5">
            {announcement.description && announcement.description.trim().length > 0 ? (
              <p className="whitespace-pre-wrap font-inter text-[14px] leading-relaxed text-text-primary">
                {announcement.description}
              </p>
            ) : (
              <p className="font-inter text-[13px] italic text-text-secondary">
                Este anuncio no tiene descripción.
              </p>
            )}
          </div>

          {(announcement.type === "task" || announcement.type === "article") && (
            <button
              type="button"
              onClick={handleNavigate}
              disabled={referencedId == null || refStatus.state === "error"}
              className="group mt-4 flex w-full items-center gap-3 rounded-[12px] border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:bg-surface"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                  announcement.type === "task" ? "bg-info/10 text-info" : "bg-primary/10 text-primary"
                }`}
              >
                <TypeIcon type={announcement.type} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-inter text-[11.5px] uppercase tracking-wide text-text-secondary">
                  {announcement.type === "task" ? "Tarea referenciada" : "Artículo referenciado"}
                </span>
                {refStatus.state === "loaded" ? (
                  <>
                    <span className="truncate font-inter text-[13px] font-medium text-text-primary">
                      {refStatus.title}
                    </span>
                    {refStatus.subtitle && (
                      <span className="truncate font-inter text-[11px] text-text-secondary">
                        {refStatus.subtitle}
                      </span>
                    )}
                  </>
                ) : refStatus.state === "loading" ? (
                  <span className="font-inter text-[12.5px] italic text-text-secondary">
                    Cargando título...
                  </span>
                ) : refStatus.state === "error" ? (
                  <span className="font-inter text-[12.5px] italic text-danger">
                    {refStatus.message}
                  </span>
                ) : (
                  <span className="font-inter text-[12.5px] italic text-text-secondary">
                    Sin referencia disponible.
                  </span>
                )}
              </div>
              {referencedId != null && refStatus.state !== "error" && (
                <span className="flex shrink-0 items-center gap-1 font-inter text-[11.5px] font-medium text-primary opacity-70 transition-opacity group-hover:opacity-100">
                  Abrir
                  <ArrowUpRight size={14} strokeWidth={1.8} />
                </span>
              )}
            </button>
          )}

          <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-border pt-5 font-inter text-[12.5px] sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <dt className="text-[10.5px] uppercase tracking-wide text-text-secondary">
                Publicado
              </dt>
              <dd className="text-text-primary">{formatDateLong(announcement.createdAt)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[10.5px] uppercase tracking-wide text-text-secondary">
                Visibilidad
              </dt>
              <dd>
                {announcement.visibleUntil ? (
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 font-inter text-[11px] font-medium ${
                      expired ? "bg-danger/10 text-danger" : "bg-warning/15 text-warning"
                    }`}
                  >
                    {expired ? "Vencido" : "Visible hasta"}
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-success/10 px-2 py-0.5 font-inter text-[11px] font-medium text-success">
                    Siempre visible
                  </span>
                )}
              </dd>
            </div>
            {announcement.visibleUntil && (
              <div className="flex flex-col gap-0.5">
                <dt className="text-[10.5px] uppercase tracking-wide text-text-secondary">
                  Vencimiento
                </dt>
                <dd className="text-text-primary">{formatDateLong(announcement.visibleUntil)}</dd>
              </div>
            )}
          </dl>

          {isAdmin && announcement.views && (
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="font-alexandria text-[13px] font-medium uppercase tracking-wide text-text-secondary">
                Leído por ({announcement.views.length})
              </h3>
              {announcement.views.length === 0 ? (
                <p className="mt-2 font-inter text-xs text-text-secondary">
                  Nadie ha visto este comunicado todavía.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border/40 pl-0 list-none">
                  {announcement.views.map((view) => (
                    <li key={view.userId} className="flex justify-between items-center py-2 font-inter text-xs text-text-primary">
                      <span className="font-medium">
                        {view.user.fullName} {view.user.lastName || ""}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        {formatDateLong(view.viewedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
