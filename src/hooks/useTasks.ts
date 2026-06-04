import { useState, useEffect, useCallback } from "react";
import {
  BackendTask,
  BackendTaskActivityLog,
  BackendTaskListItem,
  BackendTaskStatus,
  FindTasksQuery,
} from "../types/models/Task";
import { BackendPriority } from "../types/models/Announcement";
import {
  getTask,
  getTaskActivity,
  listTaskStatuses,
  listTasks,
} from "../service/taskService";
import { listPriorities } from "../service/priorityService";
import { usePolling } from "./usePolling";

export function useTasks(query: FindTasksQuery = {}) {
  const [tasks, setTasks] = useState<BackendTaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = JSON.stringify(query);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const response = await listTasks(query);
      setTasks(response.data);
      if (silent) setError(null);
    } catch (e) {
      if (!silent) {
        setError(e instanceof Error ? e.message : "Error al cargar tareas");
        setTasks([]);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePolling(() => fetchData(true));

  return { tasks, isLoading, error, refresh: fetchData };
}

export function useTaskDetail(taskId: number | null) {
  const [task, setTask] = useState<BackendTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (taskId == null) {
      setTask(null);
      return;
    }
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const data = await getTask(taskId);
      setTask(data);
      if (silent) setError(null);
    } catch (e) {
      if (!silent) {
        setError(e instanceof Error ? e.message : "Error al cargar la tarea");
        setTask(null);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePolling(() => fetchData(true), { enabled: taskId != null });

  return { task, isLoading, error, refresh: fetchData };
}

export function useTaskActivity(taskId: number | null) {
  const [entries, setEntries] = useState<BackendTaskActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (taskId == null) {
      setEntries([]);
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const response = await getTaskActivity(taskId, { page: 1, limit: 100 });
      setEntries(response.data);
    } catch {
      if (!silent) setEntries([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  usePolling(() => fetchData(true), { enabled: taskId != null });

  return { entries, isLoading, refresh: fetchData };
}

export function useTaskCatalogs() {
  const [statuses, setStatuses] = useState<BackendTaskStatus[]>([]);
  const [priorities, setPriorities] = useState<BackendPriority[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, p] = await Promise.all([listTaskStatuses(), listPriorities()]);
        if (!mounted) return;
        setStatuses(s);
        setPriorities(p);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { statuses, priorities, isLoading };
}
