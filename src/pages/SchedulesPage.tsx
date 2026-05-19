import { useCallback, useEffect, useMemo, useState } from "react";
import { BackendUserListItem } from "../types/models/Users";
import {
  DailyBlock,
  WeeklySchedule,
  formatTime,
} from "../types/models/Schedule";
import { listUsers } from "../service/userService";
import {
  addDailyBlock,
  deleteDailyBlock,
  listSchedules,
  updateDailyBlock,
} from "../service/scheduleService";
import WeekGrid from "../components/schedules/WeekGrid";
import PersonnelPanel from "../components/schedules/PersonnelPanel";
import BlockEditorModal from "../components/schedules/BlockEditorModal";
import { useAuth } from "../hooks/useAuth";

const MONTH_LABELS_ES_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const DAYS_OPTIONS = [
  { value: 7, label: "7 días" },
  { value: 5, label: "5 días" },
  { value: 3, label: "3 días" },
  { value: 1, label: "1 día" },
];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() - dow); // start on Sunday
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatRange(start: Date, days: number): string {
  const end = addDays(start, days - 1);
  const sd = start.getDate();
  const sm = MONTH_LABELS_ES_SHORT[start.getMonth()];
  const ed = end.getDate();
  const em = MONTH_LABELS_ES_SHORT[end.getMonth()];
  if (start.getMonth() === end.getMonth()) {
    return `${sd} – ${ed} de ${sm}`;
  }
  return `${sd} ${sm} – ${ed} ${em}`;
}

interface EditTarget {
  mode: "create" | "edit";
  block?: DailyBlock | null;
  user: BackendUserListItem;
  schedule: WeeklySchedule;
  initialDay: number;
  initialStart?: string;
  initialEnd?: string;
}

export default function SchedulesPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "administrador";

  const [users, setUsers] = useState<BackendUserListItem[]>([]);
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [daysToShow, setDaysToShow] = useState<number>(7);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userResp, scheduleResp] = await Promise.all([
        listUsers({ page: 1, limit: 100, isActive: true }),
        listSchedules({ page: 1, limit: 100 }),
      ]);
      setUsers(userResp.data);
      setSchedules(scheduleResp.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los horarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const schedulesById = useMemo(() => {
    const map = new Map<number, WeeklySchedule>();
    for (const s of schedules) map.set(s.id, s);
    return map;
  }, [schedules]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );
  const selectedSchedule = useMemo(
    () => (selectedUser?.scheduleId ? schedulesById.get(selectedUser.scheduleId) ?? null : null),
    [selectedUser, schedulesById],
  );

  const drawingMode = isAdmin && selectedUser !== null && selectedSchedule !== null;

  function handleCellClick(dow: number, hour: number, minute: number) {
    if (!drawingMode || !selectedUser || !selectedSchedule) return;
    const startStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const endHour = Math.min(23, hour + 1);
    const endStr = `${String(endHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    setEditTarget({
      mode: "create",
      user: selectedUser,
      schedule: selectedSchedule,
      initialDay: dow,
      initialStart: startStr,
      initialEnd: endStr,
    });
  }

  function handleBlockClick(block: DailyBlock, user: BackendUserListItem) {
    if (!isAdmin) {
      setSelectedUserId(user.id);
      return;
    }
    const schedule = user.scheduleId ? schedulesById.get(user.scheduleId) ?? null : null;
    if (!schedule) return;
    setSelectedUserId(user.id);
    setEditTarget({
      mode: "edit",
      block,
      user,
      schedule,
      initialDay: block.day,
      initialStart: formatTime(block.startTime),
      initialEnd: formatTime(block.endTime),
    });
  }

  async function handleSaveBlock(payload: { day: number; startTime: string; endTime: string }) {
    if (!editTarget) return;
    if (editTarget.mode === "create") {
      await addDailyBlock(editTarget.schedule.id, payload);
    } else if (editTarget.block) {
      await updateDailyBlock(editTarget.schedule.id, editTarget.block.id, payload);
    }
    setEditTarget(null);
    await fetchAll();
  }

  async function handleDeleteBlock() {
    if (!editTarget || !editTarget.block) return;
    await deleteDailyBlock(editTarget.schedule.id, editTarget.block.id);
    setEditTarget(null);
    await fetchAll();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg">
      <div className="flex items-center justify-between border-b border-border bg-white px-8 py-5">
        <div>
          <h1 className="font-alexandria text-[31px] font-normal leading-[30px] text-text-primary">
            Gestión de Horario
          </h1>
          {!loading && (
            <p className="mt-1 font-inter text-[12px] text-text-secondary">
              {users.length} {users.length === 1 ? "usuario" : "usuarios"} ·{" "}
              {schedules.length} {schedules.length === 1 ? "plantilla" : "plantillas"} de horario
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 border-b border-border bg-white px-8 py-3">
        <div className="flex items-center gap-2">
          <span className="font-inter text-[13px] text-text-body">Días a mostrar:</span>
          <select
            value={daysToShow}
            onChange={(e) => setDaysToShow(Number(e.target.value))}
            className="rounded-[8px] border border-border bg-white px-3 py-1.5 font-inter text-[13px] text-text-primary outline-none"
          >
            {DAYS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-inter text-[13px] text-text-body">Semana:</span>
          <button
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border bg-white text-text-secondary hover:bg-[#f3f4f6]"
            title="Semana anterior"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2 rounded-[8px] border border-border bg-white px-3 py-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="2.5" width="11" height="10" rx="1" stroke="#6b7280" strokeWidth="1" />
              <path d="M1.5 5.5h11" stroke="#6b7280" strokeWidth="1" />
              <path d="M4.5 1v2M9.5 1v2" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span className="font-inter text-[13px] text-text-primary">
              {formatRange(weekStart, daysToShow)}
            </span>
          </div>
          <button
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border bg-white text-text-secondary hover:bg-[#f3f4f6]"
            title="Semana siguiente"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-[8px] border border-border bg-white px-3 py-1.5 font-inter text-[12px] font-medium text-text-body hover:bg-[#f3f4f6]"
          >
            Hoy
          </button>
        </div>

        {selectedUser && (
          <div className="ml-auto flex items-center gap-2 rounded-full bg-primary-light px-3 py-1.5 font-inter text-[12px] font-medium text-primary">
            <span>
              Editando horario de {selectedUser.lastName}, {selectedUser.fullName}
            </span>
            <button
              onClick={() => setSelectedUserId(null)}
              className="rounded-full p-0.5 hover:bg-white"
              title="Limpiar selección"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
        <div className="flex min-h-0 flex-1 flex-col">
          {error && (
            <div className="mb-3 rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-[#fee2e2] px-3 py-2 font-inter text-[12px] text-[#991b1b]">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex flex-1 items-center justify-center font-inter text-sm text-text-secondary">
              Cargando horarios...
            </div>
          ) : (
            <WeekGrid
              users={users}
              schedulesById={schedulesById}
              selectedUserId={selectedUserId}
              weekStart={weekStart}
              daysToShow={daysToShow}
              startHour={0}
              endHour={24}
              onCellClick={isAdmin ? handleCellClick : undefined}
              onBlockClick={handleBlockClick}
            />
          )}
        </div>
        <PersonnelPanel
          users={users}
          schedulesById={schedulesById}
          selectedUserId={selectedUserId}
          onSelectUser={setSelectedUserId}
          drawingMode={drawingMode}
        />
      </div>

      {editTarget && (
        <BlockEditorModal
          mode={editTarget.mode}
          scheduleName={editTarget.schedule.name}
          initialDay={editTarget.initialDay}
          initialStart={editTarget.initialStart}
          initialEnd={editTarget.initialEnd}
          block={editTarget.block}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveBlock}
          onDelete={editTarget.mode === "edit" ? handleDeleteBlock : undefined}
        />
      )}
    </div>
  );
}
