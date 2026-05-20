import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2, CheckSquare, FileText, Megaphone } from "lucide-react";
import { Announcement, AnnouncementType } from "../../types/models/Announcement";

interface WelcomeNotificationsModalProps {
  announcements: Announcement[];
  onMarkSeen: (id: number) => void;
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
      icon: <CheckSquare size={14} strokeWidth={1.8} className="text-white" />,
    };
  }
  if (t === "article") {
    return {
      label: "Artículo",
      bg: "bg-primary/10",
      iconBg: "bg-primary",
      icon: <FileText size={14} strokeWidth={1.8} className="text-white" />,
    };
  }
  return {
    label: "Comunicado",
    bg: "bg-surface-2",
    iconBg: "bg-text-secondary",
    icon: <Megaphone size={14} strokeWidth={1.8} className="text-white" />,
  };
}

export default function WelcomeNotificationsModal({
  announcements,
  onMarkSeen,
  onMarkAllSeen,
  onDismiss,
  onOpenAnnouncement,
}: WelcomeNotificationsModalProps) {
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const observerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const allRead = announcements.length > 0 && readIds.size >= announcements.length;

  const handleObserve = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = Number(entry.target.getAttribute("data-announcement-id"));
          if (!isNaN(id)) {
            setReadIds((prev) => {
              if (prev.has(id)) return prev;
              const next = new Set(prev);
              next.add(id);
              return next;
            });
            onMarkSeen(id);
          }
        }
      });
    },
    [onMarkSeen],
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(handleObserve, {
      root: container,
      threshold: 0.8,
    });

    observerRefs.current.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [handleObserve, announcements]);

  function setRef(id: number, el: HTMLDivElement | null) {
    if (el) {
      observerRefs.current.set(id, el);
    } else {
      observerRefs.current.delete(id);
    }
  }

  const handleDismiss = () => {
    onMarkAllSeen();
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-border0 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-[520px] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-1 border-b border-border px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
              <Bell size={22} strokeWidth={1.8} className="text-primary" />
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
              onClick={handleDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-text-secondary transition-colors hover:bg-bg"
              aria-label="Omitir"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-neutral-soft">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${announcements.length > 0 ? (readIds.size / announcements.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="font-inter text-xs font-medium text-text-secondary">
              {readIds.size}/{announcements.length}
            </span>
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-3">
            {announcements.map((a) => {
              const meta = typeMeta(a.type);
              const isRead = readIds.has(a.id);
              return (
                <div
                  key={a.id}
                  ref={(el) => setRef(a.id, el)}
                  data-announcement-id={a.id}
                  className={`rounded-xl border p-4 transition-all duration-300 ${meta.bg} ${
                    isRead ? "border-border opacity-100" : "border-primary/30 ring-1 ring-primary/10"
                  }`}
                >
                  <div className="mb-2 flex items-start gap-3">
                    <div
                      className={`mt-[2px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="m-0 font-inter text-sm font-semibold text-text-primary">
                          {meta.label}
                        </h3>
                        <span className="font-inter text-[11px] text-text-secondary">
                          · {relativeTime(a.createdAt)}
                        </span>
                      </div>
                    </div>
                    {isRead && (
                      <CheckCircle2 size={18} strokeWidth={2} fill="#22c55e" className="mt-[2px] shrink-0 text-white" />
                    )}
                  </div>
                  <p className="m-0 mb-3 whitespace-pre-wrap pl-10 font-inter text-[13px] leading-5 text-text-body">
                    {previewText(a)}
                  </p>
                  <div className="pl-10">
                    <button
                      onClick={() => onOpenAnnouncement(a.id)}
                      className="border-none bg-transparent p-0 font-inter text-xs font-semibold text-primary shadow-none hover:underline"
                    >
                      Ver anuncio completo →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <button
            className={`w-full rounded-xl py-3 font-inter text-sm font-semibold text-white shadow-none transition-all ${
              allRead
                ? "cursor-pointer bg-primary hover:bg-primary-hover active:scale-[0.99]"
                : "cursor-pointer bg-text-secondary hover:bg-text-primary"
            }`}
            onClick={handleDismiss}
          >
            {allRead
              ? "Entendido, continuar"
              : `Marcar todos como leídos (${readIds.size}/${announcements.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
