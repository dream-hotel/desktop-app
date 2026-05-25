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

export function useTasks(query: FindTasksQuery = {}) {
  const [tasks, setTasks] = useState<BackendTaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = JSON.stringify(query);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listTasks(query);
      setTasks(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar tareas");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { tasks, isLoading, error, refresh: fetchData };
}

export function useTaskDetail(taskId: number | null) {
  const [task, setTask] = useState<BackendTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (taskId == null) {
      setTask(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTask(taskId);
      setTask(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la tarea");
      setTask(null);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { task, isLoading, error, refresh: fetchData };
}

export function useTaskActivity(taskId: number | null) {
  const [entries, setEntries] = useState<BackendTaskActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (taskId == null) {
      setEntries([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await getTaskActivity(taskId, { page: 1, limit: 100 });
      setEntries(response.data);
    } catch {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
