import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import LoginForm from "../components/login/LoginForm";
import loginBg from "../assets/login-bg.jpg";
import dreamLogo from "../assets/dream_logo.svg";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, sessionExpired, clearSessionExpired } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function handleLoginSuccess() {
    navigate("/dashboard");
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden">
      <img src={loginBg} alt="" className="absolute inset-0 z-0 h-full w-full object-cover" />
      <div className="absolute inset-0 z-[1] bg-[rgba(121,75,133,0.18)]" />

      <div className="relative z-[2] flex h-full w-full items-center justify-between px-10">
        <div className="my-auto ml-7 pl-[13px]">
          <img
            src={dreamLogo}
            alt="Dream by Stannum"
            className="mb-5 h-20 w-20 drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)] [filter:brightness(0)_invert(1)]"
          />
          <h1 className="m-0 whitespace-pre-wrap font-alexandria text-[48px] leading-[50px] font-normal text-white">
            Dream by{"\n"}Stannum
          </h1>
          <div className="mt-[6px] h-[5px] w-[235px] rounded-[2px] bg-primary" />
          <p className="mt-4 font-alexandria text-[16px] leading-[19.5px] font-normal text-white">
            Sistema de Gestión Operativa
          </p>
        </div>

        <div className="mr-[60px] flex flex-col items-center justify-center gap-3">
          {sessionExpired && (
            <div className="flex w-[360px] items-start justify-between gap-3 rounded-[10px] border border-warning/40 bg-warning/15 px-4 py-2.5 font-inter text-[12px] text-text-primary backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-warning" />
                <span>Tu sesión expiró. Vuelve a iniciar sesión para continuar.</span>
              </div>
              <button
                onClick={clearSessionExpired}
                className="text-text-secondary hover:text-text-primary"
                aria-label="Cerrar aviso"
              >
                ✕
              </button>
            </div>
          )}
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>

      <p className="absolute bottom-4 left-7 z-[2] m-0 font-inter text-[11px] leading-[16.5px] font-normal text-white">
        2026 Dream by Stannum - Versión 1.0.0
      </p>
    </div>
  );
}
