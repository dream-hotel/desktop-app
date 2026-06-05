import { useState, FormEvent } from "react";
import { Eye, EyeOff, Lock, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function ForcePasswordChangeModal() {
  const { changePassword, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!password) {
      setErrorMsg("Por favor, ingresa la nueva contraseña.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const complexityRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/;
    if (!complexityRegex.test(password)) {
      setErrorMsg("La contraseña debe incluir al menos una letra, un número y un carácter especial (punto, guion, barra baja, etc.).");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(password);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Error al cambiar la contraseña. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="flex w-[420px] max-w-[calc(100vw-32px)] flex-col gap-5 rounded-[14px] bg-surface p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.3)]">
        
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Lock size={20} strokeWidth={1.8} className="text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-alexandria text-[18px] font-normal leading-[22px] text-text-primary">
              Actualizar contraseña
            </h3>
            <p className="font-inter text-[12px] leading-[18px] text-text-secondary">
              Es tu primer inicio de sesión en Dream by Stannum. Por motivos de seguridad, debes ingresar una nueva contraseña para continuar.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[11px] font-medium leading-4 text-text-body">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoFocus
                required
                className="w-full min-w-0 rounded-[8px] border border-border bg-surface px-3 py-2 pr-10 font-inter text-[13px] text-text-primary outline-none transition-colors focus:border-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                className="absolute top-1/2 right-[10px] flex -translate-y-1/2 items-center justify-center border-none bg-transparent p-1 shadow-none hover:opacity-80 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <Eye size={16} strokeWidth={1.8} className="text-text-secondary" />
                ) : (
                  <EyeOff size={16} strokeWidth={1.8} className="text-text-secondary/70" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-[11px] font-medium leading-4 text-text-body">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className="w-full min-w-0 rounded-[8px] border border-border bg-surface px-3 py-2 pr-10 font-inter text-[13px] text-text-primary outline-none transition-colors focus:border-primary"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
              />
              <button
                type="button"
                className="absolute top-1/2 right-[10px] flex -translate-y-1/2 items-center justify-center border-none bg-transparent p-1 shadow-none hover:opacity-80 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <Eye size={16} strokeWidth={1.8} className="text-text-secondary" />
                ) : (
                  <EyeOff size={16} strokeWidth={1.8} className="text-text-secondary/70" />
                )}
              </button>
            </div>
            <p className="mt-0.5 font-inter text-[11px] leading-[15px] text-text-secondary/80">
              Debe incluir al menos una letra, un número y un carácter especial (ej. punto, guion, barra baja).
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-[8px] border border-danger/30 bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex justify-between gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={logout}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-[10px] bg-neutral-soft px-4 py-2 font-inter text-[13px] font-medium text-text-secondary transition-colors hover:bg-neutral-mid"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-[10px] bg-primary px-4 py-2 font-inter text-[13px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {isLoading ? "Actualizando..." : "Establecer contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
