import { useState, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
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
              <Eye size={17} strokeWidth={1.8} className="text-white" />
            ) : (
              <EyeOff size={17} strokeWidth={1.8} className="text-white/70" />
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
