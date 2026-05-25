import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
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
  const bell = useAnnouncementBell();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [pendingAnnouncementId, setPendingAnnouncementId] = useState<number | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<number | null>(null);
  const [pendingArticleId, setPendingArticleId] = useState<number | null>(null);

  useEffect(() => {
    return onNavigateRequest((req) => {
      setActiveNav(req.section);
      if (req.announcementId != null) setPendingAnnouncementId(req.announcementId);
      if (req.taskId != null) setPendingTaskId(req.taskId);
      if (req.articleId != null) setPendingArticleId(req.articleId);
    });
  }, []);

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
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
            <DashboardHome user={user} onNavigate={setActiveNav} />
          ) : activeNav === "tareas" ? (
            <TasksPage
              pendingSelectedId={pendingTaskId}
              onConsumeSelection={() => setPendingTaskId(null)}
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
