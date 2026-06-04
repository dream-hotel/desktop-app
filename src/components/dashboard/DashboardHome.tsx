import {
  AlertTriangle,
  CircleDashed,
  Clock,
  Loader,
} from "lucide-react";
import { User } from "../../types/response/AuthResponse";
import { useDashboard } from "../../hooks/useDashboard";
import { useAnnouncementBell, requestNavigate } from "../../hooks/useAnnouncementBell";
import StatsCard from "./StatsCard";
import UrgentTasksList from "./UrgentTasksList";
import RecentAnnouncementsCard from "./RecentAnnouncementsCard";

interface DashboardHomeProps {
  user: User;
  onNavigate: (section: string) => void;
}

export default function DashboardHome({ user, onNavigate }: DashboardHomeProps) {
  const { data, isLoading, error } = useDashboard();
  const bell = useAnnouncementBell();
  const isAdmin = user.role === "administrador";

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center font-inter text-sm text-text-secondary">
        Cargando dashboard...
      </div>
    );
  }

  function openAnnouncement(id: number) {
    bell.markSeen(id);
    requestNavigate({ section: "anuncios", announcementId: id });
  }

  const tasksTitle = isAdmin ? "Tareas" : "Mis tareas";
  const tasksEmpty = isAdmin
    ? "No hay tareas pendientes ni en progreso."
    : "No tienes tareas urgentes en este momento.";

  return (
    <div className="flex flex-1 flex-col gap-5 px-8 pb-6 pt-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4">
        <StatsCard
          icon={<CircleDashed size={20} strokeWidth={1.7} />}
          value={data.stats.pending}
          label={isAdmin ? "Tareas pendientes" : "Mis pendientes"}
          hint="Sin iniciar"
          onClick={() => onNavigate("tareas")}
        />
        <StatsCard
          icon={<Loader size={20} strokeWidth={1.7} />}
          value={data.stats.inProgress}
          label={isAdmin ? "En progreso" : "Mis en progreso"}
          hint="Trabajándose ahora"
          accent="warning"
          onClick={() => onNavigate("tareas")}
        />
        <StatsCard
          icon={<Clock size={20} strokeWidth={1.7} />}
          value={data.stats.dueSoon}
          label="Vencen en 24 h"
          hint="Pendientes o en progreso"
          accent={data.stats.dueSoon > 0 ? "warning" : "default"}
          onClick={() => onNavigate("tareas")}
        />
        <StatsCard
          icon={<AlertTriangle size={20} strokeWidth={1.7} />}
          value={data.stats.critical}
          label="Críticas activas"
          hint="Prioridad crítica"
          accent={data.stats.critical > 0 ? "danger" : "default"}
          onClick={() => onNavigate("tareas")}
        />
      </div>

      {/* Two-column lower section */}
      <div className="flex min-h-0 flex-1 gap-4">
        <UrgentTasksList
          tasks={data.urgentTasks}
          title={tasksTitle}
          emptyMessage={tasksEmpty}
          onOpenTasks={() => onNavigate("tareas")}
        />
        <RecentAnnouncementsCard
          announcements={data.announcements}
          unreadCount={bell.unreadCount}
          isUnread={bell.isUnread}
          onOpen={openAnnouncement}
          onOpenAll={() => onNavigate("anuncios")}
        />
      </div>
    </div>
  );
}
