/**
 * Detección de plataforma para ajustar UI multiplataforma (atajos, etiquetas).
 *
 * Tauri expone navigator estándar. Preferimos userAgentData cuando existe;
 * caemos a navigator.platform / userAgent para compatibilidad amplia.
 */

export type Platform = "macos" | "windows" | "linux" | "other";

function detect(): Platform {
  if (typeof navigator === "undefined") return "other";

  const uaData = (navigator as Navigator & {
    userAgentData?: { platform?: string };
  }).userAgentData;

  const raw = (uaData?.platform || navigator.platform || navigator.userAgent || "").toLowerCase();

  if (raw.includes("mac") || raw.includes("darwin") || raw.includes("iphone") || raw.includes("ipad")) {
    return "macos";
  }
  if (raw.includes("win")) return "windows";
  if (raw.includes("linux")) return "linux";
  return "other";
}

// Se resuelve una sola vez por carga — la plataforma no cambia en runtime.
const PLATFORM: Platform = detect();

export function getPlatform(): Platform {
  return PLATFORM;
}

export function isMac(): boolean {
  return PLATFORM === "macos";
}

/** Devuelve la etiqueta del modificador principal según OS. */
export function modKeyLabel(): string {
  return isMac() ? "⌘" : "Ctrl";
}

/** Para detectar el modificador en un evento de teclado. */
export function isModPressed(event: KeyboardEvent | React.KeyboardEvent): boolean {
  return isMac() ? event.metaKey : event.ctrlKey;
}

/** Construye un atajo legible: shortcut("B") → "⌘B" o "Ctrl+B". */
export function shortcut(...keys: string[]): string {
  const sep = isMac() ? "" : "+";
  return [modKeyLabel(), ...keys].join(sep);
}

export function usePlatform(): Platform {
  return PLATFORM;
}
