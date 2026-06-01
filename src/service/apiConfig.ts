export const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error(
    "VITE_API_URL no está definido. Copiá .env.example a .env y configurá la URL del backend."
  );
}

export function getFullUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (API_URL.startsWith("https://")) {
      return url.replace(/^http:\/\//i, "https://");
    }
    return url;
  }
  try {
    const urlObj = new URL(API_URL);
    const host = `${urlObj.protocol}//${urlObj.host}`;
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${host}${cleanUrl}`;
  } catch {
    return url;
  }
}
