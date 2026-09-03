import { ArrowUpRight, CheckSquare, ChevronRight, FileText, Megaphone } from "lucide-react";
import { Announcement, priorityLabel, priorityTone } from "../../types/models/Announcement";

function formatRelative(iso: string | null): string {
  if (!iso) return "";
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

interface RecentAnnouncementsCardProps {
  announcements: Announcement[];
  unreadCount: number;
  isUnread: (id: number) => boolean;
  onOpen: (id: number) => void;
  onOpenAll: () => void;
}

export default function RecentAnnouncementsCard({
  announcements,
  unreadCount,
  isUnread,
  onOpen,
  onOpenAll,
}: RecentAnnouncementsCardProps) {
  return (
    <section className="flex min-w-0 flex-col pt-7">
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone size={16} strokeWidth={1.7} className="text-primary" />
            <h2 className="m-0 font-inter text-[15px] font-semibold leading-6 text-text-primary">
              Comunicaciones
            </h2>
          </div>
          <p className="mt-0.5 font-inter text-[10.5px] text-text-secondary">
            {unreadCount > 0
              ? `${unreadCount} ${unreadCount === 1 ? "pendiente de lectura" : "pendientes de lectura"}`
              : "No tienes anuncios pendientes"}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 font-inter text-[11px] font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
        >
          Ver todo
          <ArrowUpRight size={12} strokeWidth={2} />
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="flex min-h-28 flex-col items-center justify-center text-center">
          <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-soft text-text-secondary">
            <Megaphone size={17} strokeWidth={1.6} />
          </span>
          <p className="font-inter text-[11px] text-text-secondary">No hay anuncios para mostrar.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {announcements.map((a) => {
            const tone = priorityTone(a.priority.name);
            const unread = isUnread(a.id);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onOpen(a.id)}
                  className="group -mx-2 flex w-[calc(100%+1rem)] items-start gap-2.5 border-l-2 border-l-transparent px-2.5 py-3 text-left transition-colors hover:border-l-primary hover:bg-primary-light/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-inset"
                >
                  <span className={`relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tone.bg} ${tone.text}`}>
                    {a.type === "task" ? (
                      <CheckSquare size={13} strokeWidth={1.8} />
                    ) : a.type === "article" ? (
                      <FileText size={13} strokeWidth={1.8} />
                    ) : (
                      <Megaphone size={13} strokeWidth={1.8} />
                    )}
                    {unread && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-surface bg-primary" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-inter text-[12px] font-semibold text-text-primary">
                        {a.title}
                      </span>
                      <span className={`shrink-0 font-inter text-[9.5px] font-medium ${tone.text}`}>
                        {priorityLabel(a.priority.name)}
                      </span>
                    </div>
                    {a.description && (
                      <p className="mt-0.5 line-clamp-1 font-inter text-[10.5px] leading-4 text-text-secondary">
                        {a.description}
                      </p>
                    )}
                    <span className="mt-0.5 block font-inter text-[9.5px] text-text-secondary">
                      {formatRelative(a.createdAt)}
                    </span>
                  </div>
                  <ChevronRight
                    aria-hidden="true"
                    size={13}
                    strokeWidth={1.8}
                    className="mt-2 shrink-0 text-text-secondary opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-70 group-focus-visible:opacity-70"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
