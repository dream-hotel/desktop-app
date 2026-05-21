import { LoginRequest } from "../types/request/LoginRequest";
import {
  AuthResponse,
  BackendAuthResponse,
  User,
  UserRole,
} from "../types/response/AuthResponse";
import { apiClient, ApiError, getAccessToken, setAccessToken } from "./apiClient";

const REFRESH_TOKEN_KEY = "refreshToken";

function mapRole(backendRoleName: string): UserRole {
  switch (backendRoleName.toUpperCase()) {
    case "ADMIN":
      return "administrador";
    case "RECEPTIONIST":
      return "recepcionista";
    default:
      return "cliente";
  }
}

function mapBackendUser(data: BackendAuthResponse["user"]): User {
  return {
    id: data.id,
    fullName: data.fullName,
    lastName: data.lastName,
    email: data.email,
    role: mapRole(data.role.name),
    isActive: data.isActive,
    createdAt: data.createdAt,
  };
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  try {
    const data = await apiClient.post<BackendAuthResponse>("/auth/login", request, {
      auth: false,
    });

    setAccessToken(data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }

    return {
      success: true,
      message: "Inicio de sesión exitoso",
      user: mapBackendUser(data.user),
      token: data.accessToken,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return {
      success: false,
      message: "Error de red. No se pudo conectar al servidor.",
    };
  }
}

export async function logout(): Promise<void> {
  try {
    if (getAccessToken()) {
      await apiClient.post("/auth/logout");
    }
  } catch {
    // Logout failures shouldn't block clearing local credentials.
  } finally {
    setAccessToken(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
