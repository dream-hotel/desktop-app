import { CheckSquare, FileText, Megaphone } from "lucide-react";
import { Announcement, AnnouncementType } from "../../types/models/Announcement";
import dreamLogo from "../../assets/dream_logo.svg";

interface WelcomeNotificationsModalProps {
  announcements: Announcement[];
  onMarkAllSeen: () => void;
  onDismiss: () => void;
  onOpenAnnouncement: (id: number) => void;
}

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

function typeMeta(t: AnnouncementType): { label: string; bg: string; iconBg: string; icon: React.ReactNode } {
  if (t === "task") {
    return {
      label: "Tarea",
      bg: "bg-info/10",
      iconBg: "bg-info",
      icon: <CheckSquare size={14} strokeWidth={1.8} className="text-on-accent" />,
    };
  }
  if (t === "article") {
    return {
      label: "Artículo",
      bg: "bg-primary/10",
      iconBg: "bg-primary",
      icon: <FileText size={14} strokeWidth={1.8} className="text-on-accent" />,
    };
  }
  return {
    label: "Comunicado",
    bg: "bg-surface-2",
    iconBg: "bg-text-secondary",
    icon: <Megaphone size={14} strokeWidth={1.8} className="text-on-accent" />,
  };
}

export default function WelcomeNotificationsModal({
  announcements,
  onMarkAllSeen,
  onDismiss,
  onOpenAnnouncement,
}: WelcomeNotificationsModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-border0 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-[520px] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-1 border-b border-border px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
              <img src={dreamLogo} alt="" className="h-7 w-7" />
            </div>
            <div className="flex flex-1 flex-col">
              <h2 className="m-0 font-alexandria text-xl font-medium text-text-primary">
                Anuncios nuevos
              </h2>
              <p className="m-0 font-inter text-[13px] text-text-secondary">
                Tienes {announcements.length} anuncio{announcements.length !== 1 && "s"} sin revisar
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-text-secondary transition-colors hover:bg-bg cursor-pointer"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-3">
            {announcements.map((a) => {
              const meta = typeMeta(a.type);
              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-4 transition-all duration-300 ${meta.bg} border-primary/20 hover:border-primary/40`}
                >
                  <div className="mb-2 flex items-start gap-3">
                    <div
                      className={`mt-[2px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-inter text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                          {meta.label}
                        </span>
                        <span className="font-inter text-[11px] text-text-secondary">
                          · {relativeTime(a.createdAt)}
                        </span>
                      </div>
                      <h3 className="m-0 mt-0.5 font-inter text-sm font-semibold leading-tight text-text-primary">
                        {a.title}
                      </h3>
                    </div>
                  </div>
                  <p className="m-0 mb-3 whitespace-pre-wrap pl-10 font-inter text-[13px] leading-5 text-text-body">
                    {previewText(a)}
                  </p>
                  <div className="pl-10">
                    <button
                      onClick={() => onOpenAnnouncement(a.id)}
                      className="border-none bg-transparent p-0 font-inter text-xs font-semibold text-primary shadow-none hover:underline cursor-pointer"
                    >
                      Ver anuncio completo →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 border-t border-border px-6 py-4">
          <button
            className="flex-1 rounded-xl py-3 border border-border bg-transparent font-inter text-sm font-semibold text-text-secondary hover:bg-neutral-soft transition-all cursor-pointer text-center"
            onClick={onDismiss}
          >
            Ver más tarde
          </button>
          <button
            className="flex-1 rounded-xl py-3 bg-primary hover:bg-primary-hover font-inter text-sm font-semibold text-on-accent shadow-none transition-all cursor-pointer text-center"
            onClick={() => {
              onMarkAllSeen();
              onDismiss();
            }}
          >
            Marcar todos como leídos
          </button>
        </div>
      </div>
    </div>
  );
}
