import { Bell } from "lucide-react";
import { User } from "../../types/response/AuthResponse";
import { Announcement } from "../../types/models/Announcement";
import NotificationsPanel from "./NotificationsPanel";

interface DashboardHeaderProps {
  user: User;
  announcements: Announcement[];
  bellLoading: boolean;
  unreadCount: number;
  isUnread: (id: number) => boolean;
  showNotifications: boolean;
  onToggleNotifications: () => void;
  onCloseNotifications: () => void;
  onAnnouncementClick: (id: number) => void;
  onMarkAllSeen: () => void;
  customTitle?: string;
  customSubtitle?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

function getFormattedDate(): string {
  const now = new Date();
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${days[now.getDay()]} ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
}

function getTurno(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Turno mañana";
  if (hour < 20) return "Turno tarde";
  return "Turno noche";
}

export default function DashboardHeader({
  user,
  announcements,
  bellLoading,
  unreadCount,
  isUnread,
  showNotifications,
  onToggleNotifications,
  onCloseNotifications,
  onAnnouncementClick,
  onMarkAllSeen,
  customTitle,
  customSubtitle,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-start justify-between border-b border-border bg-surface px-8 pb-4 pt-6">
      <div className="flex flex-col gap-[2px]">
        {customTitle ? (
          <>
            <h1 className="m-0 font-alexandria text-[28px] font-medium leading-9 text-text-primary">
              {customTitle}
            </h1>
            {customSubtitle && (
              <p className="m-0 font-inter text-[13px] leading-[19.5px] text-text-secondary">
                {customSubtitle}
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="m-0 font-alexandria text-[28px] font-medium leading-9 text-text-primary">
              {getGreeting()}, {user.fullName.split(" ")[0]}
            </h1>
            <p className="m-0 font-inter text-[13px] leading-[19.5px] text-text-secondary">
              {getFormattedDate()} - {getTurno()}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-transparent shadow-none transition-colors hover:bg-surface-hover"
            onClick={onToggleNotifications}
            aria-label="Anuncios"
          >
            <Bell size={19} strokeWidth={1.6} className="text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-danger px-1 font-inter text-[10px] font-semibold text-on-accent">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationsPanel
              announcements={announcements}
              loading={bellLoading}
              isUnread={isUnread}
              unreadCount={unreadCount}
              onClose={onCloseNotifications}
              onItemClick={onAnnouncementClick}
              onMarkAllSeen={onMarkAllSeen}
            />
          )}
        </div>
      </div>
    </header>
  );
}
