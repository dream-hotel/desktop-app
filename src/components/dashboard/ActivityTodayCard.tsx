import { Activity } from "lucide-react";
import { DashboardActivityPoint } from "../../service/dashboardService";

interface ActivityTodayCardProps {
  points: DashboardActivityPoint[];
  scope: "team" | "personal";
}

export default function ActivityTodayCard({ points, scope }: ActivityTodayCardProps) {
  const byHour = new Map(points.map((point) => [point.hour, point.count]));
  const values = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: byHour.get(hour) ?? 0,
  }));
  const max = Math.max(1, ...values.map((point) => point.count));
  const total = values.reduce((sum, point) => sum + point.count, 0);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity size={16} strokeWidth={1.7} className="text-primary" />
          <div>
            <h2 className="font-inter text-[15px] font-semibold text-text-primary">Actividad de hoy</h2>
            <p className="font-inter text-[10.5px] text-text-secondary">
              {scope === "team" ? "Movimientos registrados por hora" : "Tus movimientos registrados por hora"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="block font-inter text-xl font-semibold leading-none text-text-primary">{total}</span>
          <span className="font-inter text-[9.5px] text-text-secondary">eventos</span>
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-4 flex h-16 items-center justify-center rounded-xl bg-neutral-soft/60 font-inter text-[11px] text-text-secondary">
          Aún no hay actividad registrada hoy.
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex h-16 items-end gap-1" role="img" aria-label={`${total} eventos registrados hoy`}>
            {values.map((point) => (
              <span
                key={point.hour}
                title={`${String(point.hour).padStart(2, "0")}:00 · ${point.count} eventos`}
                className={`min-w-0 flex-1 rounded-t-sm transition-colors ${point.count > 0 ? "bg-primary/70 hover:bg-primary" : "bg-neutral-soft"}`}
                style={{ height: point.count > 0 ? `${Math.max(10, (point.count / max) * 100)}%` : "4px" }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between font-inter text-[9px] text-text-secondary">
            <span>00 h</span>
            <span>06 h</span>
            <span>12 h</span>
            <span>18 h</span>
            <span>23 h</span>
          </div>
        </div>
      )}
    </section>
  );
}
