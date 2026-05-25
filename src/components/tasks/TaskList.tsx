import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Ban,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDashed,
  CheckCircle2,
  Clock,
  Loader,
  Plus,
  Search,
  SlidersHorizontal,
  User as UserIcon,
  X,
} from "lucide-react";
import {
  BackendTaskListItem,
  fullName,
  priorityNameLabel,
  shortName,
} from "../../types/models/Task";
import { PriorityName } from "../../types/models/Announcement";

type FilterTab = "all" | "pending" | "in_progress" | "completed" | "archived";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendiente" },
  { id: "in_progress", label: "En Progreso" },
  { id: "completed", label: "Finalizado" },
  { id: "archived", label: "Archivado" },
];

function StatusIcon({ name }: { name: string }) {
  switch (name) {
    case "in_progress":
      return <Loader size={16} strokeWidth={1.6} className="text-warning" />;
    case "completed":
      return <CheckCircle2 size={16} strokeWidth={1.6} className="text-success" />;
    case "archived":
      return <Ban size={16} strokeWidth={1.6} className="text-danger" />;
    case "pending":
    default:
      return <CircleDashed size={16} strokeWidth={1.6} className="text-text-secondary" />;
  }
}

function PriorityBadge({ name }: { name: string }) {
  const config: Record<string, { bg: string; border: string; text: string; label: string }> = {
    critical: { bg: "bg-[#c5a059]", border: "", text: "text-white", label: "Crítica" },
    high: { bg: "bg-[rgba(197,160,89,0.15)]", border: "border border-[rgba(197,160,89,0.3)]", text: "text-warning", label: "Alta" },
    medium: { bg: "bg-[rgba(118,199,194,0.15)]", border: "border border-[rgba(118,199,194,0.3)]", text: "text-success", label: "Media" },
    low: { bg: "bg-neutral-soft", border: "border border-[rgba(209,213,219,0.3)]", text: "text-text-secondary", label: "Baja" },
  };
  const c = config[name] ?? config.low;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${c.bg} ${c.border} ${c.text}`}>
      {c.label}
    </span>
  );
}

function StatusBadge({ name }: { name: string }) {
  const config: Record<string, { bg: string; border: string; text: string; label: string }> = {
    in_progress: { bg: "bg-warning/15", border: "border border-[rgba(197,160,89,0.2)]", text: "text-warning", label: "En progreso" },
    pending: { bg: "bg-neutral-soft", border: "border border-[rgba(209,213,219,0.3)]", text: "text-text-secondary", label: "Pendiente" },
    completed: { bg: "bg-success/10", border: "border border-[rgba(118,199,194,0.2)]", text: "text-success", label: "Finalizada" },
    archived: { bg: "bg-danger/10", border: "border border-[rgba(239,68,68,0.2)]", text: "text-danger", label: "Archivada" },
  };
  const c = config[name] ?? config.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${c.bg} ${c.border} ${c.text}`}>
      {c.label}
    </span>
  );
}

// --- Filter types & component ---

type PriorityFilter = "high" | "medium" | "low";

interface FilterState {
  dateFrom: Date | null;
  dateTo: Date | null;
  priorities: PriorityFilter[];
}

const EMPTY_FILTER: FilterState = { dateFrom: null, dateTo: null, priorities: [] };

function isFilterActive(filter: FilterState): boolean {
  return filter.dateFrom !== null || filter.dateTo !== null || filter.priorities.length > 0;
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="flex shrink-0 items-center justify-center p-[3px]">
      {checked ? (
        <span className="flex h-[10px] w-[10px] items-center justify-center rounded-[2px] bg-primary text-white">
          <Check size={8} strokeWidth={2.5} />
        </span>
      ) : (
        <span className="block h-[10px] w-[10px] rounded-[2px] border border-text-secondary/60" />
      )}
    </button>
  );
}

const MONTH_NAMES_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const MONTH_NAMES_FULL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_HEADERS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

function formatDateShort(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES_SHORT[date.getMonth()]}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

interface MiniCalendarProps {
  selected: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}

function MiniCalendar({ selected, onSelect, onClose, anchorRect }: MiniCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function isSelected(day: number): boolean {
    if (!selected) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === viewMonth &&
      selected.getFullYear() === viewYear
    );
  }

  function isToday(day: number): boolean {
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const calWidth = 180;
  const style: React.CSSProperties = {
    position: "fixed",
    top: anchorRect.top,
    left: anchorRect.left - calWidth - 8,
    zIndex: 9999,
  };

  return createPortal(
    <div
      ref={calRef}
      data-mini-calendar
      className="w-[180px] rounded-md bg-surface p-2 shadow-[0px_4px_12px_rgba(0,0,0,0.15)]"
      style={style}
    >
      <div className="mb-1 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-5 w-5 items-center justify-center rounded text-text-secondary hover:bg-neutral-soft"
        >
          <ChevronLeft size={10} strokeWidth={1.6} className="text-text-secondary" />
        </button>
        <span className="font-alexandria text-[10px] font-normal text-text-primary">
          {MONTH_NAMES_FULL[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="flex h-5 w-5 items-center justify-center rounded text-text-secondary hover:bg-neutral-soft"
        >
          <ChevronRight size={10} strokeWidth={1.6} className="text-text-secondary" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="flex h-5 items-center justify-center font-inter text-[8px] font-medium text-text-secondary">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => (
          <div key={i} className="flex h-5 items-center justify-center">
            {day !== null ? (
              <button
                onClick={() => {
                  onSelect(new Date(viewYear, viewMonth, day));
                  onClose();
                }}
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-full font-inter text-[9px] transition-colors ${
                  isSelected(day)
                    ? "bg-primary text-white"
                    : isToday(day)
                      ? "bg-primary-light text-primary"
                      : "text-text-primary hover:bg-neutral-soft"
                }`}
              >
                {day}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
}

function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const openCalendar = useCallback(() => {
    if (btnRef.current) {
      setAnchorRect(btnRef.current.getBoundingClientRect());
    }
    setShowCalendar(true);
  }, []);

  return (
    <div className="flex items-center justify-between">
      <span className="font-alexandria text-[9px] font-light leading-[21px] text-black">
        {label}
      </span>
      <button
        ref={btnRef}
        onClick={() => (showCalendar ? setShowCalendar(false) : openCalendar())}
        className="flex w-[60px] items-center gap-1 overflow-hidden rounded-sm bg-neutral-mid py-px pl-[7px] pr-[9px]"
      >
        <Calendar size={11} strokeWidth={1.4} className="shrink-0 text-text-secondary" />
        <span className="font-alexandria text-[8px] font-light leading-[21px] text-text-secondary">
          {value ? formatDateShort(value) : "dd mmm"}
        </span>
      </button>
      {showCalendar && anchorRect && (
        <MiniCalendar
          selected={value}
          onSelect={(d) => onChange(d)}
          onClose={() => setShowCalendar(false)}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}

interface FilterButtonProps {
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
}

function FilterButton({ filter, onFilterChange }: FilterButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = isFilterActive(filter);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        if ((target as HTMLElement).closest?.("[data-mini-calendar]")) return;
        setExpanded(false);
      }
    }
    if (expanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [expanded]);

  function togglePriority(p: PriorityFilter) {
    const next = filter.priorities.includes(p)
      ? filter.priorities.filter((x) => x !== p)
      : [...filter.priorities, p];
    onFilterChange({ ...filter, priorities: next });
  }

  function clearFilter() {
    onFilterChange(EMPTY_FILTER);
  }

  const filterIcon = (color: string) => (
    <SlidersHorizontal size={13} strokeWidth={1.6} style={{ color }} />
  );

  const chevron = (direction: "up" | "down", color: string) =>
    direction === "down" ? (
      <ChevronDown size={13} strokeWidth={1.6} style={{ color }} />
    ) : (
      <ChevronUp size={13} strokeWidth={1.6} style={{ color }} />
    );

  return (
    <div ref={containerRef} className="relative">
      {active && !expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-[6px] rounded-[10px] border border-success bg-[rgba(26,186,26,0.15)] px-3 py-[7px] font-inter text-[13px] font-medium text-text-primary"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearFilter();
            }}
            className="flex items-center justify-center"
          >
            <X size={14} strokeWidth={1.8} className="text-text-primary" />
          </button>
          {filterIcon("#1a1a1a")}
          Filtro
          {chevron("down", "#1a1a1a")}
        </button>
      ) : (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-[6px] rounded-[10px] bg-neutral-soft px-3 py-[7px] font-inter text-[13px] font-medium text-text-secondary"
        >
          {filterIcon("#6b7280")}
          Filtro
          {chevron(expanded ? "up" : "down", "#6b7280")}
        </button>
      )}

      {expanded && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-10 flex w-[112px] flex-col gap-[2px] rounded-sm bg-surface px-[9px] py-[6px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <p className="font-alexandria text-[11px] font-light leading-[21px] text-primary underline">
            Fecha
          </p>
          <div className="flex flex-col gap-[6px]">
            <DatePickerField
              label="Desde"
              value={filter.dateFrom}
              onChange={(d) => onFilterChange({ ...filter, dateFrom: d })}
            />
            <DatePickerField
              label="Hasta"
              value={filter.dateTo}
              onChange={(d) => onFilterChange({ ...filter, dateTo: d })}
            />
          </div>

          <p className="mt-[2px] font-alexandria text-[11px] font-light leading-[21px] text-primary underline">
            Prioridad
          </p>
          <div className="flex flex-col">
            {(["high", "medium", "low"] as PriorityFilter[]).map((p) => (
              <div key={p} className="flex items-center gap-[2px]">
                <Checkbox
                  checked={filter.priorities.includes(p)}
                  onChange={() => togglePriority(p)}
                />
                <span className="font-alexandria text-[9px] font-light leading-[19.5px] text-black">
                  {priorityNameLabel(p)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDeadline(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return time;
  return `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]} ${time}`;
}

function assigneeSummary(task: BackendTaskListItem): string {
  if (task.assignments.length === 0) return "Sin asignar";
  const first = shortName(task.assignments[0].user);
  if (task.assignments.length === 1) return first;
  return `${first} +${task.assignments.length - 1}`;
}

interface TaskItemProps {
  task: BackendTaskListItem;
  isSelected: boolean;
  onClick: () => void;
}

function TaskItem({ task, isSelected, onClick }: TaskItemProps) {
  const isDone = task.status.name === "completed";
  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col items-start border-b py-4 text-left ${
        isSelected
          ? "border-b-border border-l-2 border-l-primary bg-primary-light pl-[22px] pr-5"
          : "border-b-[rgba(0,0,0,0.04)] px-5"
      }`}
    >
      <div className="flex w-full items-start">
        <div className="mr-3 mt-[2px] shrink-0">
          <StatusIcon name={task.status.name} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
          <p
            className={`truncate font-inter text-sm font-medium leading-[21px] text-text-primary ${
              isDone ? "line-through opacity-60" : ""
            }`}
            title={task.title}
          >
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-x-2">
            <PriorityBadge name={task.priority.name} />
            <StatusBadge name={task.status.name} />
            <div className="flex items-center gap-1">
              <UserIcon size={10} strokeWidth={1.4} className="text-text-secondary" />
              <span
                className="font-inter text-[11px] leading-[16.5px] text-text-secondary"
                title={task.assignments.map((a) => fullName(a.user)).join(", ")}
              >
                {assigneeSummary(task)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={10} strokeWidth={1.4} className="text-text-secondary" />
              <span className="font-inter text-[11px] leading-[16.5px] text-text-secondary">
                {formatDeadline(task.limitDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

interface TaskListProps {
  tasks: BackendTaskListItem[];
  isLoading: boolean;
  selectedTaskId: number | null;
  onSelectTask: (id: number) => void;
  onNewTask: () => void;
}

export default function TaskList({
  tasks,
  isLoading,
  selectedTaskId,
  onSelectTask,
  onNewTask,
}: TaskListProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [advancedFilter, setAdvancedFilter] = useState<FilterState>(EMPTY_FILTER);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeFilter !== "all" && task.status.name !== activeFilter) return false;
      if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (advancedFilter.priorities.length > 0) {
        const name = task.priority.name as PriorityName;
        const mapped: PriorityFilter = name === "critical" ? "high" : (name as PriorityFilter);
        if (!advancedFilter.priorities.includes(mapped)) return false;
      }
      if (advancedFilter.dateFrom || advancedFilter.dateTo) {
        if (!task.limitDate) return false;
        const d = new Date(task.limitDate);
        if (advancedFilter.dateFrom && d < advancedFilter.dateFrom) return false;
        if (advancedFilter.dateTo) {
          const end = new Date(advancedFilter.dateTo);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
      }
      return true;
    });
  }, [tasks, activeFilter, search, advancedFilter]);

  return (
    <div className="flex h-full flex-col border-r border-border">
      <div className="flex flex-col gap-4 border-b border-border px-4 py-[17px]">
        <div className="flex items-center justify-between">
          <h1 className="font-alexandria text-[31px] font-normal leading-[30px] text-text-primary">
            Lista de Tareas
          </h1>
          <button
            onClick={onNewTask}
            className="flex items-center gap-[9px] rounded-[10px] bg-primary px-3 py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-white"
          >
            <Plus size={16} strokeWidth={2} />
            Nueva Tarea
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} strokeWidth={1.6} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[10px] bg-neutral-soft py-2 pl-9 pr-4 font-inter text-[13px] text-text-primary placeholder:text-text-secondary outline-none"
            />
          </div>
          <FilterButton filter={advancedFilter} onFilterChange={setAdvancedFilter} />
        </div>

        <div className="flex items-center gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`rounded-full px-3 py-1 font-inter text-xs font-medium leading-[18px] ${
                activeFilter === tab.id
                  ? "bg-primary text-white"
                  : "bg-neutral-soft text-text-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center font-inter text-sm text-text-secondary">
            Cargando tareas...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center font-inter text-sm text-text-secondary">
            No hay tareas que coincidan con los filtros actuales.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onClick={() => onSelectTask(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
