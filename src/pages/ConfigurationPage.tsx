import { useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { ThemePreference } from "../state/ThemeContext";

const WELCOME_MODAL_KEY = "app:show-welcome-modal";

function readWelcomeModalEnabled(): boolean {
  try {
    const v = localStorage.getItem(WELCOME_MODAL_KEY);
    return v == null ? true : v === "true";
  } catch {
    return true;
  }
}

function writeWelcomeModalEnabled(v: boolean): void {
  try {
    localStorage.setItem(WELCOME_MODAL_KEY, String(v));
  } catch {
    /* ignore */
  }
}

interface ThemeOptionProps {
  id: ThemePreference;
  label: string;
  description: string;
  active: boolean;
  onSelect: () => void;
  preview: React.ReactNode;
}

function ThemeOption({ id, label, description, active, onSelect, preview }: ThemeOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={`group flex flex-col gap-3 rounded-[14px] border bg-surface p-3 text-left transition-colors ${
        active
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/40"
      }`}
      aria-pressed={active}
      data-theme-option={id}
    >
      {preview}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span
            className={`font-inter text-[13px] font-medium ${
              active ? "text-primary" : "text-text-primary"
            }`}
          >
            {label}
          </span>
          <span className="font-inter text-[11px] leading-snug text-text-secondary">
            {description}
          </span>
        </div>
        <span
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
            active ? "border-primary bg-primary text-white" : "border-border-strong bg-surface"
          }`}
          aria-hidden
        >
          {active && (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </div>
    </button>
  );
}

function LightPreview() {
  return (
    <div className="flex h-[78px] overflow-hidden rounded-[10px] border border-black/8 bg-[#fbfbfb]">
      <div className="flex w-[28%] flex-col gap-1.5 border-r border-black/6 bg-[#ffffff] p-2">
        <span className="h-1.5 w-2/3 rounded-full bg-[#492173]" />
        <span className="h-1 w-3/4 rounded-full bg-black/8" />
        <span className="h-1 w-1/2 rounded-full bg-black/8" />
        <span className="h-1 w-2/3 rounded-full bg-black/8" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <span className="h-1.5 w-1/2 rounded-full bg-black/15" />
        <span className="h-1 w-3/4 rounded-full bg-black/8" />
        <span className="mt-auto h-3 w-12 rounded-md bg-[#492173]" />
      </div>
    </div>
  );
}

function DarkPreview() {
  return (
    <div className="flex h-[78px] overflow-hidden rounded-[10px] border border-white/10 bg-[#0e0e10]">
      <div className="flex w-[28%] flex-col gap-1.5 border-r border-white/8 bg-[#17171a] p-2">
        <span className="h-1.5 w-2/3 rounded-full bg-[#b39ddb]" />
        <span className="h-1 w-3/4 rounded-full bg-white/12" />
        <span className="h-1 w-1/2 rounded-full bg-white/12" />
        <span className="h-1 w-2/3 rounded-full bg-white/12" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <span className="h-1.5 w-1/2 rounded-full bg-white/30" />
        <span className="h-1 w-3/4 rounded-full bg-white/12" />
        <span className="mt-auto h-3 w-12 rounded-md bg-[#b39ddb]" />
      </div>
    </div>
  );
}

function SystemPreview() {
  return (
    <div className="relative flex h-[78px] overflow-hidden rounded-[10px] border border-border bg-[#fbfbfb]">
      <div className="flex w-1/2 flex-col gap-1.5 bg-[#fbfbfb] p-2">
        <span className="h-1.5 w-2/3 rounded-full bg-[#492173]" />
        <span className="h-1 w-3/4 rounded-full bg-black/10" />
        <span className="h-1 w-1/2 rounded-full bg-black/10" />
      </div>
      <div className="flex w-1/2 flex-col gap-1.5 bg-[#0e0e10] p-2">
        <span className="h-1.5 w-2/3 rounded-full bg-[#b39ddb]" />
        <span className="h-1 w-3/4 rounded-full bg-white/12" />
        <span className="h-1 w-1/2 rounded-full bg-white/12" />
      </div>
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-strong" />
    </div>
  );
}

export default function ConfigurationPage() {
  const { preference, resolved, setPreference } = useTheme();
  const [welcomeEnabled, setWelcomeEnabled] = useState<boolean>(() => readWelcomeModalEnabled());

  useEffect(() => {
    writeWelcomeModalEnabled(welcomeEnabled);
  }, [welcomeEnabled]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg">
      <header className="flex items-start justify-between border-b border-border bg-surface px-8 pb-4 pt-6">
        <div className="flex flex-col gap-[2px]">
          <h1 className="m-0 font-alexandria text-[28px] font-medium leading-9 text-text-primary">
            Configuración
          </h1>
          <p className="m-0 font-inter text-[13px] leading-[19.5px] text-text-secondary">
            Preferencias generales de la aplicación.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto flex max-w-[860px] flex-col gap-5">
          {/* Apariencia */}
          <section className="overflow-hidden rounded-[14px] border border-border bg-surface">
            <div className="flex items-start gap-3 border-b border-border px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h2 className="font-alexandria text-[16px] font-medium leading-tight text-text-primary">
                  Apariencia
                </h2>
                <p className="mt-0.5 font-inter text-[12px] text-text-secondary">
                  Elige cómo se ve la aplicación. La opción "Sistema" sigue las preferencias de tu equipo.
                </p>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ThemeOption
                  id="light"
                  label="Claro"
                  description="Interfaz luminosa, ideal para entornos bien iluminados."
                  active={preference === "light"}
                  onSelect={() => setPreference("light")}
                  preview={<LightPreview />}
                />
                <ThemeOption
                  id="dark"
                  label="Oscuro"
                  description="Interfaz tenue, reduce el cansancio visual en la noche."
                  active={preference === "dark"}
                  onSelect={() => setPreference("dark")}
                  preview={<DarkPreview />}
                />
                <ThemeOption
                  id="system"
                  label="Sistema"
                  description="Se adapta automáticamente al tema del sistema operativo."
                  active={preference === "system"}
                  onSelect={() => setPreference("system")}
                  preview={<SystemPreview />}
                />
              </div>

              <div className="mt-4 flex items-center justify-between rounded-[10px] border border-border bg-surface-2 px-4 py-2.5 font-inter text-[12px] text-text-secondary">
                <span>
                  Tema actual:{" "}
                  <span className="font-medium text-text-primary">
                    {resolved === "dark" ? "Oscuro" : "Claro"}
                  </span>
                  {preference === "system" && (
                    <span className="ml-1 text-text-secondary">(siguiendo al sistema)</span>
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* Notificaciones */}
          <section className="overflow-hidden rounded-[14px] border border-border bg-surface">
            <div className="flex items-start gap-3 border-b border-border px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2a4 4 0 00-4 4v2.5l-1 2h10l-1-2V6a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M6.5 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h2 className="font-alexandria text-[16px] font-medium leading-tight text-text-primary">
                  Notificaciones
                </h2>
                <p className="mt-0.5 font-inter text-[12px] text-text-secondary">
                  Controla cómo se muestran los avisos al iniciar sesión.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex flex-col">
                <span className="font-inter text-[13px] font-medium text-text-primary">
                  Mostrar anuncios al iniciar sesión
                </span>
                <span className="mt-0.5 font-inter text-[12px] text-text-secondary">
                  Aparece una ventana con los anuncios nuevos cuando entras al Dashboard.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWelcomeEnabled((v) => !v)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  welcomeEnabled ? "bg-primary" : "bg-border-strong"
                }`}
                aria-pressed={welcomeEnabled}
                aria-label="Alternar ventana de bienvenida"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-surface shadow transition-all ${
                    welcomeEnabled ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Acerca de */}
          <section className="overflow-hidden rounded-[14px] border border-border bg-surface">
            <div className="flex items-start gap-3 border-b border-border px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h2 className="font-alexandria text-[16px] font-medium leading-tight text-text-primary">
                  Acerca de la aplicación
                </h2>
                <p className="mt-0.5 font-inter text-[12px] text-text-secondary">
                  Información del sistema y versión instalada.
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 px-6 py-5 font-inter text-[13px] sm:grid-cols-2">
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-text-secondary">
                  Aplicación
                </dt>
                <dd className="text-text-primary">Dream by Stannum</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-text-secondary">
                  Versión
                </dt>
                <dd className="text-text-primary">1.0.0</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-text-secondary">
                  Entorno
                </dt>
                <dd className="text-text-primary">Desktop</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-text-secondary">
                  Año
                </dt>
                <dd className="text-text-primary">2026</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

export { readWelcomeModalEnabled };
