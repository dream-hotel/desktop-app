// Mirrors backend DTOs from /backend/src/modules/tasks
import { BackendPriority, PriorityName } from "./Announcement";

export type TaskStatusName = "pending" | "in_progress" | "completed" | "archived";

export interface BackendTaskStatus {
  id: number;
  name: TaskStatusName | string;
  isActive: boolean;
}

export interface BackendTaskUser {
  id: number;
  fullName: string;
  lastName: string;
}

export interface BackendTaskAssignee {
  taskId: number;
  userId: number;
  user: BackendTaskUser;
}

export interface BackendTaskFile {
  id: number;
  url: string;
}

export interface BackendTaskListItem {
  id: number;
  title: string;
  startDate: string | null;
  limitDate: string | null;
  createdAt: string;
  status: BackendTaskStatus;
  priority: BackendPriority;
  creator: BackendTaskUser;
  assignments: BackendTaskAssignee[];
}

export interface BackendTaskViewer {
  id: number;
  fullName: string;
  lastName: string;
  viewedAt: string | null;
}

export interface BackendTask {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  scheduleOriginId: number | null;
  startDate: string | null;
  limitDate: string | null;
  createdAt: string;
  updatedAt: string | null;
  status: BackendTaskStatus;
  priority: BackendPriority;
  creator: BackendTaskUser;
  assignments: BackendTaskAssignee[];
  files: BackendTaskFile[];
  viewers?: BackendTaskViewer[];
}

export interface BackendTaskActivityLog {
  id: number;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  userId: number | null;
  createdAt: string;
  imageUrls: string[] | null;
  user: BackendTaskUser | null;
}

export interface FindTasksQuery {
  page?: number;
  limit?: number;
  search?: string;
  statusId?: number;
  priorityId?: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  content?: string;
  statusId: number;
  priorityId: number;
  startDate?: string;
  limitDate?: string;
  scheduleOriginId?: number;
  assigneeIds: number[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  content?: string;
  statusId?: number;
  priorityId?: number;
  startDate?: string;
  limitDate?: string;
  assigneeIds?: number[];
}

// === Display helpers ===

export function fullName(user: BackendTaskUser): string {
  const combined = `${user.fullName ?? ""} ${user.lastName ?? ""}`.trim();
  return combined || `Usuario #${user.id}`;
}

export function shortName(user: BackendTaskUser): string {
  const first = (user.fullName ?? "").trim().split(/\s+/)[0] ?? "";
  const lastInitial = (user.lastName ?? "").trim().charAt(0);
  if (!first) return `Usuario #${user.id}`;
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

export function statusLabel(name: string): string {
  switch (name) {
    case "pending":
      return "Pendiente";
    case "in_progress":
      return "En progreso";
    case "completed":
      return "Finalizado";
    case "archived":
      return "Archivado";
    default:
      return name;
  }
}

export function priorityNameLabel(name: PriorityName | string): string {
  switch (name) {
    case "low":
      return "Baja";
    case "medium":
      return "Media";
    case "high":
      return "Alta";
    case "critical":
      return "Crítica";
    default:
      return name;
  }
}
