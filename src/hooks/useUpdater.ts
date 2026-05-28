import { useState, useCallback } from "react";
import { check } from "@tauri-apps/plugin-updater";
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

  const checkForUpdates = useCallback(async (silent = false) => {
    if (!silent) setStatus("checking");
    setError(null);

    try {
      const update = await check();
      if (update) {
        setManifest({
          version: update.version,
          body: update.body,
        });
        setStatus("available");
        return update;
      } else {
        setStatus("not-available");
        return null;
      }
    } catch (err) {
      console.error("Error checking for updates:", err);
      if (!silent) {
        setError(err instanceof Error ? err.message : "Error al buscar actualizaciones.");
        setStatus("error");
      }
      return null;
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    setStatus("downloading");
    setError(null);

    try {
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        setStatus("ready");
        // Reiniciar la aplicación para aplicar los cambios
        await relaunch();
      }
    } catch (err) {
      console.error("Error downloading update:", err);
      setError(err instanceof Error ? err.message : "Error al descargar la actualización.");
      setStatus("error");
    }
  }, []);

  return {
    status,
    error,
    manifest,
    checkForUpdates,
    downloadAndInstall,
  };
}
