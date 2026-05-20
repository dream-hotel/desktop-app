import { useState, ReactNode } from "react";
import { User } from "../../types/response/AuthResponse";

interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
}

const NAV_ITEMS: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="1" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="10" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "tareas",
    label: "Tareas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 4h8M2 9h8M2 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 4l1 1 3-3M13 9l1 1 3-3M13 14l1 1 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "wiki",
    label: "Wiki",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 2h9l3 3v11a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M5 8h8M5 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "anuncios",
    label: "Anuncios",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M14 3v12l-9-4H3a1 1 0 01-1-1V8a1 1 0 011-1h2l9-4z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M5 11v2a2 2 0 002 2h1a1 1 0 001-1v-2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "horarios",
    label: "Horarios",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 5v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "usuarios",
    label: "Usuarios",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1 16c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="13" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M14 11c2 .4 3 1.8 3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "actividad",
    label: "Actividad",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M1 9h4l2-5 3 10 2-5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const BOTTOM_ITEMS: SidebarItem[] = [
  {
    id: "ayuda",
    label: "Ayuda & Soporte",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 6.5a2.5 2.5 0 013.5 2.3c0 1.2-1.5 1.7-1.5 1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="13" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "configuracion",
    label: "Configuración",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M14.6 3.4l-1.4 1.4M4.8 13.2l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
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
  const accountActive = activeItem === "cuenta";

  return (
    <aside
      className={`relative flex h-full flex-col overflow-visible border-r border-border bg-white transition-all duration-250 ${
        collapsed ? "w-16 min-w-16" : "w-60 min-w-60"
      }`}
    >
      {/* Header — logo + collapse button */}
      <div className="border-b border-border px-3 pt-4 pb-3">
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : "justify-between pl-2"}`}>
          <div className="flex items-end gap-[10px]">
            <svg width="22" height="36" viewBox="0 0 24 39" fill="none" className="shrink-0">
              <rect x="0" y="0" width="8" height="39" rx="2" fill="#492173" />
              <rect x="10" y="8" width="6" height="23" rx="2" fill="#492173" />
              <rect x="18" y="14" width="6" height="12" rx="2" fill="#76c7c2" />
            </svg>
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
            className={`flex h-7 w-7 items-center justify-center rounded-[8px] border border-border bg-white text-text-secondary transition-colors hover:bg-[#f5f3f7] hover:text-primary ${
              collapsed ? "absolute right-[-14px] top-5 z-10 shadow-[0px_2px_6px_rgba(0,0,0,0.08)]" : ""
            }`}
            title={collapsed ? "Expandir" : "Colapsar"}
            aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 18 18"
              fill="none"
              className="transition-transform duration-200"
              style={{ transform: collapsed ? "rotate(180deg)" : "none" }}
            >
              <path d="M12 3L6 9l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col justify-between px-3 py-3">
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`flex h-[36px] w-full items-center gap-3 rounded-[10px] border-none px-[13px] text-left font-inter text-[13px] leading-[20px] shadow-none transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                activeItem === item.id
                  ? "bg-primary-light font-medium text-primary"
                  : "bg-transparent text-text-secondary hover:bg-[#f5f3f7] hover:text-primary"
              }`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                {item.icon}
              </span>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && activeItem === item.id && (
                <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          {BOTTOM_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`flex h-[36px] w-full items-center gap-3 rounded-[10px] border-none px-[13px] text-left font-inter text-[13px] leading-[20px] shadow-none transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                activeItem === item.id
                  ? "bg-primary-light font-medium text-primary"
                  : "bg-transparent text-text-secondary hover:bg-[#f5f3f7] hover:text-primary"
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
              : "hover:bg-[#f5f3f7]"
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
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className={`shrink-0 ${accountActive ? "text-primary" : "text-text-secondary"}`}
              >
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
