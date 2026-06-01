import { LoginRequest } from "../types/request/LoginRequest";
import {
  AuthResponse,
  BackendAuthResponse,
  User,
  UserRole,
} from "../types/response/AuthResponse";
import {
  apiClient,
  ApiError,
  getAccessToken,
  clearSession,
  setAccessToken,
  setRefreshToken,
} from "./apiClient";

const PERMISSIONS_KEY = "permissions";

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
    // user_id is stored as bigint in MySQL and serialized as a string;
    // coerce to number so equality checks and DTO validators behave correctly.
    id: Number(data.id),
    fullName: data.fullName,
    lastName: data.lastName,
    email: data.email,
    role: mapRole(data.role.name),
    roleId: data.role.id,
    roleName: data.role.name,
    isActive: data.isActive,
    createdAt: data.createdAt,
    mustChangePassword: data.mustChangePassword,
  };
}

export function getStoredPermissions(): string[] {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
}

export function setStoredPermissions(permissions: string[] | null): void {
  if (permissions) localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  else localStorage.removeItem(PERMISSIONS_KEY);
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  try {
    const data = await apiClient.post<BackendAuthResponse>("/auth/login", request, {
      auth: false,
    });

    setAccessToken(data.accessToken);
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
    }
    const permissions = Array.isArray(data.permissions) ? data.permissions : [];
    setStoredPermissions(permissions);

    return {
      success: true,
      message: "Inicio de sesión exitoso",
      user: mapBackendUser(data.user),
      token: data.accessToken,
      permissions,
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
    clearSession();
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = await apiClient.post<{ message: string }>("/auth/reset-password-request", { email }, { auth: false });
    return { success: true, message: data.message || "Código enviado con éxito." };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Error de red. No se pudo conectar al servidor." };
  }
}

export async function verifyResetToken(email: string, token: string): Promise<{ success: boolean; message: string }> {
  try {
    await apiClient.post("/auth/verify-reset-token", { email, token }, { auth: false });
    return { success: true, message: "Código verificado correctamente." };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Error de red. No se pudo conectar al servidor." };
  }
}

export async function verifyAndSetPassword(email: string, token: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    await apiClient.post("/auth/verify-password", { email, token, password }, { auth: false });
    return { success: true, message: "Contraseña cambiada con éxito." };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Error de red. No se pudo conectar al servidor." };
  }
}

export async function changePassword(password: string): Promise<void> {
  await apiClient.post("/auth/change-password", { password });
}
