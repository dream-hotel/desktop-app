import { useState } from "react";
import { Notification } from "../../types/response/DashboardResponse";

interface NotificationsPanelProps {
  notifications: Notification[];
  onClose: () => void;
}

type FilterTab = "todos" | "pendientes";

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
    default: return "#ffffff";
  }
}

export default function NotificationsPanel({
  notifications,
  onClose,
}: NotificationsPanelProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("pendientes");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(
    new Set(notifications.map((n) => n.id))
  );

  const pendingCount = notifications.filter((n) => n.status === "pendiente").length;

  const filtered =
    activeTab === "pendientes"
      ? notifications.filter((n) => n.status === "pendiente")
      : notifications;

  function toggleExpanded(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-100 flex justify-center pt-10" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-[420px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-[10px]">
            <h2 className="m-0 font-alexandria text-[22px] leading-7 font-medium text-text-primary">
              Anuncios
            </h2>
            <span className="rounded-xl bg-success-light px-[10px] py-[3px] font-inter text-[11px] font-semibold text-white">
              {pendingCount} nuevos
            </span>
          </div>
          <button
            className="flex items-center justify-center border-none bg-transparent p-1 shadow-none hover:opacity-60"
            onClick={onClose}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-3">
          <button
            className={`rounded-full border px-4 py-[6px] font-inter text-[13px] font-medium shadow-none transition-all ${
              activeTab === "todos"
                ? "border-text-primary bg-text-primary text-white"
                : "border-black/10 bg-white text-text-secondary"
            }`}
            onClick={() => setActiveTab("todos")}
          >
            Todos
          </button>
          <button
            className={`rounded-full border px-4 py-[6px] font-inter text-[13px] font-medium shadow-none transition-all ${
              activeTab === "pendientes"
                ? "border-text-primary bg-text-primary text-white"
                : "border-black/10 bg-white text-text-secondary"
            }`}
            onClick={() => setActiveTab("pendientes")}
          >
            Pendientes ({pendingCount})
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 px-5 pb-3">
          {[
            { label: "Alta", color: "#ef4444" },
            { label: "Media", color: "#3b82f6" },
            { label: "Baja", color: "#22c55e" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-[6px] font-inter text-xs text-text-secondary">
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>

        {/* List */}
        <div className="flex flex-1 flex-col gap-[10px] overflow-y-auto px-5 pb-5">
          {filtered.map((notification) => (
            <div
              key={notification.id}
              className="overflow-hidden rounded-xl border border-border"
              style={{ background: getNotificationBg(notification.priority) }}
            >
              {/* Card Header */}
              <div
                className="flex cursor-pointer items-center justify-between gap-3 px-4 py-[14px]"
                onClick={() => toggleExpanded(notification.id)}
              >
                <div className="flex min-w-0 flex-1 items-center gap-[10px]">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
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
                  <span className="font-inter text-[13px] leading-[18px] font-semibold text-text-primary">
                    {notification.title}
                  </span>
                </div>
                <button className="flex items-center border-none bg-transparent p-1 shadow-none">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="transition-transform duration-200"
                    style={{
                      transform: expandedIds.has(notification.id) ? "rotate(180deg)" : "none",
                    }}
                  >
                    <path d="M2 4l4 4 4-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Card Body */}
              {expandedIds.has(notification.id) && (
                <div className="px-4 pb-[14px]">
                  <div className="mb-[10px] flex flex-wrap items-center gap-2">
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
                  <p className="m-0 mb-3 font-inter text-[13px] leading-5 text-text-body">
                    {notification.description}
                  </p>
                  <button className="border-none bg-transparent p-0 font-inter text-xs font-semibold text-success shadow-none hover:underline">
                    {notification.actionLabel} →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
