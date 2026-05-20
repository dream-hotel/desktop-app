import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Task, TaskPriority, TaskStatus } from "../../types/response/TaskResponse";

type FilterTab = "todos" | "pending" | "in_progress" | "done" | "archived";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "pending", label: "Pendiente" },
  { id: "in_progress", label: "En Progreso" },
  { id: "done", label: "Finalizado" },
  { id: "archived", label: "Archivado" },
];

function StatusIcon({ status }: { status: TaskStatus }) {
  switch (status) {
    case "in_progress":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="#c5a059" strokeWidth="1.2" />
          <path d="M8 4.5v3.5l2 1.5" stroke="#c5a059" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "pending":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="#d1d5db" strokeWidth="1.2" />
        </svg>
      );
    case "done":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="#76c7c2" strokeWidth="1.2" />
          <path d="M5.5 8l2 2 3.5-3.5" stroke="#76c7c2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "blocked":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="#ef4444" strokeWidth="1.2" />
          <path d="M8 5v3" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="8" cy="10.5" r="0.6" fill="#ef4444" />
        </svg>
      );
  }
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config: Record<TaskPriority, { bg: string; border: string; text: string; label: string }> = {
    critical: { bg: "bg-[#c5a059]", border: "", text: "text-white", label: "Critical" },
    high: { bg: "bg-[rgba(197,160,89,0.15)]", border: "border border-[rgba(197,160,89,0.3)]", text: "text-warning", label: "High" },
    medium: { bg: "bg-[rgba(118,199,194,0.15)]", border: "border border-[rgba(118,199,194,0.3)]", text: "text-success", label: "Medium" },
    low: { bg: "bg-neutral-soft", border: "border border-[rgba(209,213,219,0.3)]", text: "text-text-secondary", label: "Low" },
  };
  const c = config[priority];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${c.bg} ${c.border} ${c.text}`}>
      {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { bg: string; border: string; text: string; label: string }> = {
    in_progress: { bg: "bg-warning/15", border: "border border-[rgba(197,160,89,0.2)]", text: "text-warning", label: "In Progress" },
    pending: { bg: "bg-neutral-soft", border: "border border-[rgba(209,213,219,0.3)]", text: "text-text-secondary", label: "Pending" },
    done: { bg: "bg-success/10", border: "border border-[rgba(118,199,194,0.2)]", text: "text-success", label: "Done" },
    blocked: { bg: "bg-danger/10", border: "border border-[rgba(239,68,68,0.2)]", text: "text-danger", label: "Blocked" },
  };
  const c = config[status];
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
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" fill="#492173" stroke="#492173" />
          <path d="M2.5 5l2 2 3.5-3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" stroke="#9ca3af" />
        </svg>
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
  return day === 0 ? 6 : day - 1; // Monday = 0
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

  // Position to the left of the anchor, so it doesn't overlap the detail panel
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
      {/* Month/year header */}
      <div className="mb-1 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-5 w-5 items-center justify-center rounded text-text-secondary hover:bg-neutral-soft"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M6.5 2L3.5 5l3 3" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="font-alexandria text-[10px] font-normal text-text-primary">
          {MONTH_NAMES_FULL[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="flex h-5 w-5 items-center justify-center rounded text-text-secondary hover:bg-neutral-soft"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3.5 2l3 3-3 3" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="flex h-5 items-center justify-center font-inter text-[8px] font-medium text-text-secondary">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
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
        <svg width="12" height="13" viewBox="0 0 12 13" fill="none" className="shrink-0">
          <rect x="1" y="2.5" width="10" height="9" rx="1" stroke="#6b7280" strokeWidth="0.8" />
          <path d="M1 5.5h10" stroke="#6b7280" strokeWidth="0.8" />
          <path d="M4 1v2M8 1v2" stroke="#6b7280" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
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
        // Don't close if the click is inside a MiniCalendar portal
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

  // Filter icon SVG
  const filterIcon = (color: string) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 3h12M3 7h8M5 11h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );

  // Chevron SVG (up or down)
  const chevron = (direction: "up" | "down", color: string) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {direction === "down" ? (
        <path d="M4 6l3 3 3-3" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M4 9l3-3 3 3" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 5l6 6M11 5l-6 6" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {filterIcon("#1a1a1a")}
          Filtro
          {chevron("down", "#1a1a1a")}
        </button>
      ) : (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-[6px] rounded-[10px] bg-neutral-soft px-3 py-[7px] font-inter text-[13px] font-medium text-text-secondary`}
        >
          {filterIcon("#6b7280")}
          Filtro
          {chevron(expanded ? "up" : "down", "#6b7280")}
        </button>
      )}

      {/* Dropdown */}
      {expanded && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-10 flex w-[112px] flex-col gap-[2px] rounded-sm bg-surface px-[9px] py-[6px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          {/* Fecha section */}
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

          {/* Prioridad section */}
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
                  {p === "high" ? "Alta" : p === "medium" ? "Media" : "Baja"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
}

function TaskItem({ task, isSelected, onClick }: TaskItemProps) {
  const isDone = task.status === "done";

  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col items-start border-b pb-[1px] pt-4 text-left ${
        isSelected
          ? "border-b-border border-l-2 border-l-primary bg-primary-light pl-[22px] pr-5"
          : "border-b-[rgba(0,0,0,0.04)] px-5"
      }`}
    >
      <div className="flex w-full items-start">
        <div className="mr-3 mt-[2px] shrink-0">
          <StatusIcon status={task.status} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
          <div className="flex items-start justify-between">
            <p
              className={`truncate font-inter text-sm font-medium leading-[21px] text-text-primary ${
                isDone ? "line-through opacity-60" : ""
              }`}
            >
              {task.title}
            </p>
            {task.comments > 0 && (
              <div className="ml-2 flex shrink-0 items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1.5 2.5h9a.5.5 0 01.5.5v5a.5.5 0 01-.5.5H4L2 10.5V8.5h-.5a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5z"
                    stroke="#9ca3af"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-inter text-[11px] leading-[16.5px] text-text-secondary">
                  {task.comments}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            <div className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="4" r="2" stroke="#9ca3af" strokeWidth="0.8" />
                <path d="M1 9c0-2 1.5-3 4-3s4 1 4 3" stroke="#9ca3af" strokeWidth="0.8" strokeLinecap="round" />
              </svg>
              <span className="font-inter text-[11px] leading-[16.5px] text-text-secondary">
                {task.assignee}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="#9ca3af" strokeWidth="0.8" />
                <path d="M5 2.5v2.5l2 1" stroke="#9ca3af" strokeWidth="0.8" strokeLinecap="round" />
              </svg>
              <span className="font-inter text-[11px] leading-[16.5px] text-text-secondary">
                {task.deadline}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: number | null;
  onSelectTask: (id: number) => void;
  onNewTask: () => void;
}

export default function TaskList({ tasks, selectedTaskId, onSelectTask, onNewTask }: TaskListProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("todos");
  const [advancedFilter, setAdvancedFilter] = useState<FilterState>(EMPTY_FILTER);

  const filteredTasks = tasks.filter((task) => {
    // Tab filter
    if (activeFilter !== "todos" && activeFilter !== "archived") {
      if (task.status !== activeFilter) return false;
    }
    // Search filter
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    // Priority filter
    if (advancedFilter.priorities.length > 0) {
      // Map critical -> high for filter purposes
      const mappedPriority: PriorityFilter | null =
        task.priority === "critical" ? "high" : (task.priority as PriorityFilter);
      if (!advancedFilter.priorities.includes(mappedPriority)) return false;
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col border-r border-border">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border px-4 py-[17px]">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <h1 className="font-alexandria text-[31px] font-normal leading-[30px] text-text-primary">
            Lista de Tareas
          </h1>
          <button
            onClick={onNewTask}
            className="flex items-center gap-[9px] rounded-[10px] bg-primary px-3 py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-white"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 4.5v9M4.5 9h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Nueva Tarea
          </button>
        </div>

        {/* Search + Filter row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.2" />
              <path d="M11 11l3 3" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[10px] bg-neutral-soft py-2 pl-9 pr-4 font-inter text-[13px] text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none"
            />
          </div>
          <FilterButton filter={advancedFilter} onFilterChange={setAdvancedFilter} />
        </div>

        {/* Filter tabs */}
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

      {/* Task items */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            onClick={() => onSelectTask(task.id)}
          />
        ))}
      </div>
    </div>
  );
}
