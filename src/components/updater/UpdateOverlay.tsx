import { Download, RefreshCw } from "lucide-react";
import type { UpdateStatus } from "../../hooks/useUpdater";

interface UpdateOverlayProps {
  status: UpdateStatus;
  /** 0-100, o -1 para progreso indeterminado. */
  progress: number;
  version?: string;
}

/**
 * Pantalla completa que se muestra mientras se aplica una actualización
 * automática al iniciar la aplicación. Bloquea la interacción e informa al
 * usuario de que la app se reiniciará en breve.
 */
export default function UpdateOverlay({ status, progress, version }: UpdateOverlayProps) {
  const indeterminate = progress < 0;
  const isReady = status === "ready";

  const title = isReady ? "Reiniciando…" : "Actualizando aplicación";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-overlay backdrop-blur-sm">
      <div className="flex w-[420px] flex-col items-center gap-5 rounded-[18px] bg-surface px-8 py-9 text-center shadow-[0px_24px_60px_rgba(0,0,0,0.28)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {isReady ? (
            <RefreshCw size={28} strokeWidth={1.8} className="animate-spin text-primary" />
          ) : (
            <Download size={28} strokeWidth={1.8} className="text-primary" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="font-alexandria text-[22px] font-normal leading-[26px] text-text-primary">
            {title}
          </h2>
          <p className="font-inter text-[13px] leading-[19px] text-text-body">
            {isReady ? (
              <>La aplicación se está reiniciando para completar la actualización.</>
            ) : (
              <>
                Se está instalando una nueva versión
                {version && (
                  <>
                    {" "}
                    <span className="font-semibold text-primary">v{version}</span>
                  </>
                )}
                . La aplicación se reiniciará en breve.
              </>
            )}
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="flex w-full flex-col gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-mid">
            {indeterminate ? (
              <div className="h-full w-1/3 animate-[updaterSlide_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
            ) : (
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                style={{ width: `${isReady ? 100 : progress}%` }}
              />
            )}
          </div>
          <span className="font-inter text-[12px] text-text-secondary">
            {isReady
              ? "Listo"
              : indeterminate
              ? "Descargando actualización…"
              : `Descargando… ${progress}%`}
          </span>
        </div>

        <p className="font-inter text-[11px] leading-[16px] text-text-secondary/80">
          Por favor, no cierres la ventana durante este proceso.
        </p>
      </div>

      <style>{`
        @keyframes updaterSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
