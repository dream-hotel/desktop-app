import { Announcement, AnnouncementType } from "../../types/models/Announcement";

interface AnnouncementsListProps {
  announcements: Announcement[];
  selectedId: number | null;
  loading: boolean;
  isAdmin: boolean;
  typeFilter: AnnouncementType | "all";
  totalCount: number;
  onSelectType: (t: AnnouncementType | "all") => void;
  onSelectAnnouncement: (id: number) => void;
  onCreateClick: () => void;
}

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return formatDate(iso);
}

function isExpired(visibleUntil: string | null): boolean {
  if (!visibleUntil) return false;
  return new Date(visibleUntil).getTime() < Date.now();
}

function previewText(description: string | null, type: AnnouncementType, ref: number | null): string {
  if (description && description.trim().length > 0) return description.trim();
  if (type === "task" && ref != null) return `Referencia a la tarea #${ref}`;
  if (type === "article" && ref != null) return `Referencia al artículo #${ref}`;
  return "Sin descripción.";
}

function TypeIcon({ type }: { type: AnnouncementType }) {
  if (type === "task") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 7l1.5 1.5L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "article") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M4 2h6l3 3v9H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 2v3h3M6 9h5M6 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 4h10v7H7l-3 3v-3H3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FILTERS: { id: AnnouncementType | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "text", label: "Texto" },
  { id: "task", label: "Tareas" },
  { id: "article", label: "Artículos" },
];

export default function AnnouncementsList({
  announcements,
  selectedId,
  loading,
  isAdmin,
  typeFilter,
  totalCount,
  onSelectType,
  onSelectAnnouncement,
  onCreateClick,
}: AnnouncementsListProps) {
  return (
    <div className="flex h-full w-[360px] flex-col border-r border-border bg-white">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="font-alexandria text-[15px] font-medium text-text-primary">
              Anuncios
            </h2>
            <span className="font-inter text-[11px] text-text-secondary">
              {totalCount} {totalCount === 1 ? "anuncio" : "anuncios"}
            </span>
          </div>
          {isAdmin && (
            <button
              onClick={onCreateClick}
              className="flex h-7 items-center justify-center gap-1 rounded-[8px] bg-primary px-2.5 font-inter text-[11.5px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Crear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelectType(f.id)}
              className={`rounded-full px-2.5 py-1 font-inter text-[11px] font-medium transition-colors ${
                typeFilter === f.id
                  ? "bg-primary text-white"
                  : "bg-bg text-text-secondary hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center font-inter text-[13px] text-text-secondary">
            Cargando anuncios...
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="mb-2 text-text-secondary/40">
              <path
                d="M14 3v12l-9-4H3a1 1 0 01-1-1V8a1 1 0 011-1h2l9-4z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="font-inter text-[13px] font-medium text-text-primary">
              Sin anuncios
            </h3>
            <p className="mt-1 font-inter text-[12px] text-text-secondary">
              {typeFilter === "all"
                ? "Aún no se han publicado anuncios."
                : "No hay anuncios de este tipo."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {announcements.map((a) => {
              const isSelected = selectedId === a.id;
              const expired = isExpired(a.visibleUntil);
              const ref = a.taskId ?? a.articleId;
              return (
                <li key={a.id}>
                  <button
                    onClick={() => onSelectAnnouncement(a.id)}
                    className={`flex w-full flex-col gap-1.5 border-b border-border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-l-[3px] border-l-primary bg-primary/5"
                        : "border-l-[3px] border-l-transparent hover:bg-bg"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-inter text-[10.5px] font-medium ${
                          a.type === "task"
                            ? "bg-info/10 text-info"
                            : a.type === "article"
                              ? "bg-primary/10 text-primary"
                              : "bg-text-secondary/10 text-text-secondary"
                        }`}
                      >
                        <TypeIcon type={a.type} />
                        {a.type === "task" ? "Tarea" : a.type === "article" ? "Artículo" : "Texto"}
                      </span>
                      <span className="shrink-0 font-inter text-[10.5px] text-text-secondary">
                        {relativeTime(a.createdAt)}
                      </span>
                    </div>

                    <p className="line-clamp-2 font-inter text-[12.5px] leading-snug text-text-primary">
                      {previewText(a.description, a.type, ref)}
                    </p>

                    <div className="flex items-center gap-2 font-inter text-[10.5px] text-text-secondary">
                      {a.visibleUntil ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${
                            expired
                              ? "bg-danger/10 text-danger"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                          </svg>
                          {expired ? "Vencido" : `Hasta ${formatDate(a.visibleUntil)}`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-success">
                          Siempre visible
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
