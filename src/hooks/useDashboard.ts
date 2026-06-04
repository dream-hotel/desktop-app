import { useCallback, useEffect, useMemo, useState } from "react";
import { BackendTaskListItem } from "../types/models/Task";
import { Announcement } from "../types/models/Announcement";
import { listTasks } from "../service/taskService";
import { findAnnouncements } from "../service/announcementService";
import { usePolling } from "./usePolling";

export interface DashboardStats {
  pending: number;
  inProgress: number;
  dueSoon: number;
  critical: number;
}

export interface DashboardData {
  tasks: BackendTaskListItem[];
  urgentTasks: BackendTaskListItem[];
  announcements: Announcement[];
  stats: DashboardStats;
}

function isActive(task: BackendTaskListItem): boolean {
  return task.status.name === "pending" || task.status.name === "in_progress";
}

function isDueWithin(task: BackendTaskListItem, hours: number): boolean {
  if (!task.limitDate) return false;
  const limit = new Date(task.limitDate).getTime();
  if (Number.isNaN(limit)) return false;
  const now = Date.now();
  return limit - now <= hours * 60 * 60 * 1000;
}

const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function urgencyScore(task: BackendTaskListItem): number {
  return PRIORITY_RANK[task.priority.name] ?? 99;
}

function urgencyOrder(a: BackendTaskListItem, b: BackendTaskListItem): number {
  const byPriority = urgencyScore(a) - urgencyScore(b);
  if (byPriority !== 0) return byPriority;
  const aLimit = a.limitDate ? new Date(a.limitDate).getTime() : Number.POSITIVE_INFINITY;
  const bLimit = b.limitDate ? new Date(b.limitDate).getTime() : Number.POSITIVE_INFINITY;
  return aLimit - bLimit;
}

export function useDashboard() {
  const [tasks, setTasks] = useState<BackendTaskListItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const [tasksRes, annRes] = await Promise.all([
        listTasks({ limit: 200 }),
        findAnnouncements({ limit: 5 }),
      ]);
      setTasks(tasksRes.data);
      setAnnouncements(annRes.data);
      if (silent) setError(null);
    } catch (e) {
      // On background polls keep showing the last good data instead of wiping it.
      if (!silent) {
        setError(e instanceof Error ? e.message : "Error al cargar el dashboard");
        setTasks([]);
        setAnnouncements([]);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePolling(() => fetchData(true));

  const data = useMemo<DashboardData | null>(() => {
    const active = tasks.filter(isActive);
    const stats: DashboardStats = {
      pending: tasks.filter((t) => t.status.name === "pending").length,
      inProgress: tasks.filter((t) => t.status.name === "in_progress").length,
      dueSoon: active.filter((t) => isDueWithin(t, 24)).length,
      critical: active.filter((t) => t.priority.name === "critical").length,
    };
    const urgentTasks = [...active].sort(urgencyOrder).slice(0, 5);
    return { tasks, urgentTasks, announcements, stats };
  }, [tasks, announcements]);

  return { data, isLoading, error, refresh: fetchData };
}
