import { apiClient } from "./apiClient";
import { PaginatedResponse } from "../types/api";
import {
  BackendUserListItem,
  CreateUserPayload,
  FindUsersQuery,
  UpdateUserPayload,
} from "../types/models/Users";

function normalizeUser(u: BackendUserListItem): BackendUserListItem {
  // user_id is bigint in MySQL → arrives as a string; coerce to number.
  return {
    ...u,
    id: Number(u.id),
    schedules: (u.schedules || []).map((s: any) => ({
      ...s,
      id: Number(s.id),
    })),
  };
}

export async function listUsers(
  query: FindUsersQuery = {},
): Promise<PaginatedResponse<BackendUserListItem>> {
  const response = await apiClient.get<PaginatedResponse<BackendUserListItem>>("/users", {
    query,
  });
  return { ...response, data: response.data.map(normalizeUser) };
}

export async function getUser(id: number): Promise<BackendUserListItem> {
  const user = await apiClient.get<BackendUserListItem>(`/users/${id}`);
  return normalizeUser(user);
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
