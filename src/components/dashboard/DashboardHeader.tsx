import { User } from "../../types/response/AuthResponse";

interface DashboardHeaderProps {
  user: User;
  notificationCount: number;
  onToggleNotifications: () => void;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardHeader({
  user,
  notificationCount,
  onToggleNotifications,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-start justify-between px-8 pt-6 pb-4">
      <div className="flex flex-col gap-[2px]">
        <h1 className="m-0 font-alexandria text-[28px] leading-9 font-medium text-text-primary">
          {getGreeting()}, {user.fullName.split(" ")[0]}
        </h1>
        <p className="m-0 font-inter text-[13px] leading-[19.5px] text-text-secondary">
          {getFormattedDate()} - {getTurno()}
        </p>
      </div>

      <div className="flex items-center gap-4">
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

        <div className="flex items-center gap-[10px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-inter text-sm font-semibold text-white">
            {getInitials(user.fullName)}
          </div>
          <div className="flex flex-col">
            <span className="font-inter text-[13px] leading-[18px] font-medium text-text-primary">
              {user.fullName}
            </span>
            <span className="font-inter text-[11px] leading-4 text-text-secondary">
              {user.role === "administrador" ? "Gerente general" : user.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
