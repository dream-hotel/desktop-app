import { useMemo } from "react";
import { BackendUserListItem } from "../../types/models/Users";
import {
  DAY_LABELS_SHORT,
  DailyBlock,
  MONTH_LABELS_SHORT_EN,
  WeeklySchedule,
  colorForUser,
  formatTime,
  minutesFromTime,
} from "../../types/models/Schedule";

const HOUR_ROW_HEIGHT = 60;
const HOUR_LABEL_COLUMN = 56;

interface PositionedBlock {
  user: BackendUserListItem;
  block: DailyBlock;
  startMinutes: number;
  endMinutes: number;
  laneIndex: number;
  laneCount: number;
}

interface WeekGridProps {
  users: BackendUserListItem[];
  schedulesById: Map<number, WeeklySchedule>;
  selectedUserId: number | null;
  weekStart: Date;
  daysToShow: number;
  startHour: number;
  endHour: number;
  onCellClick?: (day: number, hour: number, minute: number) => void;
  onBlockClick?: (block: DailyBlock, user: BackendUserListItem) => void;
}

function getDayColumns(weekStart: Date, daysToShow: number): { dow: number; date: Date }[] {
  const cols: { dow: number; date: Date }[] = [];
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    cols.push({ dow: date.getDay(), date });
  }
  return cols;
}

function layoutBlocksForDay(blocks: PositionedBlock[]): PositionedBlock[] {
  if (blocks.length === 0) return [];
  const sorted = [...blocks].sort((a, b) => a.startMinutes - b.startMinutes);
  const lanes: number[] = []; // lanes[i] = end minute of last block in lane i
  for (const b of sorted) {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i] <= b.startMinutes) {
        b.laneIndex = i;
        lanes[i] = b.endMinutes;
        placed = true;
        break;
      }
    }
    if (!placed) {
      b.laneIndex = lanes.length;
      lanes.push(b.endMinutes);
    }
  }
  const laneCount = Math.max(1, lanes.length);
  for (const b of sorted) b.laneCount = laneCount;
  return sorted;
}

export default function WeekGrid({
  users,
  schedulesById,
  selectedUserId,
  weekStart,
  daysToShow,
  startHour,
  endHour,
  onCellClick,
  onBlockClick,
}: WeekGridProps) {
  const dayColumns = useMemo(() => getDayColumns(weekStart, daysToShow), [weekStart, daysToShow]);

  const hours = useMemo(() => {
    const result: number[] = [];
    for (let h = startHour; h < endHour; h++) result.push(h);
    return result;
  }, [startHour, endHour]);

  // Group blocks by day-of-week
  const blocksByDow: Record<number, PositionedBlock[]> = useMemo(() => {
    const acc: Record<number, PositionedBlock[]> = {};
    for (let d = 0; d <= 6; d++) acc[d] = [];
    for (const user of users) {
      if (!user.scheduleId) continue;
      const schedule = schedulesById.get(user.scheduleId);
      if (!schedule) continue;
      for (const block of schedule.dailySchedules) {
        const startMinutes = minutesFromTime(block.startTime);
        const endMinutes = minutesFromTime(block.endTime);
        acc[block.day]?.push({
          user,
          block,
          startMinutes,
          endMinutes,
          laneIndex: 0,
          laneCount: 1,
        });
      }
    }
    for (const d of Object.keys(acc)) {
      acc[Number(d)] = layoutBlocksForDay(acc[Number(d)]);
    }
    return acc;
  }, [users, schedulesById]);

  const gridHeight = hours.length * HOUR_ROW_HEIGHT;
  const minutesPerView = (endHour - startHour) * 60;
  const minutesToY = (m: number) => ((m - startHour * 60) / minutesPerView) * gridHeight;

  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>, dow: number) {
    if (!onCellClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minute = Math.max(
      0,
      Math.min(minutesPerView - 30, Math.floor((y / gridHeight) * minutesPerView)),
    );
    const totalMinute = startHour * 60 + minute;
    const hour = Math.floor(totalMinute / 60);
    const minPart = totalMinute % 60;
    onCellClick(dow, hour, Math.floor(minPart / 15) * 15);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-border bg-surface">
      {/* Day header */}
      <div className="flex border-b border-border">
        <div style={{ width: HOUR_LABEL_COLUMN }} className="shrink-0 border-r border-border" />
        {dayColumns.map((col, idx) => {
          const today = new Date();
          const isToday =
            col.date.getFullYear() === today.getFullYear() &&
            col.date.getMonth() === today.getMonth() &&
            col.date.getDate() === today.getDate();
          return (
            <div
              key={idx}
              className={`flex flex-1 flex-col items-center gap-[2px] border-r border-border py-3 last:border-r-0 ${
                isToday ? "bg-primary-light" : ""
              }`}
            >
              <span className="font-inter text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                {DAY_LABELS_SHORT[col.dow]}
              </span>
              <span
                className={`font-alexandria text-[20px] font-normal leading-[22px] ${
                  isToday ? "text-primary" : "text-text-primary"
                }`}
              >
                {col.date.getDate()}
              </span>
              <span className="font-inter text-[10px] text-text-secondary">
                {MONTH_LABELS_SHORT_EN[col.date.getMonth()]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-y-auto">
        <div className="flex w-full">
          {/* Hour labels */}
          <div
            style={{ width: HOUR_LABEL_COLUMN, height: gridHeight }}
            className="shrink-0 border-r border-border"
          >
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_ROW_HEIGHT }}
                className="relative px-2"
              >
                <span className="absolute -top-2 left-2 bg-surface px-1 font-inter text-[11px] text-text-secondary">
                  {h}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {dayColumns.map((col, idx) => {
            const dayBlocks = blocksByDow[col.dow] ?? [];
            return (
              <div
                key={idx}
                onClick={(e) => handleColumnClick(e, col.dow)}
                className="relative flex-1 cursor-cell border-r border-border last:border-r-0"
                style={{ height: gridHeight }}
              >
                {/* Hour separators */}
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{
                      top: (h - startHour) * HOUR_ROW_HEIGHT,
                      height: HOUR_ROW_HEIGHT,
                    }}
                    className="absolute left-0 right-0 border-t border-border first:border-t-0"
                  />
                ))}
                {/* Blocks */}
                {dayBlocks.map((pb) => {
                  const top = minutesToY(pb.startMinutes);
                  const bottom = minutesToY(pb.endMinutes);
                  const isSelected = selectedUserId === pb.user.id;
                  const dimmed = selectedUserId !== null && !isSelected;
                  const color = colorForUser(pb.user.id);
                  const widthPct = 100 / pb.laneCount;
                  const leftPct = pb.laneIndex * widthPct;

                  return (
                    <button
                      key={pb.block.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockClick?.(pb.block, pb.user);
                      }}
                      style={{
                        position: "absolute",
                        top,
                        height: Math.max(20, bottom - top),
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                        backgroundColor: `${color}26`,
                        borderLeft: `3px solid ${color}`,
                        opacity: dimmed ? 0.35 : 1,
                      }}
                      className="flex flex-col items-start overflow-hidden rounded-[6px] p-[6px] text-left transition-opacity hover:shadow-md"
                    >
                      <span
                        className="font-inter text-[11px] font-medium leading-[14px]"
                        style={{ color: color }}
                      >
                        {pb.user.lastName}, {pb.user.fullName}
                      </span>
                      <span className="font-inter text-[10px] leading-[13px] text-text-secondary">
                        {formatTime(pb.block.startTime)} – {formatTime(pb.block.endTime)}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
