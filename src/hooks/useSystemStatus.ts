import { useCallback, useEffect, useRef, useState } from "react";
import { checkHealth, ComponentStatus } from "../service/healthService";

export type ConnectivityState = "checking" | "online" | "offline";
export type DatabaseState = "checking" | "synced" | "down" | "unknown";

export interface SystemStatus {
  network: "online" | "offline";
  server: ConnectivityState;
  database: DatabaseState;
  lastCheckedAt: Date | null;
  lastOnlineAt: Date | null;
  latencyMs: number | null;
  refresh: () => void;
}

const POLL_INTERVAL_MS = 15000;

function readComponent(
  details: Record<string, { status: ComponentStatus }> | undefined,
  key: string,
): ComponentStatus | undefined {
  return details?.[key]?.status;
}

export function useSystemStatus(enabled: boolean = true): SystemStatus {
  const [network, setNetwork] = useState<"online" | "offline">(
    typeof navigator !== "undefined" && "onLine" in navigator ? (navigator.onLine ? "online" : "offline") : "online",
  );
  const [server, setServer] = useState<ConnectivityState>("checking");
  const [database, setDatabase] = useState<DatabaseState>("checking");
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const runCheck = useCallback(async () => {
    if (!enabledRef.current) return;

    if (typeof navigator !== "undefined" && "onLine" in navigator && !navigator.onLine) {
      setServer("offline");
      setDatabase("unknown");
      setLatencyMs(null);
      setLastCheckedAt(new Date());
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const startedAt = performance.now();
    try {
      const response = await checkHealth(controller.signal);
      if (controller.signal.aborted) return;

      const dbStatus = readComponent(response.details, "database");
      const isServerOnline = response.status === "ok" || response.status === "error";
      setServer(isServerOnline ? "online" : "offline");
      if (dbStatus === "up") setDatabase("synced");
      else if (dbStatus === "down") setDatabase("down");
      else setDatabase("unknown");
      setLatencyMs(Math.round(performance.now() - startedAt));
      if (isServerOnline && dbStatus === "up") setLastOnlineAt(new Date());
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setServer("offline");
      setDatabase("unknown");
      setLatencyMs(null);
    } finally {
      if (!controller.signal.aborted) setLastCheckedAt(new Date());
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function handleOnline() {
      setNetwork("online");
      runCheck();
    }
    function handleOffline() {
      setNetwork("offline");
      setServer("offline");
      setDatabase("unknown");
      setLatencyMs(null);
      setLastCheckedAt(new Date());
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") runCheck();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    runCheck();
    const interval = window.setInterval(runCheck, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [enabled, runCheck]);

  return {
    network,
    server,
    database,
    lastCheckedAt,
    lastOnlineAt,
    latencyMs,
    refresh: runCheck,
  };
}
