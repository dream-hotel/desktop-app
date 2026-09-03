import { useEffect, useState } from "react";
import { CheckCircle2, Clock, LoaderCircle, WifiOff } from "lucide-react";
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
  ok: "bg-success",
  warn: "bg-warning",
  error: "bg-danger",
  neutral: "bg-neutral-mid",
};

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-success",
  warn: "text-warning",
  error: "text-danger",
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

  const connectionInfo: { label: string; tone: Tone } =
    status.network === "offline" || status.server === "offline"
      ? { label: "Sin conexión", tone: "error" }
      : status.database === "down" || status.database === "unknown"
        ? { label: "Servicio temporalmente no disponible", tone: "warn" }
        : status.server === "checking" || status.database === "checking"
          ? { label: "Preparando tu espacio…", tone: "neutral" }
          : { label: "Todo listo", tone: "ok" };

  const hasConnectionIssue =
    status.network === "offline" ||
    status.server === "offline" ||
    status.database === "down" ||
    status.database === "unknown";

  const lastConnectionLabel = formatLastConnection(status.lastOnlineAt, now);

  const roleLabel = user ? ROLE_LABEL[user.role] : "Sin sesión";

  return (
    <footer className="flex h-8 w-full shrink-0 items-center justify-between border-t border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={status.refresh}
          title={`${connectionInfo.label}. Haz clic para comprobar nuevamente.`}
          className="flex items-center gap-[6px] rounded-md px-1 py-0.5 font-inter text-[11px] leading-[16.5px] transition-colors hover:bg-neutral-soft"
        >
          {connectionInfo.tone === "ok" ? (
            <CheckCircle2 size={12} strokeWidth={1.7} className="text-success" />
          ) : connectionInfo.tone === "neutral" ? (
            <LoaderCircle size={12} strokeWidth={1.7} className="animate-spin text-text-secondary" />
          ) : (
            <WifiOff size={12} strokeWidth={1.7} className={TONE_TEXT[connectionInfo.tone]} />
          )}
          <span className={TONE_TEXT[connectionInfo.tone]}>{connectionInfo.label}</span>
          <span className={`h-[6px] w-[6px] rounded-full ${TONE_DOT[connectionInfo.tone]}`} />
        </button>

        {hasConnectionIssue && (
          <span className="font-inter text-[11px] text-danger" title={lastConnectionLabel}>
            {lastConnectionLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="font-inter text-[11px] text-text-secondary">
          {user ? `Vista de ${roleLabel}` : "Sin sesión"}
        </span>
        <div className="h-3 w-px bg-border-strong" />
        <div
          className="flex items-center gap-[6px] font-inter text-[11px] text-text-secondary"
          title={formatDate(now)}
        >
          <Clock size={11} strokeWidth={1.6} className="text-text-secondary" />
          <span>{formatTime(now)}</span>
        </div>
      </div>
    </footer>
  );
}
