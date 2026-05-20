import { API_URL } from "./apiConfig";

export type ComponentStatus = "up" | "down";

export interface HealthResponse {
  status: "ok" | "error" | "shutting_down";
  info?: Record<string, { status: ComponentStatus }>;
  error?: Record<string, { status: ComponentStatus }>;
  details: Record<string, { status: ComponentStatus }>;
}

const HEALTH_TIMEOUT_MS = 5000;

export async function checkHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  const upstream = signal;
  if (upstream) {
    if (upstream.aborted) controller.abort();
    else upstream.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    const body = (await response.json().catch(() => ({}))) as Partial<HealthResponse>;

    if (!response.ok && response.status !== 503) {
      throw new Error(`HTTP ${response.status}`);
    }

    return {
      status: (body.status as HealthResponse["status"]) ?? (response.ok ? "ok" : "error"),
      info: body.info,
      error: body.error,
      details: body.details ?? {},
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
