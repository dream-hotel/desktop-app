import { apiClient } from "./apiClient";
import { BackendPriority } from "../types/models/Announcement";

export function listPriorities(): Promise<BackendPriority[]> {
  return apiClient.get<BackendPriority[]>("/priorities");
}
