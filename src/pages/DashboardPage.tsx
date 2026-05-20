import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDashboard } from "../hooks/useDashboard";
import { useAnnouncementBell, onNavigateRequest } from "../hooks/useAnnouncementBell";
import Sidebar from "../components/layout/Sidebar";
import DashboardHeader from "../components/layout/DashboardHeader";
import StatusBar from "../components/layout/StatusBar";
import StatsCard from "../components/dashboard/StatsCard";
import RecentTasks from "../components/dashboard/RecentTasks";
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

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { data, isLoading } = useDashboard();
  const bell = useAnnouncementBell();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [pendingAnnouncementId, setPendingAnnouncementId] = useState<number | null>(null);

  useEffect(() => {
    return onNavigateRequest((req) => {
      setActiveNav(req.section);
      if (req.announcementId != null) setPendingAnnouncementId(req.announcementId);
    });
  }, []);

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center font-inter text-base text-text-secondary">
        Cargando...
      </div>
    );
  }

  const unseenAnnouncements = bell.announcements.filter((a) => bell.isUnread(a.id));
  const showWelcomeModal =
    readWelcomeModalEnabled() && !welcomeDismissed && unseenAnnouncements.length > 0;

  const FULL_HEIGHT_PAGES = [
    "tareas", "wiki", "anuncios", "usuarios", "actividad", "horarios", "cuenta", "configuracion",
  ];
  const isFullHeightPage = FULL_HEIGHT_PAGES.includes(activeNav);

  const handleAnnouncementClick = (id: number) => {
    bell.markSeen(id);
    setShowNotifications(false);
    setActiveNav("anuncios");
    setPendingAnnouncementId(id);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg">
      <div className="flex min-h-0 flex-1">
        <Sidebar activeItem={activeNav} onNavigate={setActiveNav} user={user} />
        <main className={`flex min-w-0 flex-1 flex-col ${isFullHeightPage ? "overflow-hidden" : "overflow-y-auto"}`}>
          {!isFullHeightPage && (
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
            />
          )}

          {activeNav === "dashboard" ? (
            <div className="flex flex-1 flex-col gap-5 px-8 pb-6 pt-0">
              <div className="flex gap-4">
                <StatsCard
                  icon={
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M3 5h8M3 10h8M3 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M14 5l1 1 3-3M14 10l1 1 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                  value={data.stats.tareasActivas}
                  label="Tareas activas"
                  diff={data.stats.tareasActivasDiff}
                  diffColor="#16a34a"
                />
                <StatsCard
                  icon={
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  }
                  value={data.stats.porcentajeCompletado}
                  suffix="%"
                  label="Porcentaje completado"
                  diff={data.stats.porcentajeCompletadoDiff}
                  diffColor="#16a34a"
                />
                <StatsCard
                  icon={
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 4h12v12H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <path d="M4 8h12M8 4v12" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  }
                  value={data.stats.checkInsPendientes}
                  label="Check-ins pendientes"
                  diff={data.stats.checkInsPendientesDiff}
                  diffColor="#f59e0b"
                />
                <StatsCard
                  icon={
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 3l1.5 4.5H16l-3.5 2.8 1.2 4.5L10 12l-3.7 2.8 1.2-4.5L4 7.5h4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  }
                  value={data.stats.alertasCriticas}
                  label="Alertas críticas"
                  diff={data.stats.alertasCriticasDiff}
                  diffColor="#ef4444"
                />
              </div>

              <div className="flex flex-1 gap-4">
                <RecentTasks tasks={data.recentTasks} />
              </div>
            </div>
          ) : activeNav === "tareas" ? (
            <TasksPage />
          ) : activeNav === "wiki" ? (
            <WikiPage />
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
          ) : (
            <UnderConstructionPage pageName={PAGE_LABELS[activeNav] ?? activeNav} />
          )}
        </main>
      </div>
      <StatusBar />

      {showWelcomeModal && (
        <WelcomeNotificationsModal
          announcements={unseenAnnouncements}
          onMarkSeen={bell.markSeen}
          onMarkAllSeen={bell.markAllSeen}
          onDismiss={() => setWelcomeDismissed(true)}
          onOpenAnnouncement={handleAnnouncementClick}
        />
      )}
    </div>
  );
}
