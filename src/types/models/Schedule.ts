export interface DailyBlock {
  id: number;
  scheduleId: number;
  day: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  startTime: string; // "HH:MM:SS" or "HH:MM"
  endTime: string;
}

export interface WeeklySchedule {
  id: number;
  name: string;
  isPersonalized: boolean;
  createdAt: string;
  dailySchedules: DailyBlock[];
}

export interface CreateWeeklySchedulePayload {
  name: string;
  isPersonalized?: boolean;
}

export interface UpdateWeeklySchedulePayload {
  name?: string;
  isPersonalized?: boolean;
}

export interface CreateDailyBlockPayload {
  day: number;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface UpdateDailyBlockPayload {
  day?: number;
  startTime?: string;
  endTime?: string;
}

export const DAY_LABELS_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const MONTH_LABELS_SHORT_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const PALETTE = [
  "#e23737", // red
  "#c5a059", // tan/khaki
  "#3b59f2", // blue
  "#dc41b8", // pink
  "#f59e0b", // orange
  "#10b981", // green
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#ec4899", // hot pink
  "#84cc16", // lime
];

export function colorForUser(userId: number): string {
  const idx = Math.abs(userId) % PALETTE.length;
  return PALETTE[idx];
}

export function minutesFromTime(t: string): number {
  const [h, m] = t.split(":").map((v) => parseInt(v, 10));
  return (h || 0) * 60 + (m || 0);
}

export function formatTime(t: string): string {
  const [h, m] = t.split(":");
  return `${h}:${m}`;
}

export function formatDurationFromMinutes(mins: number): string {
  if (mins <= 0) return "0h 0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export function totalMinutesForSchedule(schedule: WeeklySchedule | null | undefined): number {
  if (!schedule) return 0;
  return schedule.dailySchedules.reduce(
    (acc, b) => acc + Math.max(0, minutesFromTime(b.endTime) - minutesFromTime(b.startTime)),
    0,
  );
}
