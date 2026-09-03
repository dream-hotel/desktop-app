import { apiClient } from "./apiClient";

export interface DashboardActivityPoint {
  hour: number;
  count: number;
}

export interface DashboardMetrics {
  scope: "team" | "personal";
  activeTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  criticalTasks: number;
  completedToday: number;
  createdToday: number;
  withoutDeadline: number;
  completionPercentage: number;
  activeStaff: number;
  activityByHour: DashboardActivityPoint[];
}

export function getDashboardMetrics(): Promise<DashboardMetrics> {
  return apiClient.get<DashboardMetrics>("/dashboard");
}
