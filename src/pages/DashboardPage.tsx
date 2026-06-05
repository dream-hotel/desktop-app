import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";
import { useAnnouncementBell, onNavigateRequest } from "../hooks/useAnnouncementBell";
import Sidebar from "../components/layout/Sidebar";
import DashboardHeader from "../components/layout/DashboardHeader";
import StatusBar from "../components/layout/StatusBar";
import DashboardHome from "../components/dashboard/DashboardHome";
import WelcomeNotificationsModal from "../components/dashboard/WelcomeNotificationsModal";
import UnderConstructionPage from "./UnderConstructionPage";
import TasksPage from "./TasksPage";
import WikiPage from "./WikiPage";
import AnnouncementsPage from "./AnnouncementsPage";
import UsersPage from "./UsersPage";
import ActivityLogPage from "./ActivityLogPage";
import SchedulesPage from "./SchedulesPage";
import AccountPage from "./AccountPage";
import ConfigurationPage, { readWelcomeModalEnabled } from "./ConfigurationPage";
import HelpSupportPage from "./HelpSupportPage";
import { FilterTab } from "../components/tasks/TaskList";
import ForcePasswordChangeModal from "../components/login/ForcePasswordChangeModal";


const PAGE_LABELS: Record<string, string> = {
  tareas: "Tareas",
  wiki: "Wiki",
  anuncios: "Anuncios",
  horarios: "Horarios",
  usuarios: "Usuarios",
  actividad: "Actividad",
  ayuda: "Ayuda & Soporte",
  configuracion: "Configuración",
};

const SECTION_PERMISSIONS: Record<string, string[]> = {
  dashboard: ["dashboard:read"],
  tareas: ["tasks:read"],
  wiki: ["wiki:read"],
  anuncios: ["announcements:read"],
  horarios: ["schedules:read"],
  usuarios: ["users:read", "roles:read"],
  actividad: ["audit:read"],
};

const FALLBACK_ORDER = ["dashboard", "tareas", "wiki", "anuncios", "horarios", "usuarios", "actividad"];

function NoAccessView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
      <h2 className="font-alexandria text-[24px] font-normal text-text-primary">Sin acceso</h2>
      <p className="mt-2 font-inter text-[13px] text-text-secondary">
        No tenés permisos para ver esta sección. Pedile al administrador que ajuste tu rol.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { hasAny } = usePermissions();
  const bell = useAnnouncementBell();

  const firstAllowedSection = useMemo(() => {
    for (const section of FALLBACK_ORDER) {
      const required = SECTION_PERMISSIONS[section];
      if (!required || hasAny(required)) return section;
    }
    return "cuenta";
  }, [hasAny]);

  const [activeNav, setActiveNav] = useState(firstAllowedSection);
  const [showNotifications, setShowNotifications] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [pendingAnnouncementId, setPendingAnnouncementId] = useState<number | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<number | null>(null);
  const [pendingArticleId, setPendingArticleId] = useState<number | null>(null);
  const [pendingTaskTab, setPendingTaskTab] = useState<FilterTab | null>(null);
  const [pendingTaskPriority, setPendingTaskPriority] = useState<string | null>(null);
  const [pendingTaskDueSoon, setPendingTaskDueSoon] = useState<boolean | null>(null);


  useEffect(() => {
    return onNavigateRequest((req) => {
      setActiveNav(req.section);
      if (req.announcementId != null) setPendingAnnouncementId(req.announcementId);
      if (req.taskId != null) setPendingTaskId(req.taskId);
      if (req.articleId != null) setPendingArticleId(req.articleId);
      if (req.tab != null) setPendingTaskTab(req.tab as FilterTab);
      if (req.priority != null) setPendingTaskPriority(req.priority);
      if (req.dueSoon != null) setPendingTaskDueSoon(req.dueSoon);
    });
  }, []);

  const handleDashboardNavigate = (
    section: string,
    options?: { tab?: FilterTab; priority?: string; dueSoon?: boolean; taskId?: number }
  ) => {
    setActiveNav(section);
    if (section === "tareas") {
      if (options?.tab != null) setPendingTaskTab(options.tab);
      if (options?.priority != null) setPendingTaskPriority(options.priority);
      if (options?.dueSoon != null) setPendingTaskDueSoon(options.dueSoon);
      if (options?.taskId != null) setPendingTaskId(options.taskId);
    }
  };


  useEffect(() => {
    const required = SECTION_PERMISSIONS[activeNav];
    if (required && !hasAny(required)) {
      setActiveNav(firstAllowedSection);
    }
  }, [activeNav, hasAny, firstAllowedSection]);

  useEffect(() => {
    bell.reload();
  }, [activeNav]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  const unseenAnnouncements = bell.announcements.filter((a) => bell.isUnread(a.id));
  const showWelcomeModal =
    readWelcomeModalEnabled() && !welcomeDismissed && unseenAnnouncements.length > 0;

  const FULL_HEIGHT_PAGES = [
    "tareas", "wiki", "anuncios", "usuarios", "actividad", "horarios", "cuenta", "configuracion", "ayuda",
  ];
  const isFullHeightPage = FULL_HEIGHT_PAGES.includes(activeNav);

  const handleAnnouncementClick = (id: number) => {
    bell.markSeen(id);
    setShowNotifications(false);
    setWelcomeDismissed(true);

    const ann = bell.announcements.find((a) => a.id === id);
    if (ann) {
      if (ann.type === "task" && ann.taskId != null) {
        setActiveNav("tareas");
        setPendingTaskId(ann.taskId);
        return;
      }
      if (ann.type === "article" && ann.articleId != null) {
        setActiveNav("wiki");
        setPendingArticleId(ann.articleId);
        return;
      }
    }

    setActiveNav("anuncios");
    setPendingAnnouncementId(id);
  };

  const headerContent = {
    title: activeNav === "dashboard" ? undefined : (
      activeNav === "tareas" ? "Lista de Tareas" :
      activeNav === "wiki" ? "Wiki institucional" :
      activeNav === "anuncios" ? "Anuncios" :
      activeNav === "usuarios" ? "Usuarios y Roles" :
      activeNav === "actividad" ? "Actividad del Sistema" :
      activeNav === "horarios" ? "Gestión de Horario" :
      activeNav === "cuenta" ? "Mi cuenta" :
      activeNav === "configuracion" ? "Configuración" :
      activeNav === "ayuda" ? "Ayuda & Soporte" :
      (PAGE_LABELS[activeNav] || activeNav)
    ),
    subtitle: (
      activeNav === "usuarios" ? "Administra cuentas, roles y acceso al sistema." :
      activeNav === "actividad" ? "Todo lo que ha pasado en el sistema, contado de manera simple." :
      activeNav === "cuenta" ? "Información personal, seguridad y sesión." :
      activeNav === "configuracion" ? "Preferencias generales de la aplicación." :
      activeNav === "ayuda" ? "Preguntas frecuentes sobre el uso de la aplicación." :
      undefined
    ),
  };

  const required = SECTION_PERMISSIONS[activeNav];
  const sectionAllowed = !required || hasAny(required);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg">
      <div className="flex min-h-0 flex-1">
        <Sidebar activeItem={activeNav} onNavigate={setActiveNav} user={user} />
        <main className={`flex min-w-0 flex-1 flex-col ${isFullHeightPage ? "overflow-hidden" : "overflow-y-auto"}`}>
          <DashboardHeader
            user={user}
            announcements={bell.announcements}
            bellLoading={bell.loading}
            unreadCount={bell.unreadCount}
            isUnread={bell.isUnread}
            showNotifications={showNotifications}
            onToggleNotifications={() => setShowNotifications((prev) => !prev)}
            onCloseNotifications={() => setShowNotifications(false)}
            onAnnouncementClick={handleAnnouncementClick}
            onMarkAllSeen={bell.markAllSeen}
            customTitle={headerContent.title}
            customSubtitle={headerContent.subtitle}
          />

          {!sectionAllowed ? (
            <NoAccessView />
          ) : activeNav === "dashboard" ? (
            <DashboardHome user={user} onNavigate={handleDashboardNavigate} />
          ) : activeNav === "tareas" ? (
            <TasksPage
              pendingSelectedId={pendingTaskId}
              onConsumeSelection={() => setPendingTaskId(null)}
              pendingTab={pendingTaskTab}
              pendingPriority={pendingTaskPriority}
              pendingDueSoon={pendingTaskDueSoon}
              onConsumeFilters={() => {
                setPendingTaskTab(null);
                setPendingTaskPriority(null);
                setPendingTaskDueSoon(null);
              }}
            />
          ) : activeNav === "wiki" ? (
            <WikiPage
              pendingSelectedId={pendingArticleId}
              onConsumeSelection={() => setPendingArticleId(null)}
            />
          ) : activeNav === "anuncios" ? (
            <AnnouncementsPage
              pendingSelectedId={pendingAnnouncementId}
              onConsumeSelection={() => setPendingAnnouncementId(null)}
            />
          ) : activeNav === "usuarios" ? (
            <UsersPage />
          ) : activeNav === "actividad" ? (
            <ActivityLogPage />
          ) : activeNav === "horarios" ? (
            <SchedulesPage />
          ) : activeNav === "cuenta" ? (
            <AccountPage user={user} onLogout={logout} />
          ) : activeNav === "configuracion" ? (
            <ConfigurationPage />
          ) : activeNav === "ayuda" ? (
            <HelpSupportPage />
          ) : (
            <UnderConstructionPage pageName={PAGE_LABELS[activeNav] ?? activeNav} />
          )}
        </main>
      </div>
      <StatusBar />

      {showWelcomeModal && (
        <WelcomeNotificationsModal
          announcements={unseenAnnouncements}
          onMarkAllSeen={bell.markAllSeen}
          onDismiss={() => setWelcomeDismissed(true)}
          onOpenAnnouncement={handleAnnouncementClick}
        />
      )}

      {user.mustChangePassword && (
        <ForcePasswordChangeModal />
      )}
    </div>
  );
}
