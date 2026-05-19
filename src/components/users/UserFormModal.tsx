import { useEffect, useState } from "react";
import {
  BackendUserListItem,
  CreateUserPayload,
  ROLE_OPTIONS,
  UpdateUserPayload,
} from "../../types/models/Users";

interface UserFormModalProps {
  mode: "create" | "edit";
  user?: BackendUserListItem | null;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void>;
}

export default function UserFormModal({ mode, user, onClose, onSubmit }: UserFormModalProps) {
  const [fullName, setFullName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(ROLE_OPTIONS[1].id);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && user) {
      setFullName(user.fullName);
      setLastName(user.lastName);
      setEmail(user.email);
      setRoleId(user.role.id);
      setIsActive(user.isActive);
      setPassword("");
    }
  }, [mode, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (mode === "create") {
        const payload: CreateUserPayload = {
          fullName: fullName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          roleId,
          ...(password ? { password } : {}),
        };
        await onSubmit(payload);
      } else {
        const payload: UpdateUserPayload = {
          fullName: fullName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          roleId,
          isActive,
          ...(password ? { password } : {}),
        };
        await onSubmit(payload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex w-[480px] max-w-[calc(100vw-32px)] flex-col gap-4 rounded-[14px] bg-white p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-alexandria text-[22px] font-normal leading-[26px] text-text-primary">
              {mode === "create" ? "Nuevo usuario" : "Editar usuario"}
            </h2>
            <p className="mt-1 font-inter text-[12px] text-text-secondary">
              {mode === "create"
                ? "Crea una nueva cuenta. Si no establecés contraseña, se enviará una invitación."
                : "Actualiza los datos del usuario seleccionado."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-secondary hover:bg-[#f3f4f6]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label className="font-inter text-[12px] font-medium text-text-body">Nombre</label>
            <input
              required
              maxLength={100}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full min-w-0 rounded-[8px] border border-border bg-white px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label className="font-inter text-[12px] font-medium text-text-body">Apellido</label>
            <input
              required
              maxLength={100}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full min-w-0 rounded-[8px] border border-border bg-white px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-inter text-[12px] font-medium text-text-body">Email</label>
          <input
            required
            type="email"
            maxLength={150}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-w-0 rounded-[8px] border border-border bg-white px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-inter text-[12px] font-medium text-text-body">
            Contraseña {mode === "edit" && <span className="text-text-secondary">(dejar vacío para no cambiar)</span>}
          </label>
          <input
            type="password"
            minLength={password ? 8 : 0}
            maxLength={20}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "create" ? "Opcional — si está vacío, se envía invitación" : "••••••••"}
            className="w-full min-w-0 rounded-[8px] border border-border bg-white px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label className="font-inter text-[12px] font-medium text-text-body">Rol</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
              className="w-full min-w-0 rounded-[8px] border border-border bg-white px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {mode === "edit" && (
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label className="font-inter text-[12px] font-medium text-text-body">Estado</label>
              <select
                value={isActive ? "1" : "0"}
                onChange={(e) => setIsActive(e.target.value === "1")}
                className="w-full min-w-0 rounded-[8px] border border-border bg-white px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary"
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-[#fee2e2] px-3 py-2 font-inter text-[12px] text-[#991b1b]">
            {error}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-[10px] bg-[#f3f4f6] px-4 py-2 font-inter text-[13px] font-medium text-text-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-primary px-4 py-2 font-inter text-[13px] font-medium text-white disabled:opacity-50"
          >
            {saving ? "Guardando..." : mode === "create" ? "Crear usuario" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
