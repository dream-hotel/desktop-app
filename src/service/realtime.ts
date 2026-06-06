import Echo from "laravel-echo";
import Pusher from "pusher-js";

/**
 * Real-time layer backed by Pusher Channels (hosted WebSocket cloud).
 *
 * Works on shared hosting (e.g. Hostinger Business) because the WebSocket
 * server lives in Pusher's cloud — the Laravel backend only publishes events
 * to it over HTTPS. The backend broadcasts a lightweight
 * `{ resource, action, id }` signal on a public channel `resource.<name>`
 * whenever any record of that resource is created/updated/deleted. The UI
 * reacts by re-fetching through the normal authenticated REST API — so no
 * record data ever travels over the socket.
 *
 * Design goals:
 *  - Single shared Echo connection for the whole app.
 *  - One channel per resource, reference-counted: the channel is left only
 *    when its last subscriber unsubscribes.
 *  - Graceful degradation: if Pusher isn't configured or is unreachable,
 *    `subscribeToResource` is a harmless no-op and the app keeps working via
 *    its periodic refresh fallback.
 */

export type ResourceTopic =
  | "tasks"
  | "announcements"
  | "schedules"
  | "users"
  | "wiki"
  | "activity";

export interface ResourceChange {
  resource: ResourceTopic;
  action: "created" | "updated" | "deleted" | "restored";
  id: number | string | null;
  at: string;
}

type ChangeHandler = (change: ResourceChange) => void;

const EVENT_NAME = ".changed"; // leading dot = custom broadcastAs name

let echo: Echo<"pusher"> | null = null;
let echoInitTried = false;

/** Lazily build the singleton Echo client. Returns null if not configurable. */
function getEcho(): Echo<"pusher"> | null {
  if (echo || echoInitTried) return echo;
  echoInitTried = true;

  const key = import.meta.env.VITE_PUSHER_APP_KEY;
  const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;

  // Without a key the real-time layer stays disabled (polling keeps the UI fresh).
  if (!key) return null;

  try {
    // laravel-echo's Pusher connector expects Pusher on the global scope.
    (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

    echo = new Echo({
      broadcaster: "pusher",
      key,
      cluster: cluster || "mt1",
      forceTLS: true,
      enabledTransports: ["ws", "wss"],
    });
  } catch (err) {
    console.warn("[realtime] Echo init failed; falling back to polling.", err);
    echo = null;
  }

  return echo;
}

// Reference-counted handler sets, one per resource topic.
const handlers = new Map<ResourceTopic, Set<ChangeHandler>>();

/**
 * Subscribe to change signals for a resource.
 * Returns an unsubscribe function (safe to call once).
 */
export function subscribeToResource(
  resource: ResourceTopic,
  handler: ChangeHandler,
): () => void {
  const client = getEcho();
  if (!client) return () => {}; // real-time disabled → no-op

  let set = handlers.get(resource);
  if (!set) {
    set = new Set();
    handlers.set(resource, set);

    client.channel(`resource.${resource}`).listen(EVENT_NAME, (payload: ResourceChange) => {
      const current = handlers.get(resource);
      if (!current) return;
      for (const fn of current) {
        try {
          fn(payload);
        } catch (err) {
          console.warn(`[realtime] handler error for "${resource}"`, err);
        }
      }
    });
  }

  set.add(handler);

  return () => {
    const current = handlers.get(resource);
    if (!current) return;
    current.delete(handler);
    if (current.size === 0) {
      handlers.delete(resource);
      try {
        client.leaveChannel(`resource.${resource}`);
      } catch {
        // ignore: connection may already be gone
      }
    }
  };
}

/** Tear down the whole connection (e.g. on logout). Optional. */
export function disconnectRealtime(): void {
  handlers.clear();
  if (echo) {
    try {
      echo.disconnect();
    } catch {
      // ignore
    }
    echo = null;
    echoInitTried = false;
  }
}
