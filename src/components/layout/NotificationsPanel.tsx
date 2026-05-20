import { useState } from "react";
import { CheckSquare, FileText, Megaphone, X } from "lucide-react";
import { Announcement, AnnouncementType } from "../../types/models/Announcement";

interface NotificationsPanelProps {
  announcements: Announcement[];
  loading: boolean;
  isUnread: (id: number) => boolean;
  unreadCount: number;
  onClose: () => void;
  onItemClick: (id: number) => void;
  onMarkAllSeen: () => void;
}

type FilterTab = "todos" | "nuevos";

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()]}`;
}

function previewText(a: Announcement): string {
  if (a.description && a.description.trim().length > 0) return a.description.trim();
  if (a.type === "task" && a.taskId != null) return `Anuncio sobre la tarea #${a.taskId}`;
  if (a.type === "article" && a.articleId != null) return `Anuncio sobre el artículo #${a.articleId}`;
  return "Sin descripción.";
}

function typeMeta(t: AnnouncementType): { label: string; classes: string; icon: React.ReactNode } {
  if (t === "task") {
    return {
      label: "Tarea",
      classes: "bg-info/10 text-info",
      icon: <CheckSquare size={12} strokeWidth={1.8} />,
    };
  }
  if (t === "article") {
    return {
      label: "Artículo",
      classes: "bg-primary/10 text-primary",
      icon: <FileText size={12} strokeWidth={1.8} />,
    };
  }
  return {
    label: "Comunicado",
    classes: "bg-text-secondary/10 text-text-secondary",
    icon: <Megaphone size={12} strokeWidth={1.8} />,
  };
}

export default function NotificationsPanel({
  announcements,
  loading,
  isUnread,
  unreadCount,
  onClose,
  onItemClick,
  onMarkAllSeen,
}: NotificationsPanelProps) {
  const [tab, setTab] = useState<FilterTab>(unreadCount > 0 ? "nuevos" : "todos");

  const filtered = tab === "nuevos" ? announcements.filter((a) => isUnread(a.id)) : announcements;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute top-full right-0 z-50 mt-2 flex max-h-[calc(100vh-120px)] w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
        <div className="absolute -top-2 right-[14px] h-4 w-4 rotate-45 border-t border-l border-border bg-surface" />

        <div className="relative flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="m-0 font-alexandria text-lg leading-6 font-medium text-text-primary">
              Anuncios
            </h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-danger px-2 py-[2px] font-inter text-[11px] font-semibold text-white">
                {unreadCount} nuevo{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            className="flex items-center justify-center border-none bg-transparent p-1 shadow-none hover:opacity-60"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={14} strokeWidth={1.8} className="text-text-secondary" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-1 px-5 pb-3">
          <div className="flex gap-1">
            <button
              className={`rounded-full border px-3 py-[5px] font-inter text-[12px] font-medium shadow-none transition-all ${
                tab === "nuevos"
                  ? "border-text-primary bg-text-primary text-white"
                  : "border-border-strong bg-surface text-text-secondary hover:text-text-primary"
              }`}
              onClick={() => setTab("nuevos")}
            >
              Nuevos ({unreadCount})
            </button>
            <button
              className={`rounded-full border px-3 py-[5px] font-inter text-[12px] font-medium shadow-none transition-all ${
                tab === "todos"
                  ? "border-text-primary bg-text-primary text-white"
                  : "border-border-strong bg-surface text-text-secondary hover:text-text-primary"
              }`}
              onClick={() => setTab("todos")}
            >
              Todos ({announcements.length})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllSeen}
              className="font-inter text-[11.5px] font-medium text-primary transition-colors hover:underline"
            >
              Marcar todos
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="px-2 py-8 text-center font-inter text-[12.5px] text-text-secondary">
              Cargando anuncios...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center px-2 py-10 text-center">
              <Megaphone size={34} strokeWidth={1.4} className="mb-2 text-text-secondary/40" />
              <p className="font-inter text-[12.5px] text-text-secondary">
                {tab === "nuevos"
                  ? "No tienes anuncios nuevos."
                  : "Aún no hay anuncios publicados."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((a) => {
                const meta = typeMeta(a.type);
                const unread = isUnread(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => onItemClick(a.id)}
                    className={`flex w-full flex-col gap-1.5 rounded-[12px] border px-3.5 py-3 text-left transition-colors ${
                      unread
                        ? "border-primary/30 bg-primary/[0.03] hover:bg-primary/[0.06]"
                        : "border-border bg-surface hover:bg-bg"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-inter text-[10.5px] font-medium ${meta.classes}`}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-inter text-[10.5px] text-text-secondary">
                          {relativeTime(a.createdAt)}
                        </span>
                        {unread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Nuevo" />
                        )}
                      </div>
                    </div>
                    <p className="line-clamp-2 font-inter text-[12.5px] leading-snug text-text-primary">
                      {previewText(a)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
