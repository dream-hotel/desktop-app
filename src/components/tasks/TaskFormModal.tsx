import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  User as UserIcon,
  X,
} from "lucide-react";
import { BackendPriority, priorityLabel } from "../../types/models/Announcement";
import {
  BackendTask,
  BackendTaskStatus,
  CreateTaskPayload,
  fullName,
  TaskStatusName,
  UpdateTaskPayload,
} from "../../types/models/Task";
import { BackendUserListItem } from "../../types/models/Users";
import { listUsers } from "../../service/userService";
import { createTask, updateTask } from "../../service/taskService";
import { useAuth } from "../../hooks/useAuth";

interface TaskForm {
  title: string;
  description: string;
  content: string;
  assigneeIds: number[];
  priorityId: number | null;
  statusId: number | null;
  startDate: string;
  startTime: string;
  startAllDay: boolean;
  endDate: string;
  endTime: string;
  endAllDay: boolean;
}

const EMPTY_FORM: TaskForm = {
  title: "",
  description: "",
  content: "",
  assigneeIds: [],
  priorityId: null,
  statusId: null,
  startDate: "",
  startTime: "",
  startAllDay: false,
  endDate: "",
  endTime: "",
  endAllDay: false,
};

const PRIORITY_SUBLABEL: Record<string, string> = {
  low: "Sin prisa",
  medium: "Normal",
  high: "Urgente",
  critical: "Inmediato",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Finalizada",
  archived: "Archivada",
};

interface TaskFormModalProps {
  mode: "create" | "edit";
  initialTask?: BackendTask | null;
  statuses: BackendTaskStatus[];
  priorities: BackendPriority[];
  onClose: () => void;
  onSaved: () => void;
}

function combineDateTime(date: string, time: string, allDay: boolean): string | undefined {
  if (!date) return undefined;
  const t = allDay ? "00:00" : time || "00:00";
  const iso = new Date(`${date}T${t}`).toISOString();
  return iso;
}

function isoToParts(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function TaskFormModal({
  mode,
  initialTask,
  statuses,
  priorities,
  onClose,
  onSaved,
}: TaskFormModalProps) {
  const { user } = useAuth();
  const isEdit = mode === "edit";

  const [form, setForm] = useState<TaskForm>(() => {
    if (!initialTask) return EMPTY_FORM;
    const start = isoToParts(initialTask.startDate);
    const end = isoToParts(initialTask.limitDate);
    return {
      title: initialTask.title,
      description: initialTask.description ?? "",
      content: initialTask.content ?? "",
      assigneeIds: initialTask.assignments.map((a) => Number(a.userId)),
      priorityId: initialTask.priority?.id ?? null,
      statusId: initialTask.status?.id ?? null,
      startDate: start.date,
      startTime: start.time,
      startAllDay: false,
      endDate: end.date,
      endTime: end.time,
      endAllDay: false,
    };
  });
  const [users, setUsers] = useState<BackendUserListItem[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pre-select self when creating
  useEffect(() => {
    if (!isEdit && user && form.assigneeIds.length === 0) {
      setForm((prev) => ({ ...prev, assigneeIds: [user.id] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Default priority once catalog loads (create only)
  useEffect(() => {
    if (!isEdit && form.priorityId == null && priorities.length > 0) {
      const def =
        priorities.find((p) => p.name === "medium") ??
        priorities[Math.floor(priorities.length / 2)] ??
        priorities[0];
      setForm((prev) => ({ ...prev, priorityId: def.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorities]);

  // Default status once catalog loads (create only)
  useEffect(() => {
    if (!isEdit && form.statusId == null && statuses.length > 0) {
      const def =
        statuses.find((s) => (s.name as TaskStatusName) === "pending") ?? statuses[0];
      setForm((prev) => ({ ...prev, statusId: def.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses]);

  useEffect(() => {
    listUsers({ limit: 200, isActive: true })
      .then((response) => setUsers(response.data))
      .catch((e) => {
        setUsersError(e instanceof Error ? e.message : "No se pudieron cargar los usuarios");
      });
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
      }
    }
    if (showAssigneeDropdown) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [showAssigneeDropdown]);

  function update<K extends keyof TaskForm>(key: K, value: TaskForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClear() {
    if (isEdit) return; // not exposed in edit mode
    setForm({ ...EMPTY_FORM, assigneeIds: user ? [user.id] : [] });
    setSubmitError(null);
  }

  function toggleAssignee(id: number) {
    setForm((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(id)
        ? prev.assigneeIds.filter((x) => x !== id)
        : [...prev.assigneeIds, id],
    }));
  }

  const usersById = useMemo(() => {
    const map = new Map<number, BackendUserListItem>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.fullName} ${u.lastName} ${u.email}`.toLowerCase().includes(q),
    );
  }, [users, assigneeSearch]);

  const selectedAssigneeChips = form.assigneeIds.map((id) => {
    const u = usersById.get(id);
    if (u) return { id, label: `${u.fullName} ${u.lastName}`.trim() };
    if (user && user.id === id) {
      return { id, label: `${user.fullName}${user.lastName ? ` ${user.lastName}` : ""}` };
    }
    // Fall back to whatever assignee data we have on the task
    if (initialTask) {
      const a = initialTask.assignments.find((x) => x.userId === id);
      if (a) return { id, label: fullName(a.user) };
    }
    return { id, label: `#${id}` };
  });

  async function handleSubmit() {
    setSubmitError(null);
    if (!form.title.trim()) {
      setSubmitError("El título es obligatorio.");
      return;
    }
    if (form.assigneeIds.length === 0) {
      setSubmitError("Selecciona al menos un responsable.");
      return;
    }
    const priority =
      form.priorityId != null ? priorities.find((p) => p.id === form.priorityId) : null;
    if (!priority) {
      setSubmitError("Prioridad no disponible. Intenta recargar.");
      return;
    }
    const status =
      form.statusId != null
        ? statuses.find((s) => s.id === form.statusId)
        : statuses.find((s) => (s.name as TaskStatusName) === "pending") ?? statuses[0];
    if (!status) {
      setSubmitError("No hay estados disponibles. Intenta recargar.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && initialTask) {
        const patch: UpdateTaskPayload = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          content: form.content.trim() || undefined,
          statusId: Number(status.id),
          priorityId: Number(priority.id),
          assigneeIds: form.assigneeIds.map((id) => Number(id)),
          startDate: combineDateTime(form.startDate, form.startTime, form.startAllDay),
          limitDate: combineDateTime(form.endDate, form.endTime, form.endAllDay),
        };
        await updateTask(initialTask.id, patch);
      } else {
        const payload: CreateTaskPayload = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          content: form.content.trim() || undefined,
          statusId: Number(status.id),
          priorityId: Number(priority.id),
          assigneeIds: form.assigneeIds.map((id) => Number(id)),
          startDate: combineDateTime(form.startDate, form.startTime, form.startAllDay),
          limitDate: combineDateTime(form.endDate, form.endTime, form.endAllDay),
        };
        await createTask(payload);
      }
      onSaved();
    } catch (e) {
      setSubmitError(
        e instanceof Error
          ? e.message
          : isEdit
            ? "No se pudo actualizar la tarea"
            : "No se pudo crear la tarea",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-[rgba(0,0,0,0.08)] bg-bg shadow-[0px_22px_43px_0px_rgba(0,0,0,0.25)]">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-5 py-4">
        <h2 className="font-alexandria text-[31px] font-normal leading-[30px] text-text-primary">
          {isEdit ? "Editar tarea" : "Nueva tarea"}
        </h2>
        <button
          onClick={onClose}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-lg text-text-secondary hover:bg-neutral-soft"
          title="Cerrar"
        >
          <X size={14} strokeWidth={1.8} className="text-text-secondary" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
        <div className="flex flex-col gap-4">
          <FieldGroup label="Título" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ej. Suite 301 — Revisión de climatización"
              className="w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-3.5 py-2 font-inter text-xs text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none"
            />
          </FieldGroup>

          <FieldGroup label="Descripción" optional>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Detalla el alcance de la tarea, instrucciones especiales..."
              rows={3}
              className="w-full resize-none rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-3.5 py-2 font-inter text-xs leading-[18px] text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none"
            />
          </FieldGroup>

          <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
            <span className="font-inter text-[10px] font-medium leading-4 text-text-body">
              Responsable(s) <span className="text-danger">*</span>
            </span>
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-2 py-1.5">
              {selectedAssigneeChips.map((chip) => (
                <span
                  key={chip.id}
                  className="flex items-center gap-1 rounded-md bg-primary-light px-1.5 py-0.5 font-inter text-[11px] text-primary"
                >
                  {chip.label}
                  <button
                    onClick={() => toggleAssignee(chip.id)}
                    className="ml-0.5 text-primary"
                    title="Quitar"
                  >
                    <X size={10} strokeWidth={2} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setShowAssigneeDropdown((v) => !v)}
                className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 font-inter text-[11px] text-text-secondary hover:bg-neutral-soft"
              >
                <UserIcon size={11} strokeWidth={1.6} />
                Agregar
                <ChevronDown size={11} strokeWidth={1.6} />
              </button>
            </div>
            {showAssigneeDropdown && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface shadow-md">
                <div className="sticky top-0 border-b border-border bg-surface p-2">
                  <input
                    type="text"
                    autoFocus
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    placeholder="Buscar colaborador..."
                    className="w-full rounded-md bg-neutral-soft px-2 py-1 font-inter text-[11px] outline-none"
                  />
                </div>
                {usersError ? (
                  <div className="p-3 font-inter text-[11px] text-text-secondary">
                    Solo puedes asignar la tarea a tu propio usuario.
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-3 font-inter text-[11px] text-text-secondary">
                    Sin resultados.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const checked = form.assigneeIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleAssignee(u.id)}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-neutral-soft"
                      >
                        <span className="font-inter text-[11px] text-text-primary">
                          {fullName({ id: u.id, fullName: u.fullName, lastName: u.lastName })}
                        </span>
                        {checked && <Check size={12} strokeWidth={2.5} className="text-primary" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Prioridad — viene de la tabla de prioridades del backend */}
          <div className="flex flex-col gap-2">
            <span className="font-inter text-[10px] font-medium leading-4 text-text-body">
              Prioridad
            </span>
            {priorities.length === 0 ? (
              <p className="font-inter text-[11px] text-text-secondary">
                Cargando prioridades...
              </p>
            ) : (
              <div className="flex gap-2">
                {priorities.map((p) => (
                  <PriorityCard
                    key={p.id}
                    priority={p}
                    selected={form.priorityId === p.id}
                    onClick={() => update("priorityId", p.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Estado (solo en edición) */}
          {isEdit && (
            <FieldGroup label="Estado">
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => {
                  const selected = form.statusId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => update("statusId", s.id)}
                      className={`rounded-full px-3 py-1 font-inter text-[11px] font-medium ${
                        selected
                          ? "bg-primary text-white"
                          : "bg-neutral-soft text-text-secondary"
                      }`}
                    >
                      {STATUS_LABEL[s.name] ?? s.name}
                    </button>
                  );
                })}
              </div>
            </FieldGroup>
          )}

          <FieldGroup label="Notas adicionales / Contexto" optional>
            <textarea
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              placeholder="Ej. Piezas en camino, esperando confirmación del proveedor..."
              rows={2}
              className="w-full resize-none rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-3.5 py-2 font-inter text-xs leading-[18px] text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none"
            />
          </FieldGroup>

          <div className="flex gap-3">
            <DateBlock
              label="Fecha de inicio"
              date={form.startDate}
              time={form.startTime}
              allDay={form.startAllDay}
              onDate={(v) => update("startDate", v)}
              onTime={(v) => update("startTime", v)}
              onAllDay={(v) => update("startAllDay", v)}
            />
            <DateBlock
              label="Fecha límite"
              date={form.endDate}
              time={form.endTime}
              allDay={form.endAllDay}
              onDate={(v) => update("endDate", v)}
              onTime={(v) => update("endTime", v)}
              onAllDay={(v) => update("endAllDay", v)}
            />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-surface px-5 py-3.5">
        {submitError && <p className="font-inter text-[11px] text-danger">{submitError}</p>}
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="font-inter text-[11px] font-medium text-text-secondary">
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            {!isEdit && (
              <button
                onClick={handleClear}
                className="rounded-[10px] border border-border-strong px-3 py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-text-secondary"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-[9px] rounded-[10px] bg-primary px-3 py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={16} strokeWidth={2} />
              {submitting
                ? isEdit
                  ? "Guardando..."
                  : "Creando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Crear tarea"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helpers ---

function FieldGroup({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-inter text-[10px] font-medium leading-4 text-text-body">
        {label}{" "}
        {required && <span className="text-danger">*</span>}
        {optional && <span className="text-text-secondary">(opcional)</span>}
      </span>
      {children}
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-[14px] w-[28px] rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-neutral-mid"
      }`}
    >
      <div
        className={`absolute top-[2px] h-[10px] w-[10px] rounded-full bg-surface shadow-[0px_1px_2.5px_rgba(0,0,0,0.1),0px_1px_1.7px_rgba(0,0,0,0.1)] transition-transform ${
          checked ? "translate-x-[16px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

function PriorityCard({
  priority,
  selected,
  onClick,
}: {
  priority: BackendPriority;
  selected: boolean;
  onClick: () => void;
}) {
  const label = priorityLabel(priority.name);
  const sub = PRIORITY_SUBLABEL[priority.name] ?? "";
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center rounded-lg border-2 py-3 transition-colors ${
        selected
          ? "border-success bg-[rgba(118,199,194,0.15)]"
          : "border-[rgba(0,0,0,0.08)] bg-surface"
      }`}
    >
      <span
        className={`font-inter text-[11px] font-semibold ${
          selected ? "text-success" : "text-text-secondary"
        }`}
      >
        {label}
      </span>
      {sub && (
        <span
          className={`font-inter text-[9.5px] font-medium opacity-75 ${
            selected ? "text-success" : "text-text-secondary"
          }`}
        >
          {sub}
        </span>
      )}
    </button>
  );
}

function DateBlock({
  label,
  date,
  time,
  allDay,
  onDate,
  onTime,
  onAllDay,
}: {
  label: string;
  date: string;
  time: string;
  allDay: boolean;
  onDate: (v: string) => void;
  onTime: (v: string) => void;
  onAllDay: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <span className="font-inter text-[10px] font-medium leading-4 text-text-body">{label}</span>
      <div className="flex items-center rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-2.5 py-2">
        <Calendar size={12} strokeWidth={1.4} className="shrink-0 text-text-secondary" />
        <input
          type="date"
          value={date}
          onChange={(e) => onDate(e.target.value)}
          className="ml-2 min-w-0 flex-1 font-inter text-[11px] text-text-primary outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <ToggleSwitch checked={allDay} onChange={onAllDay} />
        <span className="font-inter text-[9.5px] font-medium text-text-secondary">
          Todo el día
        </span>
      </div>
      {!allDay && (
        <div className="flex items-center rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-2.5 py-2">
          <Clock size={12} strokeWidth={1.4} className="shrink-0 text-text-secondary" />
          <input
            type="time"
            value={time}
            onChange={(e) => onTime(e.target.value)}
            className="ml-2 min-w-0 flex-1 font-inter text-[11px] text-text-primary outline-none"
          />
        </div>
      )}
    </div>
  );
}
