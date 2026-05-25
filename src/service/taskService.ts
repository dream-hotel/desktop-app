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
