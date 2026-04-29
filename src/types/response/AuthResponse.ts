export type UserRole = "administrador" | "recepcionista" | "cliente";

export interface User {
  id: number;
  fullName: string;
  lastName?: string;
  role: UserRole;
  email: string;
  avatar?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface BackendUser {
  id: number;
  fullName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  role: {
    id: number;
    name: string;
  };
}

export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
}
