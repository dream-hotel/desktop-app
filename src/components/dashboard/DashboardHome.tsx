import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RotateCw,
  ShieldAlert,
  UserRound,
  UsersRound,
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
      <div className="flex flex-1 flex-col gap-5 px-8 py-6" aria-label="Cargando dashboard">
        <div className="h-20 animate-pulse rounded-2xl bg-neutral-soft" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-[138px] animate-pulse rounded-2xl bg-neutral-soft" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-neutral-soft" />
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
            {error || "Verifica la conexión con el servidor local e inténtalo nuevamente."}
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

  const operationalMessage = metrics.overdueTasks > 0
    ? "Hay tareas fuera de plazo"
    : metrics.dueSoonTasks > 0
      ? "El turno requiere seguimiento"
      : metrics.criticalTasks > 0
        ? "Hay prioridades críticas activas"
        : "La operación está al día";

  const operationalDescription = metrics.overdueTasks > 0
    ? "La cola está ordenada para que resuelvas primero los vencimientos más urgentes."
    : metrics.dueSoonTasks > 0
      ? "Revisa los próximos vencimientos antes de continuar con el resto de la carga."
      : "No hay vencimientos inmediatos. Puedes continuar con la carga activa del turno.";

  return (
    <div className="flex flex-1 flex-col gap-5 px-8 pb-8 pt-5">
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

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${metrics.overdueTasks > 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>
            {metrics.overdueTasks > 0 ? (
              <ShieldAlert size={20} strokeWidth={1.7} />
            ) : (
              <CheckCircle2 size={20} strokeWidth={1.7} />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-inter text-[16px] font-semibold text-text-primary">{operationalMessage}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-soft px-2 py-0.5 font-inter text-[9.5px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
                {isAdmin ? <UsersRound size={10} /> : <UserRound size={10} />}
                {isAdmin ? "Vista del equipo" : "Vista personal"}
              </span>
            </div>
            <p className="mt-0.5 truncate font-inter text-[11px] text-text-secondary">
              {operationalDescription}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 font-inter text-[10.5px] font-semibold text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
          aria-label="Actualizar dashboard"
        >
          <RotateCw size={12} strokeWidth={1.8} />
          Actualizar
        </button>
      </section>

      <section aria-labelledby="dashboard-priorities-heading">
        <div className="mb-2.5 flex items-end justify-between">
          <div>
            <h2 id="dashboard-priorities-heading" className="font-inter text-[13px] font-semibold text-text-primary">
              Prioridades del turno
            </h2>
            <p className="font-inter text-[10.5px] text-text-secondary">Lo que necesita atención antes de continuar con el turno.</p>
          </div>
          <span className="font-inter text-[10px] text-text-secondary">Actualización automática</span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <div className="grid min-h-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <UrgentTasksList
          tasks={data.urgentTasks}
          title={tasksTitle}
          emptyMessage={tasksEmpty}
          onOpenTasks={(taskId) => onNavigate("tareas", taskId ? { taskId } : undefined)}
        />
        <div className="flex min-w-0 flex-col gap-4">
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
