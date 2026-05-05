import { LoginRequest } from "../types/request/LoginRequest";
import { AuthResponse, User } from "../types/response/AuthResponse";

const AUTH_LOGIN_URL = "http://localhost:3000/api/auth/login";
type BackendLoginResponse = {
  access_token?: string;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  message?: string;
};

export async function login(request: LoginRequest): Promise<AuthResponse> {
  console.log("[authService.login] Request payload:", {
    email: request.email,
    hasPassword: !!request.password,
  });

  let response: Response;
  try {
    response = await fetch(AUTH_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: request.email,
        password: request.password,
      }),
    });
  } catch (error) {
    console.error("[authService.login] Network error:", error);
    return {
      success: false,
      message: "No se pudo conectar con el servidor de autenticación.",
    };
  }

  let data: BackendLoginResponse;
  try {
    data = (await response.json()) as BackendLoginResponse;
  } catch {
    console.error("[authService.login] Invalid JSON response. HTTP status:", response.status);
    return {
      success: false,
      message: "Respuesta inválida del servidor de autenticación.",
    };
  }

  console.log("[authService.login] Backend response:", {
    status: response.status,
    ok: response.ok,
    data,
  });

  if (!response.ok) {
    return {
      success: false,
      message: data.message || "No fue posible iniciar sesión.",
    };
  }

  const backendUser = data.user;
  if (!backendUser) {
    return {
      success: true,
      message: "Inicio de sesión exitoso.",
      token: data.access_token,
    };
  }

  const fullName = `${backendUser.firstName ?? ""} ${backendUser.lastName ?? ""}`.trim();
  const normalizedUser: User = {
    id: backendUser.id,
    email: backendUser.email,
    username: backendUser.email.split("@")[0] || backendUser.email,
    fullName: fullName || backendUser.email,
    role:
      backendUser.role === "administrador" || backendUser.role === "admin"
        ? "administrador"
        : backendUser.role === "recepcionista" || backendUser.role === "receptionist"
          ? "recepcionista"
          : "cliente",
  };

  return {
    success: true,
    message: "Inicio de sesión exitoso.",
    token: data.access_token,
    user: normalizedUser,
  };
}

export async function logout(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
}
