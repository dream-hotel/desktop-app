import { useEffect, useRef } from "react";
import { useUpdater } from "../../hooks/useUpdater";
import UpdateOverlay from "./UpdateOverlay";

/**
 * Verifica si hay una actualización disponible al iniciar la aplicación.
 * Si la hay, muestra un overlay informativo y aplica la actualización de
 * forma automática (descarga, instala y reinicia).
 *
 * Si no hay actualización, o si ocurre un error (p. ej. en desarrollo, donde
 * el updater no está disponible), no renderiza nada y la app continúa normal.
 */
export default function AutoUpdater() {
  const { status, progress, manifest, checkForUpdates, downloadAndInstall } = useUpdater();
  const startedRef = useRef(false);

  useEffect(() => {
    // Garantiza que la verificación se ejecute una sola vez por arranque.
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      const update = await checkForUpdates(true); // verificación silenciosa
      if (update) {
        await downloadAndInstall();
      }
    })();
  }, [checkForUpdates, downloadAndInstall]);

  // Mostramos el overlay desde que se detecta la actualización hasta el reinicio.
  const isUpdating = status === "available" || status === "downloading" || status === "ready";
  if (!isUpdating) return null;

  return <UpdateOverlay status={status} progress={progress} version={manifest?.version} />;
}
