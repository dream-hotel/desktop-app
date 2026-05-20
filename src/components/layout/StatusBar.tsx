import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSystemStatus } from "../../hooks/useSystemStatus";
import { UserRole } from "../../types/response/AuthResponse";

const ROLE_LABEL: Record<UserRole, string> = {
  administrador: "Administrador",
  recepcionista: "Recepcionista",
  cliente: "Operador",
};

type Tone = "ok" | "warn" | "error" | "neutral";

const TONE_DOT: Record<Tone, string> = {
  ok: "bg-[#16a34a]",
  warn: "bg-[#f59e0b]",
  error: "bg-[#dc2626]",
  neutral: "bg-[#9ca3af]",
};

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-[#065f46]",
  warn: "text-[#92400e]",
  error: "text-[#991b1b]",
  neutral: "text-text-secondary",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLastConnection(date: Date | null, now: Date): string {
  if (!date) return "Sin conexión previa registrada";
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (diffSec < 5) return "Última conexión hace instantes";
  if (diffSec < 60) return `Última conexión hace ${diffSec} s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Última conexión hace ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Última conexión hace ${diffHr} h`;
  const diffDays = Math.floor(diffHr / 24);
  return `Última conexión hace ${diffDays} d`;
}

export default function StatusBar() {
  const { isAuthenticated, user } = useAuth();
  const status = useSystemStatus(isAuthenticated);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const dbInfo: { label: string; tone: Tone } =
    status.database === "synced"
      ? { label: "Base de datos: sincronizada", tone: "ok" }
      : status.database === "down"
        ? { label: "Base de datos: sin conexión", tone: "error" }
        : status.database === "checking"
          ? { label: "Base de datos: verificando…", tone: "neutral" }
          : { label: "Base de datos: estado desconocido", tone: "warn" };

  const serverInfo: { label: string; tone: Tone } =
    status.network === "offline"
      ? { label: "Sin red local", tone: "error" }
      : status.server === "online"
        ? {
            label: status.latencyMs !== null ? `En línea (${status.latencyMs} ms)` : "En línea",
            tone: "ok",
          }
        : status.server === "offline"
          ? { label: "Servidor sin conexión", tone: "error" }
          : { label: "Conectando…", tone: "neutral" };

  const hasConnectionIssue =
    status.network === "offline" ||
    status.server === "offline" ||
    status.database === "down" ||
    status.database === "unknown";

  const lastConnectionLabel = formatLastConnection(status.lastOnlineAt, now);

  const roleLabel = user ? ROLE_LABEL[user.role] : "Sin sesión";

  return (
    <footer className="flex h-8 w-full shrink-0 items-center justify-between border-t border-border bg-white px-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={status.refresh}
          title={`${dbInfo.label}. Haga clic para volver a verificar.`}
          className="flex items-center gap-[6px] rounded-md px-1 py-0.5 font-inter text-[11px] leading-[16.5px] transition-colors hover:bg-[#f3f4f6]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <ellipse cx="6" cy="3" rx="4" ry="1.5" stroke="#6b7280" strokeWidth="1" />
            <path d="M2 3v6c0 .8 1.8 1.5 4 1.5s4-.7 4-1.5V3" stroke="#6b7280" strokeWidth="1" />
            <path d="M2 6c0 .8 1.8 1.5 4 1.5s4-.7 4-1.5" stroke="#6b7280" strokeWidth="1" />
          </svg>
          <span className={TONE_TEXT[dbInfo.tone]}>{dbInfo.label}</span>
          <span className={`h-[6px] w-[6px] rounded-full ${TONE_DOT[dbInfo.tone]}`} />
        </button>

        <div
          className="flex items-center gap-[6px] font-inter text-[11px] leading-[16.5px]"
          title={serverInfo.label}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            {status.network === "online" && status.server === "online" ? (
              <>
                <path d="M2 7a4 4 0 018 0" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
                <path d="M4 8.5a2 2 0 014 0" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
                <circle cx="6" cy="10" r="0.6" fill="#6b7280" />
              </>
            ) : (
              <>
                <path d="M2 7a4 4 0 018 0" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
                <path d="M2 2l8 8" stroke="#dc2626" strokeWidth="1" strokeLinecap="round" />
              </>
            )}
          </svg>
          <span className={TONE_TEXT[serverInfo.tone]}>{serverInfo.label}</span>
          <span className={`h-[6px] w-[6px] rounded-full ${TONE_DOT[serverInfo.tone]}`} />
        </div>

        {hasConnectionIssue && (
          <span className="font-inter text-[11px] text-[#991b1b]" title={lastConnectionLabel}>
            {lastConnectionLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="font-inter text-[11px] text-text-secondary">
          {user ? `Vista de ${roleLabel}` : "Sin sesión"}
        </span>
        <div className="h-3 w-px bg-black/10" />
        <div
          className="flex items-center gap-[6px] font-inter text-[11px] text-text-secondary"
          title={formatDate(now)}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#6b7280" strokeWidth="1" />
            <path d="M6 3v3l2 1" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span>{formatTime(now)}</span>
        </div>
      </div>
    </footer>
  );
}
