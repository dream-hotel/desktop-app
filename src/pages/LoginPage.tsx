import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/login/LoginForm";
import loginBg from "../assets/login-bg.jpg";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("[LoginPage] User authenticated. Redirecting to /dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function handleLoginSuccess() {
    console.log("[LoginPage] Login success callback. Navigating to /dashboard");
    navigate("/dashboard");
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden">
      <img src={loginBg} alt="" className="absolute inset-0 z-0 h-full w-full object-cover" />
      <div className="absolute inset-0 z-[1] bg-[rgba(121,75,133,0.18)]" />

      <div className="relative z-[2] flex h-full w-full items-center justify-between px-10">
        <div className="my-auto ml-7 pl-[13px]">
          <h1 className="m-0 whitespace-pre-wrap font-alexandria text-[48px] leading-[50px] font-normal text-white">
            Dream by{"\n"}Stannum
          </h1>
          <div className="mt-[6px] h-[5px] w-[235px] rounded-[2px] bg-primary" />
          <p className="mt-4 font-alexandria text-[16px] leading-[19.5px] font-normal text-white">
            Sistema de Gestión Operativa
          </p>
        </div>

        <div className="mr-[60px] flex items-center justify-center">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>

      <p className="absolute bottom-4 left-7 z-[2] m-0 font-inter text-[11px] leading-[16.5px] font-normal text-white">
        2026 Dream by Stannum - Versión 1.0.0
      </p>
    </div>
  );
}
