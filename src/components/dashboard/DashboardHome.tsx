import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RotateCw,
  ShieldAlert,
} from "lucide-react";
import { useDashboard } from "../../hooks/useDashboard";
import { useAnnouncementBell, requestNavigate } from "../../hooks/useAnnouncementBell";
import StatsCard from "./StatsCard";
import UrgentTasksList from "./UrgentTasksList";
import RecentAnnouncementsCard from "./RecentAnnouncementsCard";
import WorkloadOverview from "./WorkloadOverview";
import ActivityTodayCard from "./ActivityTodayCard";
import { DeadlineScope, FilterTab } from "../tasks/TaskList";

interface DashboardHomeProps {
  onNavigate: (
    section: string,
    options?: {
      tab?: FilterTab;
      priority?: string;
      dueSoon?: boolean;
      deadlineScope?: DeadlineScope;
      taskId?: number;
    },
  ) => void;
}

export default function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { data, isLoading, error, refresh } = useDashboard();
  const bell = useAnnouncementBell();

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-7 px-8 py-6" aria-label="Cargando dashboard">
        <div className="grid grid-cols-2 divide-x divide-border border-y border-border lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-[122px] animate-pulse bg-neutral-soft/35" />
          ))}
        </div>
        <div className="h-72 animate-pulse border-t border-border bg-neutral-soft/20" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center px-8 py-10">
        <div className="max-w-md rounded-2xl border border-danger/25 bg-surface p-6 text-center shadow-sm" role="alert">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <AlertTriangle size={21} strokeWidth={1.7} />
          </span>
          <h2 className="mt-3 font-inter text-[16px] font-semibold text-text-primary">
            No se pudo cargar el dashboard
          </h2>
          <p className="mt-1 font-inter text-[11px] leading-relaxed text-text-secondary">
            {error || "No pudimos cargar tu información. Verifica tu conexión e inténtalo nuevamente."}
          </p>
          <button
            type="button"
            onClick={() => refresh()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 font-inter text-[11px] font-semibold text-on-accent transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2"
          >
            <RotateCw size={13} strokeWidth={1.8} />
            Reintentar conexión
          </button>
        </div>
      </div>
    );
  }

  function openAnnouncement(id: number) {
    bell.markSeen(id);
    const announcement = data?.announcements?.find((item) => item.id === id) ||
      bell.announcements.find((item) => item.id === id);
    if (announcement) {
      if (announcement.type === "task" && announcement.taskId != null) {
        requestNavigate({ section: "tareas", taskId: announcement.taskId });
        return;
      }
      if (announcement.type === "article" && announcement.articleId != null) {
        requestNavigate({ section: "wiki", articleId: announcement.articleId });
        return;
      }
    }
    requestNavigate({ section: "anuncios", announcementId: id });
  }

  const { metrics } = data;
  const isAdmin = metrics.scope === "team";
  const tasksTitle = isAdmin ? "Cola prioritaria del equipo" : "Tu cola prioritaria";
  const tasksEmpty = isAdmin
    ? "No hay tareas pendientes ni en progreso para el equipo."
    : "No tienes tareas pendientes ni en progreso en este momento.";

  return (
    <div className="flex flex-1 flex-col gap-7 px-8 pb-8 pt-5">
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 font-inter text-[12px] text-danger" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => refresh()}
            className="rounded-lg px-2 py-1 font-semibold transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
          >
            Reintentar
          </button>
        </div>
      )}

      <section aria-labelledby="dashboard-priorities-heading">
        <div className="mb-2.5 flex items-end justify-between">
          <div>
            <h2 id="dashboard-priorities-heading" className="font-inter text-[13px] font-semibold text-text-primary">
              Prioridades del turno
            </h2>
            <p className="font-inter text-[10.5px] text-text-secondary">Lo que necesita atención antes de continuar con el turno.</p>
          </div>
          <span className="font-inter text-[10px] text-text-secondary">Información al momento</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border border-y border-border lg:grid-cols-4">
          <StatsCard
            icon={<ShieldAlert size={19} strokeWidth={1.7} />}
            value={metrics.overdueTasks}
            label="Tareas vencidas"
            hint="Fuera de plazo y aún activas"
            accent={metrics.overdueTasks > 0 ? "danger" : "default"}
            onClick={() => onNavigate("tareas", { deadlineScope: "overdue" })}
          />
          <StatsCard
            icon={<Clock3 size={19} strokeWidth={1.7} />}
            value={metrics.dueSoonTasks}
            label="Próximas 24 horas"
            hint="Solo vencimientos futuros"
            accent={metrics.dueSoonTasks > 0 ? "warning" : "default"}
            onClick={() => onNavigate("tareas", { deadlineScope: "next_24h" })}
          />
          <StatsCard
            icon={<AlertTriangle size={19} strokeWidth={1.7} />}
            value={metrics.criticalTasks}
            label="Prioridad crítica"
            hint="Pendientes o en progreso"
            accent={metrics.criticalTasks > 0 ? "danger" : "default"}
            onClick={() => onNavigate("tareas", { priority: "critical" })}
          />
          <StatsCard
            icon={<CheckCircle2 size={19} strokeWidth={1.7} />}
            value={metrics.completedToday}
            label="Completadas hoy"
            hint="Cerradas durante esta jornada"
            accent="success"
          />
        </div>
      </section>

      <div className="grid min-h-0 grid-cols-1 items-stretch gap-7 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)] lg:gap-0">
        <UrgentTasksList
          tasks={data.urgentTasks}
          title={tasksTitle}
          emptyMessage={tasksEmpty}
          onOpenTasks={(taskId) => onNavigate("tareas", taskId ? { taskId } : undefined)}
        />
        <div className="flex min-w-0 flex-col divide-y divide-border border-t border-border pt-7 lg:border-l lg:border-t-0 lg:pb-1 lg:pl-8 lg:pt-0">
          <WorkloadOverview metrics={metrics} isAdmin={isAdmin} />
          <RecentAnnouncementsCard
            announcements={data.announcements}
            unreadCount={bell.unreadCount}
            isUnread={bell.isUnread}
            onOpen={openAnnouncement}
            onOpenAll={() => onNavigate("anuncios")}
          />
        </div>
      </div>

      <ActivityTodayCard points={metrics.activityByHour} scope={metrics.scope} />
    </div>
  );
}
