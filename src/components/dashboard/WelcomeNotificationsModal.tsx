import { useState, useRef, useCallback, useEffect } from "react";
import { Notification } from "../../types/response/DashboardResponse";

interface WelcomeNotificationsModalProps {
  notifications: Notification[];
  onDismiss: () => void;
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "alta": return "#ef4444";
    case "media": return "#3b82f6";
    case "baja": return "#22c55e";
    default: return "#6b7280";
  }
}

function getNotificationBg(priority: string): string {
  switch (priority) {
    case "alta": return "#fef2f2";
    case "media": return "#f0fdf4";
    default: return "#f9fafb";
  }
}

export default function WelcomeNotificationsModal({
  notifications,
  onDismiss,
}: WelcomeNotificationsModalProps) {
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const observerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const allRead = notifications.length > 0 && readIds.size >= notifications.length;

  const handleObserve = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = Number(entry.target.getAttribute("data-notification-id"));
          if (!isNaN(id)) {
            setReadIds((prev) => {
              const next = new Set(prev);
              next.add(id);
              return next;
            });
          }
        }
      });
    },
    []
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
  }, [handleObserve, notifications]);

  function setRef(id: number, el: HTMLDivElement | null) {
    if (el) {
      observerRefs.current.set(id, el);
    } else {
      observerRefs.current.delete(id);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-[520px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
        {/* Header */}
        <div className="flex flex-col gap-1 border-b border-border px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2a6 6 0 00-6 6v3.5l-1.5 3a.5.5 0 00.45.7h14.1a.5.5 0 00.45-.7L17 11.5V8a6 6 0 00-6-6z" stroke="#492173" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 17a2 2 0 004 0" stroke="#492173" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="m-0 font-alexandria text-xl font-medium text-text-primary">
                Notificaciones pendientes
              </h2>
              <p className="m-0 font-inter text-[13px] text-text-secondary">
                Tienes {notifications.length} notificación{notifications.length !== 1 && "es"} sin revisar
              </p>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-2 flex items-center gap-3">
            <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${notifications.length > 0 ? (readIds.size / notifications.length) * 100 : 0}%` }}
              />
            </div>
            <span className="font-inter text-xs font-medium text-text-secondary">
              {readIds.size}/{notifications.length}
            </span>
          </div>
        </div>

        {/* Scrollable list */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                ref={(el) => setRef(notification.id, el)}
                data-notification-id={notification.id}
                className={`rounded-xl border p-4 transition-all duration-300 ${
                  readIds.has(notification.id)
                    ? "border-border opacity-100"
                    : "border-primary/30 ring-1 ring-primary/10"
                }`}
                style={{ background: getNotificationBg(notification.priority) }}
              >
                <div className="mb-2 flex items-start gap-3">
                  <div
                    className="mt-[2px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: getPriorityColor(notification.priority) }}
                  >
                    {notification.actionType === "tarea" ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="m-0 font-inter text-sm font-semibold text-text-primary">
                      {notification.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-inter text-xs text-text-secondary">
                        {notification.authorName} — {notification.authorRole}
                      </span>
                      <span className="text-xs text-text-secondary">·</span>
                      <span className="flex items-center font-inter text-xs text-text-secondary">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mr-1">
                          <circle cx="6" cy="6" r="5" stroke="#6b7280" strokeWidth="1" />
                          <path d="M6 3v3l2 1" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                        {notification.date}
                      </span>
                    </div>
                  </div>
                  {readIds.has(notification.id) && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="mt-[2px] shrink-0">
                      <circle cx="9" cy="9" r="8" fill="#22c55e" />
                      <path d="M5.5 9l2 2 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="m-0 pl-10 font-inter text-[13px] leading-5 text-text-body">
                  {notification.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with button */}
        <div className="border-t border-border px-6 py-4">
          <button
            className={`w-full rounded-xl py-3 font-inter text-sm font-semibold text-white shadow-none transition-all ${
              allRead
                ? "cursor-pointer bg-primary hover:bg-primary-hover active:scale-[0.99]"
                : "cursor-not-allowed bg-gray-300"
            }`}
            disabled={!allRead}
            onClick={onDismiss}
          >
            {allRead
              ? "Entendido, continuar"
              : `Revisa todas las notificaciones (${readIds.size}/${notifications.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
