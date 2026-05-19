import { apiClient } from "./apiClient";
import { PaginatedResponse } from "../types/api";
import {
  BackendUserListItem,
  CreateUserPayload,
  FindUsersQuery,
  UpdateUserPayload,
} from "../types/models/Users";

export function listUsers(query: FindUsersQuery = {}): Promise<PaginatedResponse<BackendUserListItem>> {
  return apiClient.get("/users", { query });
}

export function getUser(id: number): Promise<BackendUserListItem> {
  return apiClient.get(`/users/${id}`);
}

export function createUser(payload: CreateUserPayload): Promise<BackendUserListItem> {
  return apiClient.post("/users", payload);
}

export function updateUser(id: number, payload: UpdateUserPayload): Promise<BackendUserListItem> {
  return apiClient.patch(`/users/${id}`, payload);
}

export function deleteUser(id: number): Promise<void> {
  return apiClient.delete(`/users/${id}`);
}
