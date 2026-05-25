export interface BackendRole {
  id: number;
  name: string;
}

export interface BackendUserListItem {
  id: number;
  fullName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  schedules: any[]; // Changed from scheduleId: number | null
  createdAt: string;
  role: BackendRole;
}

export interface CreateUserPayload {
  fullName: string;
  lastName: string;
  email: string;
  password?: string;
  roleId: number;
}

export interface UpdateUserPayload {
  fullName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  roleId?: number;
  isActive?: boolean;
  scheduleIds?: number[]; // Changed from scheduleId?: number | null
}

export interface FindUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  isActive?: boolean;
}

export const ROLE_OPTIONS: { id: number; label: string; key: string }[] = [
  { id: 2, label: "Administrador", key: "ADMIN" },
  { id: 3, label: "Recepcionista", key: "RECEPTIONIST" },
];

export function roleLabel(name: string): string {
  switch (name.toUpperCase()) {
    case "ADMIN":
      return "Administrador";
    case "RECEPTIONIST":
      return "Recepcionista";
    case "ROOT":
      return "Root";
    default:
      return name;
  }
}
