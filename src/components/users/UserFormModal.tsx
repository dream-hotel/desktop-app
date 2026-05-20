import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
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

type FieldErrors = {
  fullName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  roleId?: string;
};

const NAME_MAX = 100;
const EMAIL_MAX = 150;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 20;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_REGEX = /^[\p{L}\p{M}\s'.-]+$/u;

function validateFullName(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "El nombre es obligatorio.";
  if (trimmed.length < 2) return "El nombre debe tener al menos 2 caracteres.";
  if (trimmed.length > NAME_MAX) return `El nombre no puede superar los ${NAME_MAX} caracteres.`;
  if (!NAME_REGEX.test(trimmed)) return "El nombre solo puede contener letras, espacios, apóstrofos, guiones o puntos.";
  return undefined;
}

function validateLastName(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "El apellido es obligatorio.";
  if (trimmed.length < 2) return "El apellido debe tener al menos 2 caracteres.";
  if (trimmed.length > NAME_MAX) return `El apellido no puede superar los ${NAME_MAX} caracteres.`;
  if (!NAME_REGEX.test(trimmed)) return "El apellido solo puede contener letras, espacios, apóstrofos, guiones o puntos.";
  return undefined;
}

function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "El correo electrónico es obligatorio.";
  if (trimmed.length > EMAIL_MAX) return `El correo electrónico no puede superar los ${EMAIL_MAX} caracteres.`;
  if (!EMAIL_REGEX.test(trimmed)) return "Ingrese un correo electrónico con un formato válido (por ejemplo, nombre@dominio.com).";
  return undefined;
}

function validatePassword(value: string, mode: "create" | "edit"): string | undefined {
  if (!value) {
    if (mode === "edit") return undefined;
    return undefined;
  }
  if (value.length < PASSWORD_MIN) return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;
  if (value.length > PASSWORD_MAX) return `La contraseña no puede superar los ${PASSWORD_MAX} caracteres.`;
  if (/\s/.test(value)) return "La contraseña no puede contener espacios en blanco.";
  return undefined;
}

function validateRoleId(value: number): string | undefined {
  if (!ROLE_OPTIONS.some((opt) => opt.id === value)) return "Seleccione un rol válido.";
  return undefined;
}

function translateServerError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email already registered") || lower.includes("correo electrónico ya está registrado")) {
    return "El correo electrónico ya está registrado por otro usuario.";
  }
  if (lower.includes("user not found") || lower.includes("usuario no encontrado")) {
    return "El usuario ya no existe. Actualice la lista e intente nuevamente.";
  }
  if (lower.includes("http 401")) return "Su sesión expiró. Inicie sesión nuevamente.";
  if (lower.includes("http 403")) return "No tiene permisos para realizar esta acción.";
  if (lower.includes("http 500")) return "Ocurrió un error en el servidor. Intente nuevamente en unos minutos.";
  return message;
}

export default function UserFormModal({ mode, user, onClose, onSubmit }: UserFormModalProps) {
  const [fullName, setFullName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(ROLE_OPTIONS[1].id);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<keyof FieldErrors, boolean>>({
    fullName: false,
    lastName: false,
    email: false,
    password: false,
    roleId: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);

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

  const errors: FieldErrors = useMemo(
    () => ({
      fullName: validateFullName(fullName),
      lastName: validateLastName(lastName),
      email: validateEmail(email),
      password: validatePassword(password, mode),
      roleId: validateRoleId(roleId),
    }),
    [fullName, lastName, email, password, roleId, mode],
  );

  const hasErrors = Object.values(errors).some(Boolean);
  const isFormValid = !hasErrors;

  function shouldShowError(field: keyof FieldErrors): boolean {
    return (touched[field] || submitAttempted) && Boolean(errors[field]);
  }

  function markTouched(field: keyof FieldErrors) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    setServerError(null);

    if (!isFormValid) return;

    setSaving(true);
    try {
      if (mode === "create") {
        const payload: CreateUserPayload = {
          fullName: fullName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          roleId,
          ...(password ? { password } : {}),
        };
        await onSubmit(payload);
      } else {
        const payload: UpdateUserPayload = {
          fullName: fullName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          roleId,
          isActive,
          ...(password ? { password } : {}),
        };
        await onSubmit(payload);
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "No se pudieron guardar los cambios.";
      setServerError(translateServerError(raw));
    } finally {
      setSaving(false);
    }
  }

  function inputClass(field: keyof FieldErrors): string {
    const base =
      "w-full min-w-0 rounded-[8px] border bg-surface px-3 py-2 font-inter text-[13px] text-text-primary outline-none transition-colors";
    if (shouldShowError(field)) {
      return `${base} border-danger focus:border-danger`;
    }
    return `${base} border-border focus:border-primary`;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
        className="flex w-[480px] max-w-[calc(100vw-32px)] flex-col gap-4 rounded-[14px] bg-surface p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-alexandria text-[22px] font-normal leading-[26px] text-text-primary">
              {mode === "create" ? "Nuevo usuario" : "Editar usuario"}
            </h2>
            <p className="mt-1 font-inter text-[12px] text-text-secondary">
              {mode === "create"
                ? "Cree una nueva cuenta. Si no establece una contraseña, se enviará una invitación por correo."
                : "Actualice los datos del usuario seleccionado."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-text-secondary hover:bg-neutral-soft"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label className="font-inter text-[12px] font-medium text-text-body">
              Nombre <span className="text-danger">*</span>
            </label>
            <input
              maxLength={NAME_MAX}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => markTouched("fullName")}
              aria-invalid={shouldShowError("fullName")}
              className={inputClass("fullName")}
            />
            {shouldShowError("fullName") && (
              <span className="font-inter text-[11px] text-danger">{errors.fullName}</span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label className="font-inter text-[12px] font-medium text-text-body">
              Apellido <span className="text-danger">*</span>
            </label>
            <input
              maxLength={NAME_MAX}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={() => markTouched("lastName")}
              aria-invalid={shouldShowError("lastName")}
              className={inputClass("lastName")}
            />
            {shouldShowError("lastName") && (
              <span className="font-inter text-[11px] text-danger">{errors.lastName}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-inter text-[12px] font-medium text-text-body">
            Correo electrónico <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={EMAIL_MAX}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => markTouched("email")}
            aria-invalid={shouldShowError("email")}
            className={inputClass("email")}
          />
          {shouldShowError("email") && (
            <span className="font-inter text-[11px] text-danger">{errors.email}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-inter text-[12px] font-medium text-text-body">
            Contraseña{" "}
            {mode === "edit" ? (
              <span className="text-text-secondary">(opcional, dejar en blanco para conservar la actual)</span>
            ) : (
              <span className="text-text-secondary">(opcional, si se omite se enviará una invitación)</span>
            )}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => markTouched("password")}
            placeholder={mode === "create" ? "Entre 8 y 20 caracteres" : "••••••••"}
            aria-invalid={shouldShowError("password")}
            className={inputClass("password")}
          />
          {shouldShowError("password") ? (
            <span className="font-inter text-[11px] text-danger">{errors.password}</span>
          ) : (
            password && (
              <span className="font-inter text-[11px] text-text-secondary">
                Entre {PASSWORD_MIN} y {PASSWORD_MAX} caracteres, sin espacios.
              </span>
            )
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label className="font-inter text-[12px] font-medium text-text-body">
              Rol <span className="text-danger">*</span>
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
              onBlur={() => markTouched("roleId")}
              aria-invalid={shouldShowError("roleId")}
              className={inputClass("roleId")}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            {shouldShowError("roleId") && (
              <span className="font-inter text-[11px] text-danger">{errors.roleId}</span>
            )}
          </div>
          {mode === "edit" && (
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label className="font-inter text-[12px] font-medium text-text-body">Estado</label>
              <select
                value={isActive ? "1" : "0"}
                onChange={(e) => setIsActive(e.target.value === "1")}
                className="w-full min-w-0 rounded-[8px] border border-border bg-surface px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary"
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </div>
          )}
        </div>

        {serverError && (
          <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
            {serverError}
          </div>
        )}

        {submitAttempted && hasErrors && !serverError && (
          <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
            Revise los campos resaltados antes de guardar.
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-[10px] bg-neutral-soft px-4 py-2 font-inter text-[13px] font-medium text-text-secondary"
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
