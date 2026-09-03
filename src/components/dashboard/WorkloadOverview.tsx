import { BarChart3, CalendarOff, CheckCircle2, CircleDashed, Loader } from "lucide-react";
import { DashboardMetrics } from "../../service/dashboardService";

interface WorkloadOverviewProps {
  metrics: DashboardMetrics;
  isAdmin: boolean;
}

function percentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}

export default function WorkloadOverview({ metrics, isAdmin }: WorkloadOverviewProps) {
  const pendingWidth = percentage(metrics.pendingTasks, metrics.activeTasks);
  const progressWidth = percentage(metrics.inProgressTasks, metrics.activeTasks);

  return (
    <section className="pb-7">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} strokeWidth={1.7} className="text-primary" />
          <div>
            <h2 className="font-inter text-[15px] font-semibold text-text-primary">Carga activa</h2>
            <p className="font-inter text-[10.5px] text-text-secondary">
              {isAdmin ? "Trabajo del equipo" : "Tu trabajo asignado"}
            </p>
          </div>
        </div>
        <span className="font-inter text-[26px] font-semibold leading-none tracking-[-0.03em] text-text-primary">
          {metrics.activeTasks}
        </span>
      </div>

      <div
        className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-soft"
        role="img"
        aria-label={`${metrics.pendingTasks} pendientes y ${metrics.inProgressTasks} en progreso`}
      >
        <span className="h-full bg-primary" style={{ width: `${pendingWidth}%` }} />
        <span className="h-full bg-warning" style={{ width: `${progressWidth}%` }} />
      </div>

      <dl className="mt-4 grid grid-cols-2 divide-x divide-border border-y border-border py-3">
        <div className="pr-4">
          <dt className="flex items-center gap-1.5 font-inter text-[10px] text-text-secondary">
            <CircleDashed size={12} strokeWidth={1.7} /> Pendientes
          </dt>
          <dd className="mt-1 font-inter text-lg font-semibold text-text-primary">{metrics.pendingTasks}</dd>
        </div>
        <div className="pl-4">
          <dt className="flex items-center gap-1.5 font-inter text-[10px] text-warning">
            <Loader size={12} strokeWidth={1.7} /> En progreso
          </dt>
          <dd className="mt-1 font-inter text-lg font-semibold text-text-primary">{metrics.inProgressTasks}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-inter text-[10.5px] text-text-secondary">
          <CalendarOff size={12} strokeWidth={1.7} /> Sin fecha límite
        </span>
        <span className={`font-inter text-[11px] font-semibold ${metrics.withoutDeadline > 0 ? "text-warning" : "text-text-primary"}`}>
          {metrics.withoutDeadline}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-inter text-[10.5px] text-text-secondary">
          <CheckCircle2 size={12} strokeWidth={1.7} /> Avance histórico
        </span>
        <span className="font-inter text-[11px] font-semibold text-success">
          {metrics.completionPercentage}%
        </span>
      </div>
    </section>
  );
}
