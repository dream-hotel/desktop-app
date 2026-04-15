export type UserRole = "administrador" | "recepcionista" | "cliente";

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}
