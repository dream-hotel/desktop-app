import { useState, ReactNode } from "react";

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
}

export default function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex h-full flex-col overflow-hidden border-r border-border bg-white transition-all duration-250 ${
        collapsed ? "w-16 min-w-16" : "w-60 min-w-60"
      }`}
    >
      {/* Header */}
      <div className="border-b border-border px-5 pt-[15px] pb-4">
        <div className={`flex items-end gap-[10px] py-[5px] ${collapsed ? "justify-center pl-0" : "pl-[10px]"}`}>
          <svg width="24" height="39" viewBox="0 0 24 39" fill="none" className="shrink-0">
            <rect x="0" y="0" width="8" height="39" rx="2" fill="#492173" />
            <rect x="10" y="8" width="6" height="23" rx="2" fill="#492173" />
            <rect x="18" y="14" width="6" height="12" rx="2" fill="#76c7c2" />
          </svg>
          {!collapsed && (
            <div className="flex flex-col pb-[3px]">
              <span className="font-alexandria text-[20px] leading-[21px] font-normal text-text-primary">
                STANNUM
              </span>
              <span className="font-alexandria text-[14px] leading-[21px] font-normal text-primary">
                Dream Hotel
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col justify-between px-3 py-3">
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`flex h-[39.5px] w-full items-center gap-3 rounded-[10px] border-none px-[15px] text-left font-inter text-sm leading-[22px] shadow-none transition-colors ${
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
              className={`flex h-[39.5px] w-full items-center gap-3 rounded-[10px] border-none px-[15px] text-left font-inter text-sm leading-[22px] shadow-none transition-colors ${
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
          <button
            className={`mt-1 flex h-[39.5px] w-full items-center gap-3 rounded-[10px] border-none bg-transparent px-[15px] text-left font-inter text-sm leading-[22px] text-text-secondary shadow-none transition-colors hover:bg-[#f5f3f7] hover:text-primary ${
              collapsed ? "justify-center px-0" : ""
            }`}
            onClick={() => setCollapsed(!collapsed)}
          >
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                className="transition-transform duration-200"
                style={{ transform: collapsed ? "rotate(180deg)" : "none" }}
              >
                <path d="M12 3L6 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {!collapsed && <span className="flex-1">Colapsar</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
}
