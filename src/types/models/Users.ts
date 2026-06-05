import { roleDisplayName } from "./Roles";

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
  schedules: any[];
  createdAt: string;
  role: BackendRole;
  deletedAt?: string;
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
  scheduleIds?: number[];
}

export interface FindUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  isActive?: boolean;
  onlyDeleted?: boolean;
}

export function roleLabel(name: string): string {
  return roleDisplayName(name);
}
