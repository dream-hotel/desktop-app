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

function normalizeDailyBlock(b: DailyBlock): DailyBlock {
  return {
    ...b,
    id: Number(b.id),
    scheduleId: Number(b.scheduleId),
  };
}

function normalizeSchedule(s: WeeklySchedule): WeeklySchedule {
  return {
    ...s,
    id: Number(s.id),
    dailySchedules: (s.dailySchedules || []).map(normalizeDailyBlock),
  };
}

export async function listSchedules(query: PaginationParams = {}): Promise<PaginatedResponse<WeeklySchedule>> {
  const response = await apiClient.get<PaginatedResponse<WeeklySchedule>>("/schedules", { query });
  return {
    ...response,
    data: response.data.map(normalizeSchedule),
  };
}

export async function getSchedule(id: number): Promise<WeeklySchedule> {
  const s = await apiClient.get<WeeklySchedule>(`/schedules/${id}`);
  return normalizeSchedule(s);
}

export async function createSchedule(payload: CreateWeeklySchedulePayload): Promise<WeeklySchedule> {
  const s = await apiClient.post<WeeklySchedule>("/schedules", payload);
  return normalizeSchedule(s);
}

export async function updateSchedule(
  id: number,
  payload: UpdateWeeklySchedulePayload,
): Promise<WeeklySchedule> {
  const s = await apiClient.patch<WeeklySchedule>(`/schedules/${id}`, payload);
  return normalizeSchedule(s);
}

export function deleteSchedule(id: number): Promise<void> {
  return apiClient.delete(`/schedules/${id}`);
}

function ensureSeconds(t: string): string {
  if (!t) return t;
  const parts = t.split(":");
  if (parts.length === 2) {
    return `${t}:00`;
  }
  return t;
}

export async function addDailyBlock(
  scheduleId: number,
  payload: CreateDailyBlockPayload,
): Promise<DailyBlock> {
  const formattedPayload = {
    ...payload,
    scheduleId,
    startTime: ensureSeconds(payload.startTime),
    endTime: ensureSeconds(payload.endTime),
  };
  const b = await apiClient.post<DailyBlock>(`/schedules/${scheduleId}/days`, formattedPayload);
  return normalizeDailyBlock(b);
}

export async function updateDailyBlock(
  scheduleId: number,
  dayId: number,
  payload: UpdateDailyBlockPayload,
): Promise<DailyBlock> {
  const formattedPayload = {
    ...payload,
    scheduleId,
    startTime: payload.startTime ? ensureSeconds(payload.startTime) : undefined,
    endTime: payload.endTime ? ensureSeconds(payload.endTime) : undefined,
  };
  const b = await apiClient.patch<DailyBlock>(`/schedules/${scheduleId}/days/${dayId}`, formattedPayload);
  return normalizeDailyBlock(b);
}

export function deleteDailyBlock(scheduleId: number, dayId: number): Promise<void> {
  return apiClient.delete(`/schedules/${scheduleId}/days/${dayId}`);
}
