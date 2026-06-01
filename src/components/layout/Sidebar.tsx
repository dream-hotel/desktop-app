import { useMemo, useState, ReactNode } from "react";
import {
  LayoutDashboard,
  ListChecks,
  BookOpen,
  Megaphone,
  CalendarDays,
  Users,
  ScrollText,
  CircleHelp,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { User } from "../../types/response/AuthResponse";
import { usePermissions } from "../../hooks/usePermissions";
import dreamLogo from "../../assets/dream_logo.svg";
import { useAnnouncementBell } from "../../hooks/useAnnouncementBell";

interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  permissions?: string[]; // any of these grants visibility
}

const ICON_SIZE = 18;
const ICON_STROKE = 1.6;

const NAV_ITEMS: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={ICON_SIZE} strokeWidth={ICON_STROKE} />, permissions: ["dashboard:read"] },
  { id: "tareas", label: "Tareas", icon: <ListChecks size={ICON_SIZE} strokeWidth={ICON_STROKE} />, permissions: ["tasks:read"] },
  { id: "wiki", label: "Wiki", icon: <BookOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} />, permissions: ["wiki:read"] },
  { id: "anuncios", label: "Anuncios", icon: <Megaphone size={ICON_SIZE} strokeWidth={ICON_STROKE} />, permissions: ["announcements:read"] },
  { id: "horarios", label: "Horarios", icon: <CalendarDays size={ICON_SIZE} strokeWidth={ICON_STROKE} />, permissions: ["schedules:read"] },
  { id: "usuarios", label: "Usuarios", icon: <Users size={ICON_SIZE} strokeWidth={ICON_STROKE} />, permissions: ["users:read", "roles:read"] },
  { id: "actividad", label: "Actividad", icon: <ScrollText size={ICON_SIZE} strokeWidth={ICON_STROKE} />, permissions: ["audit:read"] },
];

const BOTTOM_ITEMS: SidebarItem[] = [
  { id: "ayuda", label: "Ayuda & Soporte", icon: <CircleHelp size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { id: "configuracion", label: "Configuración", icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
];

interface SidebarProps {
  activeItem: string;
  onNavigate: (id: string) => void;
  user: User;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function roleLabel(role: User["role"]): string {
  switch (role) {
    case "administrador":
      return "Administrador";
    case "recepcionista":
      return "Recepcionista";
    default:
      return "Cliente";
  }
}

export default function Sidebar({ activeItem, onNavigate, user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { hasAny } = usePermissions();
  const { unreadCount } = useAnnouncementBell();
  const accountActive = activeItem === "cuenta";

  const visibleNav = useMemo(
    () => NAV_ITEMS.filter((item) => !item.permissions || hasAny(item.permissions)),
    [hasAny],
  );
  const visibleBottom = useMemo(
    () => BOTTOM_ITEMS.filter((item) => !item.permissions || hasAny(item.permissions)),
    [hasAny],
  );

  return (
    <aside
      className={`relative flex h-full flex-col overflow-visible border-r border-border bg-surface transition-all duration-250 ${
        collapsed ? "w-16 min-w-16" : "w-60 min-w-60"
      }`}
    >
      {/* Header — logo + collapse button */}
      <div className="border-b border-border px-3 pt-4 pb-3">
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : "justify-between pl-2"}`}>
          <div className="flex items-center gap-[10px]">
            <img
              src={dreamLogo}
              alt="Dream by Stannum"
              className="h-9 w-9 shrink-0"
            />
            {!collapsed && (
              <div className="flex flex-col pb-[2px]">
                <span className="font-alexandria text-[18px] leading-[20px] font-normal text-text-primary">
                  STANNUM
                </span>
                <span className="font-alexandria text-[13px] leading-[18px] font-normal text-primary">
                  Dream Hotel
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={`flex h-7 w-7 items-center justify-center rounded-[8px] border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary ${
              collapsed ? "absolute right-[-14px] top-5 z-10 shadow-[0px_2px_6px_rgba(0,0,0,0.08)]" : ""
            }`}
            title={collapsed ? "Expandir" : "Colapsar"}
            aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          >
            {collapsed ? (
              <ChevronRight size={14} strokeWidth={1.8} />
            ) : (
              <ChevronLeft size={14} strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col justify-between px-3 py-3">
        <div className="flex flex-col gap-1">
          {visibleNav.map((item) => (
            <button
              key={item.id}
              className={`relative flex h-[36px] w-full items-center gap-3 rounded-[10px] border-none px-[13px] text-left font-inter text-[13px] leading-[20px] shadow-none transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                activeItem === item.id
                  ? "bg-primary-light font-medium text-primary"
                  : "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-primary"
              }`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                {item.icon}
                {collapsed && item.id === "anuncios" && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary font-inter text-[8px] font-semibold text-white leading-none">
                    {unreadCount}
                  </span>
                )}
              </span>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && item.id === "anuncios" && unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 font-inter text-[11px] font-semibold text-white leading-none">
                  {unreadCount}
                </span>
              )}
              {!collapsed && activeItem === item.id && activeItem !== "anuncios" && (
                <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          {visibleBottom.map((item) => (
            <button
              key={item.id}
              className={`flex h-[36px] w-full items-center gap-3 rounded-[10px] border-none px-[13px] text-left font-inter text-[13px] leading-[20px] shadow-none transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                activeItem === item.id
                  ? "bg-primary-light font-medium text-primary"
                  : "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-primary"
              }`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                {item.icon}
              </span>
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* User card footer */}
      <div className="border-t border-border px-3 py-2.5">
        <button
          onClick={() => onNavigate("cuenta")}
          className={`flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left transition-colors ${
            accountActive
              ? "bg-primary-light"
              : "hover:bg-surface-hover"
          }`}
          title={collapsed ? user.fullName : "Mi cuenta"}
          aria-label="Mi cuenta"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-inter text-[12px] font-semibold text-white">
            {getInitials(user.fullName)}
          </div>
          {!collapsed && (
            <>
              <div className="flex min-w-0 flex-1 flex-col">
                <span
                  className={`truncate font-inter text-[12.5px] font-medium leading-tight ${
                    accountActive ? "text-primary" : "text-text-primary"
                  }`}
                >
                  {user.fullName}
                </span>
                <span className="truncate font-inter text-[10.5px] leading-tight text-text-secondary">
                  {roleLabel(user.role)}
                </span>
              </div>
              <ChevronRight
                size={12}
                strokeWidth={1.8}
                className={`shrink-0 ${accountActive ? "text-primary" : "text-text-secondary"}`}
              />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
