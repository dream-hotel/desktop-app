import { useEffect, useRef } from "react";
import { useUpdater } from "../../hooks/useUpdater";
import UpdateOverlay from "./UpdateOverlay";

const checkUpdatesOnStartup =
  import.meta.env.VITE_CHECK_UPDATES_ON_STARTUP?.toLowerCase() !== "false";

/**
 * Verifica si hay una actualización disponible al iniciar la aplicación.
 * Si la hay, muestra un overlay informativo y aplica la actualización de
 * forma automática (descarga, instala y reinicia).
 *
 * La verificación puede desactivarse con VITE_CHECK_UPDATES_ON_STARTUP=false.
 * Si la variable no está definida, conserva el comportamiento anterior y
 * verifica las actualizaciones.
 *
 * Si no hay actualización o no puede comprobarse, la aplicación continúa
 * normalmente sin interrumpir al usuario.
 */
export default function AutoUpdater() {
  const { status, progress, manifest, checkForUpdates, downloadAndInstall } = useUpdater();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!checkUpdatesOnStartup) return;

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
