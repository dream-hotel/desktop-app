import { LoginRequest } from "../types/request/LoginRequest";
import { AuthResponse, User, BackendAuthResponse, UserRole } from "../types/response/AuthResponse";

const API_URL = "http://localhost:3000/api/hotel";

function mapRole(backendRoleName: string): UserRole {
  switch (backendRoleName.toUpperCase()) {
    case "ADMIN":
    case "ROOT":
      return "administrador";
    case "RECEPTIONIST":
      return "recepcionista";
    default:
      return "cliente";
  }
}

export async function login(request: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Credenciales inválidas o error en el servidor",
      };
    }

    const data: BackendAuthResponse = await response.json();

    localStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    const frontendUser: User = {
      id: data.user.id,
      fullName: data.user.fullName,
      lastName: data.user.lastName,
      email: data.user.email,
      role: mapRole(data.user.role.name),
      isActive: data.user.isActive,
      createdAt: data.user.createdAt,
    };

    return {
      success: true,
      message: "Inicio de sesión exitoso",
      user: frontendUser,
      token: data.accessToken,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Error de red. No se pudo conectar al servidor.",
    };
  }
}

export async function logout(): Promise<void> {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}
