import { useState, useCallback, useRef } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "ready"
  | "error";

export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<{ version: string; body?: string } | null>(null);
  // Porcentaje de descarga (0-100). -1 indica progreso indeterminado.
  const [progress, setProgress] = useState(0);

  // Guardamos el Update detectado para no volver a llamar a check() al instalar.
  const updateRef = useRef<Update | null>(null);

  const checkForUpdates = useCallback(async (silent = false) => {
    if (!silent) setStatus("checking");
    setError(null);

    try {
      const update = await check();
      if (update) {
        updateRef.current = update;
        setManifest({
          version: update.version,
          body: update.body,
        });
        setStatus("available");
        return update;
      } else {
        updateRef.current = null;
        setStatus("not-available");
        return null;
      }
    } catch {
      if (!silent) {
        setError("No pudimos buscar actualizaciones en este momento.");
        setStatus("error");
      }
      return null;
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    setStatus("downloading");
    setError(null);
    setProgress(0);

    try {
      // Reutilizamos el update ya detectado; si no existe (instalación directa), verificamos.
      const update = updateRef.current ?? (await check());
      if (!update) {
        setStatus("not-available");
        return;
      }

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0;
            setProgress(contentLength > 0 ? 0 : -1);
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setProgress(Math.min(100, Math.round((downloaded / contentLength) * 100)));
            }
            break;
          case "Finished":
            setProgress(100);
            break;
        }
      });

      setStatus("ready");
      // Reiniciar la aplicación para aplicar los cambios.
      await relaunch();
    } catch {
      setError("No pudimos instalar la actualización. Inténtalo nuevamente.");
      setStatus("error");
    }
  }, []);

  return {
    status,
    error,
    manifest,
    progress,
    checkForUpdates,
    downloadAndInstall,
  };
}
