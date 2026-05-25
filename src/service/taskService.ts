import { apiClient } from "./apiClient";
import { PaginatedResponse, PaginationParams } from "../types/api";
import {
  BackendTask,
  BackendTaskActivityLog,
  BackendTaskListItem,
  BackendTaskStatus,
  CreateTaskPayload,
  FindTasksQuery,
  UpdateTaskPayload,
} from "../types/models/Task";

export function listTasks(
  query: FindTasksQuery = {},
): Promise<PaginatedResponse<BackendTaskListItem>> {
  return apiClient.get("/tasks", {
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 50,
      search: query.search,
      statusId: query.statusId,
      priorityId: query.priorityId,
    },
  });
}

export function getTask(id: number): Promise<BackendTask> {
  return apiClient.get(`/tasks/${id}`);
}

export function createTask(payload: CreateTaskPayload): Promise<BackendTask> {
  return apiClient.post("/tasks", payload);
}

export function updateTask(id: number, payload: UpdateTaskPayload): Promise<BackendTask> {
  return apiClient.patch(`/tasks/${id}`, payload);
}

export function deleteTask(id: number): Promise<void> {
  return apiClient.delete(`/tasks/${id}`);
}

export function addTaskFile(id: number, url: string): Promise<BackendTask> {
  return apiClient.post(`/tasks/${id}/files`, { url });
}

export function removeTaskFile(id: number, fileId: number): Promise<void> {
  return apiClient.delete(`/tasks/${id}/files/${fileId}`);
}

export async function uploadTaskFile(id: number, file: File): Promise<BackendTask> {
  // Custom request because apiClient.post sets JSON content-type; multipart needs the
  // browser to set the boundary automatically and skip JSON.stringify.
  const { API_URL } = await import("./apiConfig");
  const { getAccessToken } = await import("./apiClient");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/tasks/${id}/files/upload`, {
    method: "POST",
    headers: {
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
    body: form,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (Array.isArray(body?.message)) message = body.message.join(", ");
      else if (typeof body?.message === "string") message = body.message;
    } catch { /* not JSON */ }
    throw new Error(message);
  }
  return res.json();
}

export function getTaskActivity(
  id: number,
  pagination: PaginationParams = {},
): Promise<PaginatedResponse<BackendTaskActivityLog>> {
  return apiClient.get(`/tasks/${id}/activity`, {
    query: {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 100,
    },
  });
}

export function addTaskComment(id: number, comment: string): Promise<BackendTaskActivityLog> {
  return apiClient.post(`/tasks/${id}/comments`, { comment });
}

export function listTaskStatuses(): Promise<BackendTaskStatus[]> {
  return apiClient.get("/task-statuses");
}
