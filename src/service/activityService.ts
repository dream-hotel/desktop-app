import { apiClient } from "./apiClient";
import { PaginatedResponse } from "../types/api";
import {
  BackendSystemLog,
  FindLogsQuery,
  LogType,
} from "../types/models/Activity";

export function listActivityLogs(query: FindLogsQuery = {}): Promise<PaginatedResponse<BackendSystemLog>> {
  return apiClient.get("/audit/logs", { query });
}

export function listLogTypes(): Promise<LogType[]> {
  return apiClient.get("/audit/log-types");
}
