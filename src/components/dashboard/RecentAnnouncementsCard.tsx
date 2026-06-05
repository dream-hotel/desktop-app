import { ArrowUpRight, Megaphone } from "lucide-react";
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
    <div className="flex w-[360px] shrink-0 flex-col rounded-2xl border border-border bg-surface px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone size={16} strokeWidth={1.7} className="text-primary" />
          <h2 className="m-0 font-inter text-lg font-semibold leading-6 text-text-primary">
            Anuncios recientes
          </h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-[1px] font-inter text-[10px] font-semibold text-on-accent">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onOpenAll}
          className="flex items-center gap-1 font-inter text-[12px] font-medium text-primary hover:underline"
        >
          Ver todos
          <ArrowUpRight size={12} strokeWidth={2} />
        </button>
      </div>

      {announcements.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-center font-inter text-sm text-text-secondary">
          No hay anuncios para mostrar.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {announcements.map((a) => {
            const tone = priorityTone(a.priority.name);
            const unread = isUnread(a.id);
            return (
              <li key={a.id}>
                <button
                  onClick={() => onOpen(a.id)}
                  className="flex w-[calc(100%+1rem)] flex-col gap-1 -mx-2 rounded-xl px-2 py-3 text-left transition-colors hover:bg-surface-hover"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {unread && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                      <span className="truncate font-inter text-[13px] font-medium text-text-primary">
                        {a.title}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-[1px] font-inter text-[10px] font-medium ${tone.bg} ${tone.text}`}
                    >
                      {priorityLabel(a.priority.name)}
                    </span>
                  </div>
                  {a.description && (
                    <p className="line-clamp-2 font-inter text-[11px] leading-[15px] text-text-secondary">
                      {a.description}
                    </p>
                  )}
                  <span className="font-inter text-[10px] text-text-secondary">
                    {formatRelative(a.createdAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
