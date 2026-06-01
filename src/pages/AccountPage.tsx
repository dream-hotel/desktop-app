import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, LogOut, Lock, RefreshCw, Download, Info } from "lucide-react";
import { User } from "../types/response/AuthResponse";
import { ApiError } from "../service/apiClient";
import { changePassword as apiChangePassword } from "../service/authService";
import { useUpdater } from "../hooks/useUpdater";
import { getVersion } from "@tauri-apps/api/app";

interface AccountPageProps {
  user: User;
  onLogout: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function roleLabel(role: User["role"]): string {
  switch (role) {
    case "administrador":
      return "Administrador";
    case "recepcionista":
      return "Recepcionista";
    default:
      return "Cliente";
  }
}

function formatDateLong(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function AccountPage({ user, onLogout }: AccountPageProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [currentAppVersion, setCurrentAppVersion] = useState<string>("...");

  const { status, error: updaterError, manifest, checkForUpdates, downloadAndInstall } = useUpdater();

  useEffect(() => {
    getVersion().then(setCurrentAppVersion).catch(console.error);
  }, []);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[^a-zA-Z\d]/.test(newPassword);

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!hasLetter) {
      setError("La contraseña debe tener al menos una letra (mayúscula o minúscula).");
      return;
    }
    if (!hasNumber) {
      setError("La contraseña debe tener al menos un número.");
      return;
    }
    if (!hasSpecial) {
      setError("La contraseña debe tener al menos un carácter especial (ej. punto, guion, barra baja).");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      await apiChangePassword(newPassword);
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Error al actualizar la contraseña.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg">

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto flex max-w-[840px] flex-col gap-5">
          {/* Profile card */}
          <section className="overflow-hidden rounded-[14px] border border-border bg-surface">
            <div className="flex items-center gap-5 border-b border-border px-6 py-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary font-inter text-[20px] font-semibold text-white">
                {getInitials(user.fullName)}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="truncate font-alexandria text-[20px] font-medium leading-tight text-text-primary">
                  {user.fullName}
                  {user.lastName ? ` ${user.lastName}` : ""}
                </h2>
                <span className="truncate font-inter text-[13px] text-text-secondary">
                  {user.email}
                </span>
                <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 font-inter text-[11px] font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {roleLabel(user.role)}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 px-6 py-5 font-inter text-[13px] sm:grid-cols-2">

              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-text-secondary">Estado</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 font-inter text-[11px] font-medium ${
                      user.isActive === false
                        ? "bg-danger/10 text-danger"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    {user.isActive === false ? "Inactivo" : "Activo"}
                  </span>
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-text-secondary">Correo electrónico</dt>
                <dd className="break-all text-text-primary">{user.email}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-text-secondary">Miembro desde</dt>
                <dd className="text-text-primary">{formatDateLong(user.createdAt)}</dd>
              </div>
            </dl>
          </section>

          {/* App Updates */}
          <section className="overflow-hidden rounded-[14px] border border-border bg-surface">
            <div className="flex items-start gap-3 border-b border-border px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                <RefreshCw size={16} strokeWidth={1.8} className={status === "checking" ? "animate-spin" : ""} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-alexandria text-[16px] font-medium leading-tight text-text-primary">
                  Actualizaciones del sistema
                </h3>
                <p className="mt-0.5 font-inter text-[12px] text-text-secondary">
                  Versión actual: {currentAppVersion}. Comprueba si hay mejoras disponibles.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-inter text-[13px] font-medium text-text-primary">
                    {status === "idle" && "El sistema está actualizado"}
                    {status === "checking" && "Buscando actualizaciones..."}
                    {status === "available" && "¡Nueva versión disponible!"}
                    {status === "not-available" && "Ya tienes la última versión"}
                    {status === "downloading" && "Descargando actualización..."}
                    {status === "ready" && "Actualización lista"}
                    {status === "error" && "Error al buscar actualizaciones"}
                  </span>
                  <span className="font-inter text-[12px] text-text-secondary">
                    {status === "available" && manifest && (
                      <>Se encontró la versión <span className="font-semibold text-primary">{manifest.version}</span></>
                    )}
                    {(status === "idle" || status === "not-available") && "No hay acciones pendientes."}
                    {status === "error" && updaterError}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {(status === "idle" || status === "not-available" || status === "error" || status === "checking") && (
                    <button
                      onClick={() => checkForUpdates()}
                      disabled={status === "checking"}
                      className="flex items-center gap-1.5 rounded-[10px] border border-border bg-surface px-4 py-2 font-inter text-[12px] font-medium text-text-secondary transition-colors hover:bg-bg disabled:opacity-40"
                    >
                      <RefreshCw size={14} strokeWidth={1.8} className={status === "checking" ? "animate-spin" : ""} />
                      {status === "checking" ? "Buscando..." : "Buscar ahora"}
                    </button>
                  )}

                  {status === "available" && (
                    <button
                      onClick={downloadAndInstall}
                      className="flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 font-inter text-[12px] font-medium text-white transition-colors hover:bg-primary-hover"
                    >
                      <Download size={14} strokeWidth={1.8} />
                      Instalar versión {manifest?.version}
                    </button>
                  )}
                </div>
              </div>

              {status === "available" && manifest?.body && (
                <div className="mt-2 flex flex-col gap-2 rounded-[10px] bg-bg/50 p-4 border border-border/50">
                  <div className="flex items-center gap-1.5 text-text-primary">
                    <Info size={14} strokeWidth={1.8} className="text-primary" />
                    <span className="font-inter text-[12px] font-semibold">Novedades en esta versión:</span>
                  </div>
                  <p className="font-inter text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {manifest.body}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Change password */}
          <section className="overflow-hidden rounded-[14px] border border-border bg-surface">
            <div className="flex items-start gap-3 border-b border-border px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                <Lock size={16} strokeWidth={1.8} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-alexandria text-[16px] font-medium leading-tight text-text-primary">
                  Cambiar contraseña
                </h3>
                <p className="mt-0.5 font-inter text-[12px] text-text-secondary">
                  Mínimo 8 caracteres, una letra, un número y un carácter especial (punto, guion, barra baja, etc.).
                </p>
              </div>
            </div>

            <form onSubmit={submitPassword} className="flex flex-col gap-3 px-6 py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter text-[11.5px] font-medium text-text-secondary">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError(null);
                        setSuccess(false);
                      }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full rounded-[10px] border border-border bg-bg px-3 py-2 pr-10 font-inter text-[13px] text-text-primary outline-none transition-colors focus:border-primary/50 focus:bg-surface"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <EyeOff size={15} strokeWidth={1.6} />
                      ) : (
                        <Eye size={15} strokeWidth={1.6} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-inter text-[11.5px] font-medium text-text-secondary">
                    Confirmar contraseña
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                      setSuccess(false);
                    }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full rounded-[10px] border border-border bg-bg px-3 py-2 font-inter text-[13px] text-text-primary outline-none transition-colors focus:border-primary/50 focus:bg-surface"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
                  <AlertCircle size={14} strokeWidth={1.7} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2 rounded-[10px] border border-success/30 bg-success/10 px-3 py-2 font-inter text-[12px] text-success">
                  <CheckCircle2 size={14} strokeWidth={1.7} className="mt-0.5 shrink-0" />
                  <span>Contraseña actualizada correctamente.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewPassword("");
                    setConfirmPassword("");
                    setError(null);
                    setSuccess(false);
                  }}
                  disabled={saving || (!newPassword && !confirmPassword)}
                  className="rounded-[10px] border border-border bg-surface px-4 py-2 font-inter text-[12px] font-medium text-text-secondary transition-colors hover:bg-bg disabled:opacity-40"
                >
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={saving || !newPassword || !confirmPassword}
                  className="rounded-[10px] bg-primary px-4 py-2 font-inter text-[12px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Actualizar contraseña"}
                </button>
              </div>
            </form>
          </section>

          {/* Session */}
          <section className="overflow-hidden rounded-[14px] border border-border bg-surface">
            <div className="flex items-start gap-3 border-b border-border px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-danger/10 text-danger">
                <LogOut size={16} strokeWidth={1.8} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-alexandria text-[16px] font-medium leading-tight text-text-primary">
                  Sesión
                </h3>
                <p className="mt-0.5 font-inter text-[12px] text-text-secondary">
                  Cierra sesión en este dispositivo. Tendrás que iniciar sesión de nuevo para volver a usar la aplicación.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex flex-col">
                <span className="font-inter text-[13px] font-medium text-text-primary">
                  Cerrar sesión
                </span>
                <span className="font-inter text-[12px] text-text-secondary">
                  Sesión activa como {user.email}.
                </span>
              </div>
              {logoutOpen ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogoutOpen(false)}
                    className="rounded-[10px] border border-border bg-surface px-3 py-1.5 font-inter text-[12px] font-medium text-text-secondary transition-colors hover:bg-bg"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={onLogout}
                    className="rounded-[10px] bg-danger px-3 py-1.5 font-inter text-[12px] font-medium text-white transition-colors hover:bg-danger/90"
                  >
                    Sí, cerrar sesión
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setLogoutOpen(true)}
                  className="flex items-center gap-1.5 rounded-[10px] border border-danger/30 bg-danger/5 px-3 py-1.5 font-inter text-[12px] font-medium text-danger transition-colors hover:bg-danger/10"
                >
                  <LogOut size={13} strokeWidth={1.8} />
                  Cerrar sesión
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
