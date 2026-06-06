import { useEffect, useRef } from "react";
import { subscribeToResource, type ResourceTopic } from "../service/realtime";

/**
 * Safety-net cadence for background refreshes. Real-time events (Laravel
 * Reverb) are the primary freshness mechanism now, so this only needs to be
 * a slow fallback that catches anything a missed/then-reconnected socket
 * didn't deliver.
 */
export const DEFAULT_POLL_INTERVAL_MS = 60000;

interface PollingOptions {
  intervalMs?: number;
  enabled?: boolean;
  /**
   * Real-time topics that should trigger an immediate refresh when the backend
   * broadcasts a change. When omitted the hook behaves as a pure timer.
   */
  resources?: ResourceTopic[];
}

/**
 * Keeps data fresh with minimal traffic.
 *
 * Primary: subscribes to real-time `resources` and refetches (debounced)
 * the instant the backend reports a create/update/delete.
 *
 * Fallbacks (resilience): also refetches when the window regains focus, the
 * tab becomes visible or the network reconnects, plus a slow periodic tick —
 * so the UI self-heals after a dropped WebSocket. Refreshes pause while the
 * tab is hidden to avoid useless background work.
 *
 * `onPoll` is expected to fetch in the background (no spinners) and keep stale
 * data on transient errors, so the UI never flickers.
 */
export function usePolling(
  onPoll: () => void | Promise<void>,
  { intervalMs = DEFAULT_POLL_INTERVAL_MS, enabled = true, resources = [] }: PollingOptions = {},
) {
  const saved = useRef(onPoll);
  saved.current = onPoll;

  // Stable dependency so we don't re-subscribe on every render.
  const resourcesKey = resources.join(",");

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void saved.current();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };

    // Coalesce bursts of real-time events into a single refetch.
    let debounce: number | undefined;
    const onRealtime = () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(tick, 250);
    };

    const topics = (resourcesKey ? resourcesKey.split(",") : []) as ResourceTopic[];
    const unsubscribers = topics.map((topic) => subscribeToResource(topic, onRealtime));

    const interval = window.setInterval(tick, intervalMs);
    window.addEventListener("focus", tick);
    window.addEventListener("online", tick);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearTimeout(debounce);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      window.clearInterval(interval);
      window.removeEventListener("focus", tick);
      window.removeEventListener("online", tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, enabled, resourcesKey]);
}
