import { useState, useEffect, useCallback } from "react";
import { TasksResponse } from "../types/response/TaskResponse";
import { getTasksData } from "../service/taskService";

export function useTasks() {
  const [data, setData] = useState<TasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getTasksData();
      setData(response);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, refresh: fetchData };
}
