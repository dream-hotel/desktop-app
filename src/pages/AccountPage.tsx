import { useState } from "react";
import { User } from "../types/response/AuthResponse";
import * as userService from "../service/userService";
import { ApiError } from "../service/apiClient";

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

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      await userService.updateUser(user.id, { password: newPassword });
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError("No tienes permisos para cambiar tu contraseña desde aquí. Contacta a un administrador.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Error al actualizar la contraseña.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg">
      <header className="flex items-start justify-between border-b border-border bg-white px-8 pb-4 pt-6">
        <div className="flex flex-col gap-[2px]">
          <h1 className="m-0 font-alexandria text-[28px] font-medium leading-9 text-text-primary">
            Mi cuenta
          </h1>
          <p className="m-0 font-inter text-[13px] leading-[19.5px] text-text-secondary">
            Información personal, seguridad y sesión.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto flex max-w-[840px] flex-col gap-5">
          {/* Profile card */}
          <section className="overflow-hidden rounded-[14px] border border-border bg-white">
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
                <dt className="text-[11px] uppercase tracking-wide text-text-secondary">ID de usuario</dt>
                <dd className="text-text-primary">#{user.id}</dd>
              </div>
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

          {/* Change password */}
          <section className="overflow-hidden rounded-[14px] border border-border bg-white">
            <div className="flex items-start gap-3 border-b border-border px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="font-alexandria text-[16px] font-medium leading-tight text-text-primary">
                  Cambiar contraseña
                </h3>
                <p className="mt-0.5 font-inter text-[12px] text-text-secondary">
                  Mínimo 8 caracteres. Tras actualizarla deberás usarla en tu próximo inicio de sesión.
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
                      className="w-full rounded-[10px] border border-border bg-bg px-3 py-2 pr-10 font-inter text-[13px] text-text-primary outline-none transition-colors focus:border-primary/50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                          <path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                          <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.4" />
                          <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                          <path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                          <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
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
                    className="w-full rounded-[10px] border border-border bg-bg px-3 py-2 font-inter text-[13px] text-text-primary outline-none transition-colors focus:border-primary/50 focus:bg-white"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2 rounded-[10px] border border-success/30 bg-success/10 px-3 py-2 font-inter text-[12px] text-success">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 8l2 2 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
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
                  className="rounded-[10px] border border-border bg-white px-4 py-2 font-inter text-[12px] font-medium text-text-secondary transition-colors hover:bg-bg disabled:opacity-40"
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
          <section className="overflow-hidden rounded-[14px] border border-border bg-white">
            <div className="flex items-start gap-3 border-b border-border px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-danger/10 text-danger">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 11l3-3-3-3M13 8H6M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
                    className="rounded-[10px] border border-border bg-white px-3 py-1.5 font-inter text-[12px] font-medium text-text-secondary transition-colors hover:bg-bg"
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
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M10 11l3-3-3-3M13 8H6M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
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
