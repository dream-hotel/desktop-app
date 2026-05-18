import { useState, FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const success = await login({ email, password });
    if (success) {
      onSuccess();
    }
  }

  return (
    <form
      className="flex w-[319px] flex-col gap-3 rounded-[40px] px-[30px] py-10"
      onSubmit={handleSubmit}
    >
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
            className="absolute top-1/2 right-[14px] flex -translate-y-1/2 items-center justify-center border-none bg-transparent p-1 shadow-none hover:opacity-80"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <svg width="15" height="10" viewBox="0 0 15 10" fill="none">
                <path d="M7.5 0C4.09 0 1.18 2.07 0 5c1.18 2.93 4.09 5 7.5 5s6.32-2.07 7.5-5c-1.18-2.93-4.09-5-7.5-5zm0 8.33c-1.84 0-3.33-1.49-3.33-3.33S5.66 1.67 7.5 1.67 10.83 3.16 10.83 5 9.34 8.33 7.5 8.33zM7.5 3a2 2 0 100 4 2 2 0 000-4z" fill="white" />
              </svg>
            ) : (
              <svg width="15" height="10" viewBox="0 0 15 12" fill="none">
                <path d="M7.5 2.5C9.34 2.5 10.83 3.99 10.83 5.83c0 .47-.1.91-.27 1.32l1.94 1.94c1.01-.88 1.8-2 2.27-3.26C13.59 2.9 10.68.83 7.27.83c-.95 0-1.86.17-2.71.47l1.43 1.43c.41-.17.85-.23 1.51-.23zM.83 1.36l1.51 1.51.3.3C1.52 4.09.66 5.27.17 6.6c1.18 2.93 4.09 5 7.5 5 1.06 0 2.07-.2 3-.57l.28.28 1.94 1.93.79-.79L1.62.57.83 1.36zm3.72 3.72l.97.97c-.03.15-.05.31-.05.48 0 1.1.9 2 2 2 .17 0 .33-.02.48-.05l.97.97c-.44.22-.93.35-1.45.35-1.84 0-3.33-1.49-3.33-3.33 0-.52.13-1.01.41-1.39z" fill="rgba(255,255,255,0.7)" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-center font-alexandria text-[13px] text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="mt-[10px] h-[42px] w-[150px] self-center rounded-[10px] border-none bg-primary-dark font-alegreya-sc text-[20px] leading-[21px] font-medium text-white shadow-[0px_4px_4px_rgba(0,0,0,0.25)] transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
      >
        {isLoading ? "Ingresando..." : "INGRESAR"}
      </button>

      <button
        type="button"
        className="mt-1 self-center border-none bg-transparent p-0 font-alexandria text-[12px] leading-[19.5px] font-light text-white/70 shadow-none hover:text-white hover:underline"
      >
        Olvidaste tu contraseña?
      </button>
    </form>
  );
}
