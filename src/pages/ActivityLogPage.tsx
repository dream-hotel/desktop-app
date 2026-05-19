import { useCallback, useEffect, useState } from "react";
import {
  BackendSystemLog,
  FindLogsQuery,
  LOG_TYPE_COLORS,
  LogType,
  logTypeLabel,
} from "../types/models/Activity";
import { listActivityLogs, listLogTypes } from "../service/activityService";

const PAGE_SIZE = 15;

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
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
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `Hace ${diffHr} h`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `Hace ${diffDay} d`;
    return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

function toIsoStart(date: string): string | undefined {
  if (!date) return undefined;
  return `${date}T00:00:00.000Z`;
}

function toIsoEnd(date: string): string | undefined {
  if (!date) return undefined;
  return `${date}T23:59:59.999Z`;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<BackendSystemLog[]>([]);
  const [logTypes, setLogTypes] = useState<LogType[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_SIZE, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [logTypeFilter, setLogTypeFilter] = useState<number | "all">("all");
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listLogTypes()
      .then(setLogTypes)
      .catch(() => setLogTypes([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [logTypeFilter, userIdFilter, dateFrom, dateTo]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: FindLogsQuery = { page, limit: PAGE_SIZE };
      if (logTypeFilter !== "all") query.logTypeId = logTypeFilter;
      const parsedUserId = userIdFilter ? Number(userIdFilter) : NaN;
      if (Number.isInteger(parsedUserId) && parsedUserId > 0) query.userId = parsedUserId;
      const isoFrom = toIsoStart(dateFrom);
      const isoTo = toIsoEnd(dateTo);
      if (isoFrom) query.dateFrom = isoFrom;
      if (isoTo) query.dateTo = isoTo;
      const result = await listActivityLogs(query);
      setLogs(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, logTypeFilter, userIdFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function clearFilters() {
    setLogTypeFilter("all");
    setUserIdFilter("");
    setDateFrom("");
    setDateTo("");
  }

  const hasFilters =
    logTypeFilter !== "all" || userIdFilter !== "" || dateFrom !== "" || dateTo !== "";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border px-8 pb-5 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-alexandria text-[31px] font-normal leading-[30px] text-text-primary">
              Registro de Actividad
            </h1>
            <p className="mt-1 font-inter text-[13px] text-text-secondary">
              Eventos del sistema en orden cronológico. {meta.total} {meta.total === 1 ? "evento" : "eventos"}.
            </p>
          </div>
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="flex items-center gap-[9px] rounded-[10px] border border-border bg-white px-3 py-[6px] font-inter text-[13px] font-medium text-text-body disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8a6 6 0 0110.5-4M14 8a6 6 0 01-10.5 4M12.5 1.5V4H10M3.5 14.5V12H6"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Actualizar
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-inter text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              Tipo
            </label>
            <select
              value={logTypeFilter === "all" ? "all" : String(logTypeFilter)}
              onChange={(e) =>
                setLogTypeFilter(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className="rounded-[10px] bg-[#f3f4f6] px-3 py-2 font-inter text-[13px] text-text-primary outline-none"
            >
              <option value="all">Todos</option>
              {logTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {logTypeLabel(t.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-inter text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              ID de usuario
            </label>
            <input
              type="number"
              min={1}
              placeholder="—"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="w-[120px] rounded-[10px] bg-[#f3f4f6] px-3 py-2 font-inter text-[13px] text-text-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-inter text-[11px] font-medium uppercase tracking-wide text-text-secondary">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-[10px] bg-[#f3f4f6] px-3 py-2 font-inter text-[13px] text-text-primary outline-none"
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
              className="rounded-[10px] bg-[#f3f4f6] px-3 py-2 font-inter text-[13px] text-text-primary outline-none"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="self-end rounded-[10px] bg-[#f3f4f6] px-3 py-2 font-inter text-[13px] font-medium text-text-secondary hover:bg-[#e5e7eb]"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-5">
        {error && (
          <div className="mb-4 rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-[#fee2e2] px-3 py-2 font-inter text-[12px] text-[#991b1b]">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-[12px] border border-border bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-[#fafafa]">
                <th className="w-[110px] px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                  Tipo
                </th>
                <th className="px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                  Evento
                </th>
                <th className="w-[110px] px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                  Usuario
                </th>
                <th className="w-[210px] px-5 py-3 text-right font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center font-inter text-[13px] text-text-secondary">
                    Cargando registro de actividad...
                  </td>
                </tr>
              )}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center font-inter text-[13px] text-text-secondary">
                    No hay eventos para los filtros seleccionados.
                  </td>
                </tr>
              )}
              {!loading &&
                logs.map((log) => {
                  const colors =
                    LOG_TYPE_COLORS[log.logType.name.toLowerCase()] ?? {
                      bg: "#e5e7eb",
                      text: "#374151",
                    };
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-b-0 hover:bg-[#fcfbfd]"
                    >
                      <td className="px-5 py-3 align-top">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px]"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {logTypeLabel(log.logType.name)}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-top font-inter text-[13px] text-text-body">
                        {log.message}
                      </td>
                      <td className="px-5 py-3 align-top font-inter text-[12px] text-text-secondary">
                        {log.userId !== null ? `#${log.userId}` : "Sistema"}
                      </td>
                      <td className="px-5 py-3 align-top text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-inter text-[12px] text-text-body">
                            {formatDateTime(log.createdAt)}
                          </span>
                          <span className="font-inter text-[11px] text-text-secondary">
                            {relativeTime(log.createdAt)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {meta.pages > 1 && (
          <div className="mt-4 flex items-center justify-between font-inter text-[12px] text-text-secondary">
            <span>
              Página {meta.page} de {meta.pages} — {meta.total} resultados
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="rounded-md border border-border bg-white px-3 py-1.5 font-inter text-[12px] font-medium text-text-body disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={page >= meta.pages || loading}
                className="rounded-md border border-border bg-white px-3 py-1.5 font-inter text-[12px] font-medium text-text-body disabled:opacity-40"
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
