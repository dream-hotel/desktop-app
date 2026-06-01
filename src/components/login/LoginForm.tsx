import { useState, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import * as authService from "../../service/authService";

interface LoginFormProps {
  onSuccess: () => void;
}

type FormView = "login" | "request-recovery" | "verify-code" | "reset-password";

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [view, setView] = useState<FormView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { login, isLoading, error } = useAuth();

  const activeError = view === "login" ? error : errorMsg;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (view === "login") {
      await handleLogin();
    } else if (view === "request-recovery") {
      await handleRequestRecovery();
    } else if (view === "verify-code") {
      await handleVerifyCode();
    } else if (view === "reset-password") {
      await handleResetPassword();
    }
  }

  async function handleLogin() {
    setErrorMsg(null);
    const success = await login({ email, password });
    if (success) {
      onSuccess();
    }
  }

  async function handleRequestRecovery() {
    setErrorMsg(null);
    setSuccessMsg(null);

    // "si está vacío debe pedirse que se llene el input"
    if (!email.trim()) {
      setErrorMsg("Por favor, ingresa tu correo electrónico.");
      return;
    }
    // "si está llenado debe verificar que sea un email valido"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    setIsActionLoading(true);
    const result = await authService.requestPasswordReset(email.trim());
    setIsActionLoading(false);

    if (result.success) {
      setSuccessMsg(result.message);
      setView("verify-code");
    } else {
      setErrorMsg(result.message);
    }
  }

  async function handleVerifyCode() {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!code.trim()) {
      setErrorMsg("Por favor, ingresa el código de verificación.");
      return;
    }

    setIsActionLoading(true);
    const result = await authService.verifyResetToken(email.trim(), code.trim());
    setIsActionLoading(false);

    if (result.success) {
      setSuccessMsg(result.message);
      setView("reset-password");
      setPassword("");
      setConfirmPassword("");
    } else {
      setErrorMsg(result.message);
    }
  }

  async function handleResetPassword() {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!password) {
      setErrorMsg("Por favor, ingresa la nueva contraseña.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    // Complexity check matching backend requirements
    const complexityRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/;
    if (!complexityRegex.test(password)) {
      setErrorMsg("La contraseña debe incluir al menos una letra, un número y un carácter especial (punto, guion, barra baja, etc.).");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setIsActionLoading(true);
    const result = await authService.verifyAndSetPassword(email.trim(), code.trim(), password);
    setIsActionLoading(false);

    if (result.success) {
      setSuccessMsg("Contraseña cambiada con éxito. Ya puedes iniciar sesión.");
      setView("login");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setCode("");
    } else {
      setErrorMsg(result.message);
    }
  }

  return (
    <form
      className="flex w-[319px] flex-col gap-3 rounded-[40px] px-[30px] py-10"
      onSubmit={handleSubmit}
    >
      {view === "login" && (
        <>
          <h1 className="mb-5 font-alexandria text-[39px] leading-[35px] font-normal text-white">
            Iniciar Sesión
          </h1>

          <div className="flex flex-col gap-2">
            <label className="font-alexandria text-[20px] leading-[21px] font-extralight text-white">
              Correo Electrónico
            </label>
            <input
              type="email"
              className="h-[42px] w-full rounded-[10px] border-[0.5px] border-white/80 bg-transparent px-[14px] font-alexandria text-[20px] leading-[21px] font-light text-white outline-none placeholder:text-white/40 focus:border-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu email"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-alexandria text-[20px] leading-[21px] font-extralight text-white">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="h-[42px] w-full rounded-[10px] border-[0.5px] border-white/80 bg-transparent pr-[45px] pl-[14px] font-alexandria text-[20px] leading-[21px] font-light text-white outline-none placeholder:text-white/40 focus:border-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute top-1/2 right-[14px] flex -translate-y-1/2 items-center justify-center border-none bg-transparent p-1 shadow-none hover:opacity-80 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <Eye size={17} strokeWidth={1.8} className="text-white" />
                ) : (
                  <EyeOff size={17} strokeWidth={1.8} className="text-white/70" />
                )}
              </button>
            </div>
          </div>

          {activeError && (
            <p className="text-center font-alexandria text-[13px] text-red-400">
              {activeError}
            </p>
          )}

          {successMsg && (
            <p className="text-center font-alexandria text-[13px] text-green-400">
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            className="mt-[10px] h-[42px] w-[150px] self-center rounded-[10px] border-none bg-primary-dark font-alegreya-sc text-[20px] leading-[21px] font-medium text-white shadow-[0px_4px_4px_rgba(0,0,0,0.25)] transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Ingresando..." : "INGRESAR"}
          </button>

          <button
            type="button"
            className="mt-1 self-center border-none bg-transparent p-0 font-alexandria text-[12px] leading-[19.5px] font-light text-white/70 shadow-none hover:text-white hover:underline cursor-pointer"
            onClick={() => {
              setView("request-recovery");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
          >
            Olvidaste tu contraseña?
          </button>
        </>
      )}

      {view === "request-recovery" && (
        <>
          <h1 className="mb-5 font-alexandria text-[30px] leading-[35px] font-normal text-white">
            Recuperar contraseña
          </h1>

          <div className="flex flex-col gap-2">
            <label className="font-alexandria text-[20px] leading-[21px] font-extralight text-white">
              Correo electrónico
            </label>
            <input
              type="email"
              className="h-[42px] w-full rounded-[10px] border-[0.5px] border-white/80 bg-transparent px-[14px] font-alexandria text-[20px] leading-[21px] font-light text-white outline-none placeholder:text-white/40 focus:border-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu email"
              required
              autoFocus
            />
            <p className="mt-1 font-alexandria text-[11px] leading-[15px] font-light text-white/70">
              Ingresa tu correo electrónico para que enviemos un correo a tu email para recuperar la contraseña.
            </p>
          </div>

          {activeError && (
            <p className="text-center font-alexandria text-[13px] text-red-400 mt-2">
              {activeError}
            </p>
          )}

          <div className="mt-4 flex w-full gap-3">
            <button
              type="button"
              className="h-[42px] flex-1 rounded-[10px] border border-white/40 bg-transparent font-alegreya-sc text-[18px] leading-[21px] font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98] cursor-pointer text-center flex items-center justify-center"
              onClick={() => {
                setView("login");
                setErrorMsg(null);
              }}
            >
              Volver
            </button>
            <button
              type="submit"
              className="h-[42px] flex-1 rounded-[10px] border-none bg-primary-dark font-alegreya-sc text-[18px] leading-[21px] font-medium text-white shadow-[0px_4px_4px_rgba(0,0,0,0.25)] transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer text-center flex items-center justify-center"
              disabled={isActionLoading}
            >
              {isActionLoading ? "Enviando..." : "Enviar correo"}
            </button>
          </div>
        </>
      )}

      {view === "verify-code" && (
        <>
          <h1 className="mb-5 font-alexandria text-[30px] leading-[35px] font-normal text-white">
            Recuperar contraseña
          </h1>

          <div className="flex flex-col gap-2">
            <label className="font-alexandria text-[20px] leading-[21px] font-extralight text-white">
              Código de verificación
            </label>
            <input
              type="text"
              maxLength={6}
              className="h-[42px] w-full rounded-[10px] border-[0.5px] border-white/80 bg-transparent px-[14px] font-alexandria text-[20px] leading-[21px] font-light text-white outline-none placeholder:text-white/40 focus:border-white text-center tracking-[4px]"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              autoFocus
            />
            <p className="mt-1 font-alexandria text-[11px] leading-[15px] font-light text-white/70">
              Ingresa el código que enviamos a tu correo electrónico.
            </p>
          </div>

          {activeError && (
            <p className="text-center font-alexandria text-[13px] text-red-400 mt-2">
              {activeError}
            </p>
          )}

          {successMsg && (
            <p className="text-center font-alexandria text-[13px] text-green-400 mt-2">
              {successMsg}
            </p>
          )}

          <div className="mt-4 flex w-full gap-3">
            <button
              type="button"
              className="h-[42px] flex-1 rounded-[10px] border border-white/40 bg-transparent font-alegreya-sc text-[18px] leading-[21px] font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98] cursor-pointer text-center flex items-center justify-center"
              onClick={() => {
                setView("request-recovery");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Volver
            </button>
            <button
              type="submit"
              className="h-[42px] flex-1 rounded-[10px] border-none bg-primary-dark font-alegreya-sc text-[18px] leading-[21px] font-medium text-white shadow-[0px_4px_4px_rgba(0,0,0,0.25)] transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer text-center flex items-center justify-center"
              disabled={isActionLoading}
            >
              {isActionLoading ? "Verificando..." : "Verificar"}
            </button>
          </div>
        </>
      )}

      {view === "reset-password" && (
        <>
          <h1 className="mb-5 font-alexandria text-[30px] leading-[35px] font-normal text-white">
            Cambiar contraseña
          </h1>

          <div className="flex flex-col gap-2">
            <label className="font-alexandria text-[20px] leading-[21px] font-extralight text-white">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="h-[42px] w-full rounded-[10px] border-[0.5px] border-white/80 bg-transparent pr-[45px] pl-[14px] font-alexandria text-[20px] leading-[21px] font-light text-white outline-none placeholder:text-white/40 focus:border-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
              />
              <button
                type="button"
                className="absolute top-1/2 right-[14px] flex -translate-y-1/2 items-center justify-center border-none bg-transparent p-1 shadow-none hover:opacity-80 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <Eye size={17} strokeWidth={1.8} className="text-white" />
                ) : (
                  <EyeOff size={17} strokeWidth={1.8} className="text-white/70" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-alexandria text-[20px] leading-[21px] font-extralight text-white">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="h-[42px] w-full rounded-[10px] border-[0.5px] border-white/80 bg-transparent pr-[45px] pl-[14px] font-alexandria text-[20px] leading-[21px] font-light text-white outline-none placeholder:text-white/40 focus:border-white"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute top-1/2 right-[14px] flex -translate-y-1/2 items-center justify-center border-none bg-transparent p-1 shadow-none hover:opacity-80 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <Eye size={17} strokeWidth={1.8} className="text-white" />
                ) : (
                  <EyeOff size={17} strokeWidth={1.8} className="text-white/70" />
                )}
              </button>
            </div>
            <p className="mt-1 font-alexandria text-[11px] leading-[15px] font-light text-white/70">
              Mínimo 8 caracteres, debe incluir al menos una letra, un número y un carácter especial (punto, guion, barra baja, etc.).
            </p>
          </div>

          {activeError && (
            <p className="text-center font-alexandria text-[13px] text-red-400 mt-2">
              {activeError}
            </p>
          )}

          {successMsg && (
            <p className="text-center font-alexandria text-[13px] text-green-400 mt-2">
              {successMsg}
            </p>
          )}

          <div className="mt-4 flex w-full gap-3">
            <button
              type="button"
              className="h-[42px] flex-1 rounded-[10px] border border-white/40 bg-transparent font-alegreya-sc text-[18px] leading-[21px] font-medium text-white transition-all hover:bg-white/10 active:scale-[0.98] cursor-pointer text-center flex items-center justify-center"
              onClick={() => {
                setView("verify-code");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Volver
            </button>
            <button
              type="submit"
              className="h-[42px] flex-1 rounded-[10px] border-none bg-primary-dark font-alegreya-sc text-[18px] leading-[21px] font-medium text-white shadow-[0px_4px_4px_rgba(0,0,0,0.25)] transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer text-center flex items-center justify-center"
              disabled={isActionLoading}
            >
              {isActionLoading ? "Confirmando..." : "Confirmar"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
