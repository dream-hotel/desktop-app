import { BackendUserListItem } from "../../types/models/Users";
import {
  WeeklySchedule,
  colorForUser,
  formatDurationFromMinutes,
  totalMinutesForSchedule,
} from "../../types/models/Schedule";

interface PersonnelPanelProps {
  users: BackendUserListItem[];
  schedulesById: Map<number, WeeklySchedule>;
  selectedUserId: number | null;
  onSelectUser: (id: number | null) => void;
  drawingMode: boolean;
}

export default function PersonnelPanel({
  users,
  schedulesById,
  selectedUserId,
  onSelectUser,
  drawingMode,
}: PersonnelPanelProps) {
  const usersWithSchedule = users.filter((u) => u.schedules && u.schedules.length > 0);
  const usersWithoutSchedule = users.filter((u) => !u.schedules || u.schedules.length === 0);

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
          const minutes = totalMinutesForSchedule(schedule);
          const isSelected = selectedUserId === user.id;
          const color = colorForUser(user.id);

          return (
            <button
              key={user.id}
              onClick={() => onSelectUser(isSelected ? null : user.id)}
              className={`flex items-center gap-3 rounded-[10px] px-2 py-[7px] text-left transition-colors ${
                isSelected ? "bg-info/10" : "hover:bg-surface-2"
              }`}
            >
              <span
                className="h-[14px] w-[14px] shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="flex flex-1 flex-col">
                <span className="font-inter text-[13px] font-medium text-text-primary">
                  {user.lastName}, {user.fullName}
                </span>
                {minutes > 0 && (
                  <span className="font-inter text-[11px] text-text-secondary">
                    {formatDurationFromMinutes(minutes)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {usersWithoutSchedule.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <p className="font-alexandria text-[12px] font-light uppercase tracking-wide text-text-secondary">
            Sin horario asignado
          </p>
          {usersWithoutSchedule.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-[10px] px-2 py-[5px]"
            >
              <span className="h-[10px] w-[10px] shrink-0 rounded-full border border-border-strong" />
              <span className="font-inter text-[12px] text-text-secondary">
                {user.lastName}, {user.fullName}
              </span>
            </div>
          ))}
        </div>
      )}

      {drawingMode && (
        <div className="rounded-[10px] border border-info/30 bg-info/10 p-3">
          <p className="font-inter text-[12px] font-medium text-info">Modo de dibujo activo</p>
          <p className="mt-1 font-inter text-[11px] text-info">
            Haz clic en una celda para crear un bloque en el horario del usuario seleccionado.
          </p>
        </div>
      )}
    </aside>
  );
}
