import { apiClient } from "./apiClient";
import { PaginatedResponse, PaginationParams } from "../types/api";
import {
  CreateDailyBlockPayload,
  CreateWeeklySchedulePayload,
  DailyBlock,
  UpdateDailyBlockPayload,
  UpdateWeeklySchedulePayload,
  WeeklySchedule,
} from "../types/models/Schedule";

export function listSchedules(query: PaginationParams = {}): Promise<PaginatedResponse<WeeklySchedule>> {
  return apiClient.get("/schedules", { query });
}

export function getSchedule(id: number): Promise<WeeklySchedule> {
  return apiClient.get(`/schedules/${id}`);
}

export function createSchedule(payload: CreateWeeklySchedulePayload): Promise<WeeklySchedule> {
  return apiClient.post("/schedules", payload);
}

export function updateSchedule(
  id: number,
  payload: UpdateWeeklySchedulePayload,
): Promise<WeeklySchedule> {
  return apiClient.patch(`/schedules/${id}`, payload);
}

export function deleteSchedule(id: number): Promise<void> {
  return apiClient.delete(`/schedules/${id}`);
}

export function addDailyBlock(
  scheduleId: number,
  payload: CreateDailyBlockPayload,
): Promise<DailyBlock> {
  return apiClient.post(`/schedules/${scheduleId}/days`, payload);
}

export function updateDailyBlock(
  scheduleId: number,
  dayId: number,
  payload: UpdateDailyBlockPayload,
): Promise<DailyBlock> {
  return apiClient.patch(`/schedules/${scheduleId}/days/${dayId}`, payload);
}

export function deleteDailyBlock(scheduleId: number, dayId: number): Promise<void> {
  return apiClient.delete(`/schedules/${scheduleId}/days/${dayId}`);
}
