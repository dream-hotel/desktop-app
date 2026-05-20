import { ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ListChecks,
  LogIn,
  type LucideProps,
  Megaphone,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import {
  BackendSystemLog,
  FindLogsQuery,
  LogType,
  logTypeLabel,
} from "../types/models/Activity";
import { listActivityLogs, listLogTypes } from "../service/activityService";
import { listUsers } from "../service/userService";
import { humanizeLog, logTypeIcon } from "../service/activityHumanizer";

const PAGE_SIZE = 20;

function fullDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function relativeTime(iso: string): string {
  try {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return "Hace unos segundos";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin === 1) return "Hace un minuto";
    if (diffMin < 60) return `Hace ${diffMin} minutos`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr === 1) return "Hace una hora";
    if (diffHr < 24) return `Hace ${diffHr} horas`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return "Ayer";
    if (diffDay < 7) return `Hace ${diffDay} días`;
    return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long" });
  } catch {
    return "";
  }
}

function dayHeading(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "Hoy";
  if (sameDay(d, yesterday)) return "Ayer";
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function toIsoStart(date: string): string | undefined {
  if (!date) return undefined;
  return `${date}T00:00:00.000Z`;
}

function toIsoEnd(date: string): string | undefined {
  if (!date) return undefined;
  return `${date}T23:59:59.999Z`;
}

type IconKey = ReturnType<typeof logTypeIcon>;

const ICONS: Record<IconKey, ComponentType<LucideProps>> = {
  auth: LogIn,
  users: Users,
  tasks: ListChecks,
  wiki: BookOpen,
  announcements: Megaphone,
  schedules: CalendarDays,
  system: CircleHelp,
  error: AlertCircle,
};

const TYPE_TONE: Record<IconKey, { ring: string; bg: string; text: string }> = {
  auth: { ring: "ring-[#3b82f6]/20", bg: "bg-[#dbeafe]", text: "text-[#1e40af]" },
  users: { ring: "ring-[#8b5cf6]/20", bg: "bg-[#ede9fe]", text: "text-[#5b21b6]" },
  tasks: { ring: "ring-[#16a34a]/20", bg: "bg-[#dcfce7]", text: "text-[#166534]" },
  wiki: { ring: "ring-[#f59e0b]/20", bg: "bg-[#fef3c7]", text: "text-[#92400e]" },
  announcements: { ring: "ring-[#ec4899]/20", bg: "bg-[#fce7f3]", text: "text-[#9d174d]" },
  schedules: { ring: "ring-[#0ea5e9]/20", bg: "bg-[#e0f2fe]", text: "text-[#075985]" },
  system: { ring: "ring-[#9ca3af]/20", bg: "bg-[#e5e7eb]", text: "text-[#374151]" },
  error: { ring: "ring-[#ef4444]/20", bg: "bg-[#fee2e2]", text: "text-[#991b1b]" },
};

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<BackendSystemLog[]>([]);
  const [logTypes, setLogTypes] = useState<LogType[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_SIZE, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [logTypeFilter, setLogTypeFilter] = useState<number | "all">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<Record<number, string>>({});

  useEffect(() => {
    listLogTypes()
      .then(setLogTypes)
      .catch(() => setLogTypes([]));
  }, []);

  useEffect(() => {
    listUsers({ limit: 200 })
      .then((res) => {
        const map: Record<number, string> = {};
        for (const u of res.data) {
          map[u.id] = `${u.fullName} ${u.lastName}`.trim();
        }
        setUserNames(map);
      })
      .catch(() => setUserNames({}));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [logTypeFilter, dateFrom, dateTo]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: FindLogsQuery = { page, limit: PAGE_SIZE };
      if (logTypeFilter !== "all") query.logTypeId = logTypeFilter;
      const isoFrom = toIsoStart(dateFrom);
      const isoTo = toIsoEnd(dateTo);
      if (isoFrom) query.dateFrom = isoFrom;
      if (isoTo) query.dateTo = isoTo;
      const result = await listActivityLogs(query);
      setLogs(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los eventos");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, logTypeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const humanizedLogs = useMemo(() => {
    return logs
      .map((log) => {
        const human = humanizeLog(log.message);
        return human ? { log, human } : null;
      })
      .filter((entry): entry is { log: BackendSystemLog; human: { title: string; detail?: string } } => entry !== null);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return humanizedLogs;
    return humanizedLogs.filter(({ human }) => {
      const haystack = `${human.title} ${human.detail ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [humanizedLogs, search]);

  const groupedByDay = useMemo(() => {
    const groups: { heading: string; items: typeof filteredLogs }[] = [];
    for (const entry of filteredLogs) {
      const heading = dayHeading(entry.log.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.heading === heading) {
        last.items.push(entry);
      } else {
        groups.push({ heading, items: [entry] });
      }
    }
    return groups;
  }, [filteredLogs]);

  function clearFilters() {
    setLogTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }

  const hasFilters =
    logTypeFilter !== "all" || dateFrom !== "" || dateTo !== "" || search !== "";

  function userDisplay(userId: number | null): string {
    if (userId === null) return "Sistema";
    return userNames[userId] ?? "Usuario eliminado";
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-5 border-b border-border px-8 pb-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-alexandria text-[31px] font-normal leading-[30px] text-text-primary">
              Actividad del Sistema
            </h1>
            <p className="mt-1 font-inter text-[13px] text-text-secondary">
              Todo lo que ha pasado en el sistema, contado de manera simple.
            </p>
          </div>
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="flex items-center gap-[9px] rounded-[10px] border border-border bg-surface px-3 py-[6px] font-inter text-[13px] font-medium text-text-body hover:bg-surface-hover disabled:opacity-50"
          >
            <RefreshCw size={15} strokeWidth={1.8} className={loading ? "animate-spin" : undefined} />
            Actualizar
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search
              size={14}
              strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en los eventos..."
              className="w-full rounded-[10px] bg-neutral-soft py-2 pl-9 pr-3 font-inter text-[13px] text-text-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-inter text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              Categoría
            </label>
            <select
              value={logTypeFilter === "all" ? "all" : String(logTypeFilter)}
              onChange={(e) =>
                setLogTypeFilter(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className="rounded-[10px] bg-neutral-soft px-3 py-2 font-inter text-[13px] text-text-primary outline-none"
            >
              <option value="all">Todas las categorías</option>
              {logTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {logTypeLabel(t.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-inter text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-[10px] bg-neutral-soft px-3 py-2 font-inter text-[13px] text-text-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-inter text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-[10px] bg-neutral-soft px-3 py-2 font-inter text-[13px] text-text-primary outline-none"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="self-end rounded-[10px] bg-neutral-soft px-3 py-2 font-inter text-[13px] font-medium text-text-secondary hover:bg-neutral-mid"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {error && (
          <div className="mb-4 rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 font-inter text-[13px] text-text-secondary">
            Cargando actividad...
          </div>
        )}

        {!loading && filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-soft text-text-secondary">
              <CheckCircle2 size={22} strokeWidth={1.6} />
            </div>
            <p className="font-inter text-[14px] font-medium text-text-primary">Sin eventos aún</p>
            <p className="font-inter text-[12px] text-text-secondary">
              {hasFilters
                ? "No hay actividad para los filtros seleccionados."
                : "Cuando ocurra algo en el sistema, lo verás aquí."}
            </p>
          </div>
        )}

        {!loading && filteredLogs.length > 0 && (
          <div className="flex flex-col gap-6">
            {groupedByDay.map((group) => (
              <section key={group.heading} className="flex flex-col">
                <h2 className="mb-2 px-1 font-inter text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
                  {group.heading}
                </h2>
                <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
                  {group.items.map(({ log, human }, idx) => {
                    const iconKey = logTypeIcon(log.logType.name);
                    const tone = TYPE_TONE[iconKey];
                    const Icon = ICONS[iconKey];
                    return (
                      <div
                        key={log.id}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2 ${
                          idx === group.items.length - 1 ? "" : "border-b border-border"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.bg} ${tone.text}`}
                          aria-hidden
                        >
                          <Icon size={16} strokeWidth={1.8} />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="font-inter text-[13.5px] leading-[19px] text-text-primary">
                            {human.title}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-inter text-[12px] text-text-secondary">
                            <span>{userDisplay(log.userId)}</span>
                            {human.detail && (
                              <>
                                <span aria-hidden>·</span>
                                <span className="truncate">{human.detail}</span>
                              </>
                            )}
                            <span aria-hidden>·</span>
                            <span>{logTypeLabel(log.logType.name)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end">
                          <span
                            className="font-inter text-[12px] text-text-body"
                            title={fullDateTime(log.createdAt)}
                          >
                            {relativeTime(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {meta.pages > 1 && (
          <div className="mt-6 flex items-center justify-between font-inter text-[12px] text-text-secondary">
            <span>
              Página {meta.page} de {meta.pages} — {meta.total} eventos
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="rounded-md border border-border bg-surface px-3 py-1.5 font-inter text-[12px] font-medium text-text-body hover:bg-surface-hover disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={page >= meta.pages || loading}
                className="rounded-md border border-border bg-surface px-3 py-1.5 font-inter text-[12px] font-medium text-text-body hover:bg-surface-hover disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
