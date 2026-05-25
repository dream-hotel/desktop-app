import { apiClient } from "./apiClient";
import {
  BackendRole,
  CreateRolePayload,
  UpdateRolePayload,
} from "../types/models/Roles";

export function listRoles(): Promise<BackendRole[]> {
  return apiClient.get<BackendRole[]>("/roles");
}

export function getRole(id: number): Promise<BackendRole> {
  return apiClient.get<BackendRole>(`/roles/${id}`);
}

export function createRole(payload: CreateRolePayload): Promise<BackendRole> {
  return apiClient.post<BackendRole>("/roles", payload);
}

export function updateRole(id: number, payload: UpdateRolePayload): Promise<BackendRole> {
  return apiClient.patch<BackendRole>(`/roles/${id}`, payload);
}

export function deleteRole(id: number): Promise<void> {
  return apiClient.delete(`/roles/${id}`);
}
