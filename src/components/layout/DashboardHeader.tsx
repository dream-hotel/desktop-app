import { User } from "../../types/response/AuthResponse";
import { Notification } from "../../types/response/DashboardResponse";
import NotificationsPanel from "./NotificationsPanel";

interface DashboardHeaderProps {
  user: User;
  notificationCount: number;
  notifications: Notification[];
  showNotifications: boolean;
  onToggleNotifications: () => void;
  onCloseNotifications: () => void;
  customTitle?: string;
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
  notificationCount,
  notifications,
  showNotifications,
  onToggleNotifications,
  onCloseNotifications,
  customTitle,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-start justify-between border-b border-border bg-white px-8 pb-4 pt-6">
      <div className="flex flex-col gap-[2px]">
        {customTitle ? (
          <h1 className="m-0 font-alexandria text-[28px] font-medium leading-9 text-text-primary">
            {customTitle}
          </h1>
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
            className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-black/8 bg-transparent shadow-none transition-colors hover:bg-[#f5f3f7]"
            onClick={onToggleNotifications}
            aria-label="Notificaciones"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a5 5 0 00-5 5v3l-1.3 2.6a.5.5 0 00.45.7h11.7a.5.5 0 00.45-.7L15 10V7a5 5 0 00-5-5z" stroke="#6b7280" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8 15a2 2 0 004 0" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-danger font-inter text-[10px] font-semibold text-white">
                {notificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationsPanel
              notifications={notifications}
              onClose={onCloseNotifications}
            />
          )}
        </div>
      </div>
    </header>
  );
}
