import { apiClient } from "./apiClient";
import { BackendPermission } from "../types/models/Roles";

export function listPermissions(): Promise<BackendPermission[]> {
  return apiClient.get<BackendPermission[]>("/permissions");
}
