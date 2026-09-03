import { useCallback, useEffect, useMemo, useState } from "react";
import { BackendTaskListItem } from "../types/models/Task";
import { Announcement } from "../types/models/Announcement";
import { listTasks } from "../service/taskService";
import { findAnnouncements } from "../service/announcementService";
import {
  DashboardMetrics,
  getDashboardMetrics,
} from "../service/dashboardService";
import { usePolling } from "./usePolling";

export interface DashboardData {
  tasks: BackendTaskListItem[];
  urgentTasks: BackendTaskListItem[];
  announcements: Announcement[];
  metrics: DashboardMetrics;
}

function isActive(task: BackendTaskListItem): boolean {
  return task.status.name === "pending" || task.status.name === "in_progress";
}

const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function validDeadline(task: BackendTaskListItem): number {
  if (!task.limitDate) return Number.POSITIVE_INFINITY;
  const value = new Date(task.limitDate).getTime();
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
}

function urgencyBand(task: BackendTaskListItem): number {
  const deadline = validDeadline(task);
  const remaining = deadline - Date.now();
  if (remaining < 0) return 0;
  if (remaining <= 24 * 60 * 60 * 1000) return 1;
  if (task.priority.name === "critical") return 2;
  return 3;
}

function urgencyOrder(a: BackendTaskListItem, b: BackendTaskListItem): number {
  const byBand = urgencyBand(a) - urgencyBand(b);
  if (byBand !== 0) return byBand;
  const byPriority = (PRIORITY_RANK[a.priority.name] ?? 99) - (PRIORITY_RANK[b.priority.name] ?? 99);
  if (byPriority !== 0) return byPriority;
  return validDeadline(a) - validDeadline(b);
}

export function useDashboard() {
  const [tasks, setTasks] = useState<BackendTaskListItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const [tasksRes, annRes, metricsRes] = await Promise.all([
        listTasks({ limit: 500 }),
        findAnnouncements({ limit: 5 }),
        getDashboardMetrics(),
      ]);
      setTasks(tasksRes.data);
      setAnnouncements(annRes.data);
      setMetrics(metricsRes);
      if (silent) setError(null);
    } catch (e) {
      // On background polls keep showing the last good data instead of wiping it.
      if (!silent) {
        setError(e instanceof Error ? e.message : "Error al cargar el dashboard");
        setTasks([]);
        setAnnouncements([]);
        setMetrics(null);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePolling(() => fetchData(true), { resources: ["tasks", "announcements"] });

  const data = useMemo<DashboardData | null>(() => {
    if (!metrics) return null;
    const active = tasks.filter(isActive);
    const urgentTasks = [...active].sort(urgencyOrder).slice(0, 7);
    return { tasks, urgentTasks, announcements, metrics };
  }, [tasks, announcements, metrics]);

  return { data, isLoading, error, refresh: fetchData };
}
