import { useState, useEffect, useCallback } from "react";
import { DashboardResponse } from "../types/response/DashboardResponse";
import { getDashboardData } from "../service/dashboardService";

export function useDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getDashboardData();
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
