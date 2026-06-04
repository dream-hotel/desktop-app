import { useEffect, useRef } from "react";

/** Default cadence for background data refreshes across the app. */
export const DEFAULT_POLL_INTERVAL_MS = 15000;

interface PollingOptions {
  intervalMs?: number;
  enabled?: boolean;
}

/**
 * Keeps data fresh without manual "refresh" buttons.
 *
 * Invokes `onPoll` on a fixed interval, and also immediately whenever the
 * window regains focus, the tab becomes visible, or the network reconnects —
 * so users see new data shortly after it appears. Polling pauses while the
 * tab is hidden to avoid useless background traffic.
 *
 * `onPoll` is expected to fetch in the background (no loading spinners) and
 * leave stale data in place on transient errors, so the UI never flickers.
 * The latest `onPoll` is always used without resetting the timer.
 */
export function usePolling(
  onPoll: () => void | Promise<void>,
  { intervalMs = DEFAULT_POLL_INTERVAL_MS, enabled = true }: PollingOptions = {},
) {
  const saved = useRef(onPoll);
  saved.current = onPoll;

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void saved.current();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };

    const interval = window.setInterval(tick, intervalMs);
    window.addEventListener("focus", tick);
    window.addEventListener("online", tick);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", tick);
      window.removeEventListener("online", tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, enabled]);
}
