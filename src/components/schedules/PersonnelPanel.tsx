import { useMemo } from "react";
import { X } from "lucide-react";
import { BackendUserListItem } from "../../types/models/Users";
import {
  WeeklySchedule,
  colorForUser,
  formatDurationFromMinutes,
  minutesFromTime,
} from "../../types/models/Schedule";

interface PersonnelPanelProps {
  users: BackendUserListItem[];
  schedulesById: Map<number, WeeklySchedule>;
  selectedUserIds: number[];
  onSelectUserIdsChange: (ids: number[]) => void;
  drawingMode: boolean;
  onAssignSchedule?: (userId: number, scheduleId: number | null) => Promise<void>;
  canManage?: boolean;
  weekStart: Date;
  daysToShow: number;
}

export default function PersonnelPanel({
  users,
  schedulesById,
  selectedUserIds,
  onSelectUserIdsChange,
  drawingMode,
  onAssignSchedule,
  canManage = false,
  weekStart,
  daysToShow,
}: PersonnelPanelProps) {
  const usersWithSchedule = users.filter((u) => u.schedules && u.schedules.length > 0);
  const usersWithoutSchedule = users.filter((u) => !u.schedules || u.schedules.length === 0);

  const toggleUserSelection = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      onSelectUserIdsChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onSelectUserIdsChange([...selectedUserIds, userId]);
    }
  };

  // Compute which day-of-week indexes are visible on the grid
  const visibleDows = useMemo(() => {
    const dows = new Set<number>();
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dows.add(date.getDay());
    }
    return dows;
  }, [weekStart, daysToShow]);

  // Sum up hours only for visible days
  const getVisibleMinutes = (schedule: WeeklySchedule | null) => {
    if (!schedule) return 0;
    return schedule.dailySchedules
      .filter((b) => visibleDows.has(b.day))
      .reduce((acc, b) => acc + Math.max(0, minutesFromTime(b.endTime) - minutesFromTime(b.startTime)), 0);
  };

  return (
    <aside className="flex w-[260px] shrink-0 flex-col gap-4 rounded-[12px] border border-border bg-surface p-4">
      <div>
        <h3 className="font-alexandria text-[16px] font-medium text-text-primary">Personal</h3>
      </div>

      <div className="flex flex-col gap-1">
        {usersWithSchedule.length === 0 && (
          <p className="font-inter text-[12px] text-text-secondary">
            Ningún usuario tiene horario asignado todavía.
          </p>
        )}
        {usersWithSchedule.map((user) => {
          const schedule = user.schedules && user.schedules.length > 0 ? schedulesById.get(user.schedules[0].id) ?? null : null;
          const minutes = getVisibleMinutes(schedule);
          const isSelected = selectedUserIds.includes(user.id);
          const color = colorForUser(user.id);

          return (
            <div
              key={user.id}
              className={`group flex items-center justify-between rounded-[10px] pr-2 pl-2 transition-colors ${
                isSelected ? "bg-info/10" : "hover:bg-surface-2"
              }`}
            >
              <div className="flex flex-1 items-center gap-2 overflow-hidden">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleUserSelection(user.id)}
                  className="h-3.5 w-3.5 accent-[#3b82f6] cursor-pointer shrink-0"
                />
                <button
                  onClick={() => toggleUserSelection(user.id)}
                  className="flex flex-1 items-center gap-3 px-1 py-[7px] text-left min-w-0"
                >
                  <span
                    className="h-[14px] w-[14px] shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="font-inter text-[13px] font-medium text-text-primary truncate">
                      {user.lastName}, {user.fullName}
                    </span>
                    {minutes > 0 && (
                      <span className="font-inter text-[11px] text-text-secondary">
                        {formatDurationFromMinutes(minutes)}
                      </span>
                    )}
                  </div>
                </button>
              </div>
              {canManage && onAssignSchedule && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignSchedule(user.id, null);
                  }}
                  className="hidden rounded p-1 text-text-secondary hover:bg-neutral-soft group-hover:block shrink-0"
                  title="Desvincular horario"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {usersWithoutSchedule.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <p className="font-alexandria text-[12px] font-light uppercase tracking-wide text-text-secondary">
            Sin horario asignado
          </p>
          {usersWithoutSchedule.map((user) => {
            const allSchedules = Array.from(schedulesById.values());
            const isSelected = selectedUserIds.includes(user.id);
            return (
              <div
                key={user.id}
                className={`flex items-center justify-between rounded-[10px] px-2 py-[5px] transition-colors ${
                  isSelected ? "bg-info/10" : ""
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleUserSelection(user.id)}
                    className="h-3.5 w-3.5 accent-[#3b82f6] cursor-pointer shrink-0"
                  />
                  <span
                    onClick={() => toggleUserSelection(user.id)}
                    className="font-inter text-[12px] text-text-secondary truncate cursor-pointer"
                  >
                    {user.lastName}, {user.fullName}
                  </span>
                </div>
                {canManage && onAssignSchedule && allSchedules.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={async (e) => {
                      const val = e.target.value;
                      if (val) {
                        await onAssignSchedule(user.id, Number(val));
                      }
                    }}
                    className="max-w-[100px] rounded-[6px] border border-border bg-surface px-1.5 py-0.5 font-inter text-[10px] text-text-secondary outline-none shrink-0"
                  >
                    <option value="" disabled>Asignar...</option>
                    {allSchedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {drawingMode && (
        <div className="rounded-[10px] border border-info/30 bg-info/10 p-3">
          <p className="font-inter text-[12px] font-medium text-info">Modo de dibujo activo</p>
          <p className="mt-1 font-inter text-[11px] text-info">
            Haz clic o arrastra en el calendario para crear bloques en el horario del usuario seleccionado.
          </p>
        </div>
      )}
      {!drawingMode && selectedUserIds.length > 1 && (
        <div className="rounded-[10px] border border-warning/30 bg-warning/10 p-3">
          <p className="font-inter text-[12px] font-medium text-warning">Multi-selección activa</p>
          <p className="mt-1 font-inter text-[11px] text-warning">
            Selecciona un solo usuario para habilitar el modo de dibujo (creación de bloques).
          </p>
        </div>
      )}
    </aside>
  );
}
