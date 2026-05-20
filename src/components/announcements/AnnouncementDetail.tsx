import { Announcement, AnnouncementType } from "../../types/models/Announcement";

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
  if (type === "task") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 7l1.5 1.5L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "article") {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 2v3h3M6 9h5M6 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M3 4h10v7H7l-3 3v-3H3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 3v12l-9-4H3a1 1 0 01-1-1V8a1 1 0 011-1h2l9-4z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M5 11v2a2 2 0 002 2h1a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
  const ref =
    announcement.type === "task"
      ? announcement.taskId
      : announcement.type === "article"
        ? announcement.articleId
        : null;

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-surface">
      <div className="flex w-full items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
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
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path
                  d="M12.5 1.5a2.1 2.1 0 00-3 0L2 9l-1 4 4-1 7.5-7.5a2.1 2.1 0 000-3z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Editar
            </button>
            <button
              onClick={onDeleteClick}
              className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-border text-danger transition-colors hover:bg-danger/10"
              aria-label="Eliminar anuncio"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4l1 9h4l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] px-8 py-7">
          <p className="font-inter text-[11.5px] uppercase tracking-wide text-text-secondary">
            {typeDescription(announcement.type)}
          </p>

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
            <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-border bg-surface px-4 py-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${
                  announcement.type === "task" ? "bg-info/10 text-info" : "bg-primary/10 text-primary"
                }`}
              >
                <TypeIcon type={announcement.type} />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="font-inter text-[11.5px] uppercase tracking-wide text-text-secondary">
                  {announcement.type === "task" ? "Tarea referenciada" : "Artículo referenciado"}
                </span>
                <span className="font-inter text-[13px] font-medium text-text-primary">
                  {announcement.type === "task"
                    ? `Tarea #${announcement.taskId ?? "—"}`
                    : `Artículo #${announcement.articleId ?? "—"}`}
                </span>
              </div>
              {ref != null && (
                <span className="font-inter text-[11px] text-text-secondary">
                  Abre la sección de {announcement.type === "task" ? "tareas" : "wiki"} para verlo
                </span>
              )}
            </div>
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
        </div>
      </div>
    </div>
  );
}
