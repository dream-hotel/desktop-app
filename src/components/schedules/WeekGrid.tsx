import { useMemo, useState, useEffect, useRef } from "react";
import { BackendUserListItem } from "../../types/models/Users";
import {
  DAY_LABELS_SHORT,
  DailyBlock,
  MONTH_LABELS_SHORT_EN,
  WeeklySchedule,
  colorForUser,
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
  selectedUserIds: number[];
  weekStart: Date;
  daysToShow: number;
  startHour: number;
  endHour: number;
  isAdmin?: boolean;
  onCellClick?: (
    day: number,
    hour: number,
    minute: number,
    endHour?: number,
    endMinute?: number,
  ) => void;
  onBlockClick?: (block: DailyBlock, user: BackendUserListItem) => void;
  onBlockResize?: (block: DailyBlock, startTime: string, endTime: string) => Promise<void>;
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


export default function WeekGrid({
  users,
  schedulesById,
  selectedUserIds,
  weekStart,
  daysToShow,
  startHour,
  endHour,
  isAdmin = false,
  onCellClick,
  onBlockClick,
  onBlockResize,
}: WeekGridProps) {
  const dayColumns = useMemo(() => getDayColumns(weekStart, daysToShow), [weekStart, daysToShow]);

  const [dragSelect, setDragSelect] = useState<{
    day: number;
    startMin: number;
    currentMin: number;
  } | null>(null);

  const [resizeState, setResizeState] = useState<{
    block: DailyBlock;
    edge: "top" | "bottom";
    startMin: number;
    currentMin: number;
    day: number;
  } | null>(null);

  const justResizedRef = useRef(false);

  const hours = useMemo(() => {
    const result: number[] = [];
    for (let h = startHour; h < endHour; h++) result.push(h);
    return result;
  }, [startHour, endHour]);

  const gridHeight = hours.length * HOUR_ROW_HEIGHT;

  useEffect(() => {
    if (!dragSelect && !resizeState) return;

    function handleGlobalMouseMove(e: MouseEvent) {
      if (dragSelect) {
        const colEl = document.getElementById(`day-col-${dragSelect.day}`);
        if (!colEl) return;
        const rect = colEl.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const currentMin = Math.max(0, Math.min(1440, Math.round((y / gridHeight) * 1440)));
        const snapped = Math.round(currentMin / 15) * 15;
        setDragSelect((prev) => (prev ? { ...prev, currentMin: snapped } : null));
      } else if (resizeState) {
        const colEl = document.getElementById(`day-col-${resizeState.day}`);
        if (!colEl) return;
        const rect = colEl.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const currentMin = Math.max(0, Math.min(1440, Math.round((y / gridHeight) * 1440)));
        const snapped = Math.round(currentMin / 15) * 15;
        setResizeState((prev) => (prev ? { ...prev, currentMin: snapped } : null));
      }
    }

    function handleGlobalMouseUp() {
      if (dragSelect) {
        const start = Math.min(dragSelect.startMin, dragSelect.currentMin);
        const end = Math.max(dragSelect.startMin, dragSelect.currentMin);
        if (onCellClick) {
          const hour = Math.floor(start / 60);
          const minute = start % 60;
          if (end - start >= 15) {
            const endHour = Math.floor(end / 60);
            const endMinute = end % 60;
            onCellClick(dragSelect.day, hour, minute, endHour, endMinute);
          } else {
            onCellClick(dragSelect.day, hour, minute);
          }
        }
        setDragSelect(null);
      } else if (resizeState) {
        const { block, edge, currentMin, startMin } = resizeState;
        const originalStart = minutesFromTime(block.startTime);
        const originalEnd = minutesFromTime(block.endTime);
        let newStart = originalStart;
        let newEnd = originalEnd;

        if (edge === "top") {
          // Snap start time but do not let it exceed end time minus 15 minutes
          newStart = Math.min(originalEnd - 15, currentMin);
        } else {
          // Snap end time but do not let it drop below start time plus 15 minutes
          newEnd = Math.max(originalStart + 15, currentMin);
        }

        if (newStart !== originalStart || newEnd !== originalEnd) {
          const startTimeStr = `${String(Math.floor(newStart / 60)).padStart(2, "0")}:${String(
            newStart % 60,
          ).padStart(2, "0")}`;
          const endTimeStr = `${String(Math.floor(newEnd / 60)).padStart(2, "0")}:${String(
            newEnd % 60,
          ).padStart(2, "0")}`;
          onBlockResize?.(block, startTimeStr, endTimeStr);
        }

        if (currentMin !== startMin) {
          justResizedRef.current = true;
        }

        setResizeState(null);
      }
    }

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragSelect, resizeState, onCellClick, onBlockResize, gridHeight]);

  function handleColumnMouseDown(e: React.MouseEvent<HTMLDivElement>, dow: number) {
    if (!onCellClick) return;
    if (e.button !== 0) return; // Left click only

    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const initialMin = Math.round((y / gridHeight) * 1440);
    const snapped = Math.round(initialMin / 15) * 15;

    setDragSelect({
      day: dow,
      startMin: snapped,
      currentMin: snapped,
    });
  }

  // Group blocks by day-of-week
  const blocksByDow: Record<number, PositionedBlock[]> = useMemo(() => {
    const acc: Record<number, PositionedBlock[]> = {};
    for (let d = 0; d <= 6; d++) acc[d] = [];

    const usersToLayout = users.filter((u) => selectedUserIds.includes(u.id));

    for (const user of usersToLayout) {
      if (!user.schedules) continue;
      for (const userSchedule of user.schedules) {
        const schedule = schedulesById.get(userSchedule.id);
        if (!schedule) continue;
        for (const block of schedule.dailySchedules) {
          const startMinutes = minutesFromTime(block.startTime);
          const endMinutes = minutesFromTime(block.endTime);
          acc[block.day]?.push({
            user,
            block,
            startMinutes,
            endMinutes,
            laneIndex: selectedUserIds.indexOf(user.id),
            laneCount: selectedUserIds.length || 1,
          });
        }
      }
    }
    return acc;
  }, [users, schedulesById, selectedUserIds]);
  const minutesPerView = (endHour - startHour) * 60;
  const minutesToY = (m: number) => ((m - startHour * 60) / minutesPerView) * gridHeight;

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
                id={`day-col-${col.dow}`}
                onMouseDown={(e) => handleColumnMouseDown(e, col.dow)}
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

                {/* Drag selection preview */}
                {dragSelect && dragSelect.day === col.dow && (() => {
                  const start = Math.min(dragSelect.startMin, dragSelect.currentMin);
                  const end = Math.max(dragSelect.startMin, dragSelect.currentMin);
                  const top = minutesToY(start);
                  const bottom = minutesToY(end);
                  
                  const startHour = Math.floor(start / 60);
                  const startMinStr = String(startHour).padStart(2, "0") + ":" + String(start % 60).padStart(2, "0");
                  const endHour = Math.floor(end / 60);
                  const endMinStr = String(endHour).padStart(2, "0") + ":" + String(end % 60).padStart(2, "0");

                  return (
                    <div
                      style={{
                        position: "absolute",
                        top,
                        height: Math.max(16, bottom - top),
                        left: "2px",
                        right: "2px",
                        backgroundColor: "rgba(59, 130, 246, 0.18)",
                        border: "2px dashed #3b82f6",
                        borderRadius: "6px",
                        pointerEvents: "none",
                        zIndex: 30,
                      }}
                      className="flex flex-col items-start p-2"
                    >
                      <span className="font-inter text-[11px] font-semibold text-primary">
                        Nuevo bloque
                      </span>
                      <span className="font-inter text-[10px] text-primary/80">
                        {startMinStr} – {endMinStr}
                      </span>
                    </div>
                  );
                })()}

                {/* Blocks */}
                {dayBlocks.map((pb) => {
                  let startMinutes = minutesFromTime(pb.block.startTime);
                  let endMinutes = minutesFromTime(pb.block.endTime);

                  // If this block is currently being resized, use the temporary drag value
                  if (resizeState && resizeState.block.id === pb.block.id) {
                    if (resizeState.edge === "top") {
                      startMinutes = Math.min(endMinutes - 15, resizeState.currentMin);
                    } else {
                      endMinutes = Math.max(startMinutes + 15, resizeState.currentMin);
                    }
                  }

                  const top = minutesToY(startMinutes);
                  const bottom = minutesToY(endMinutes);
                  const color = colorForUser(pb.user.id);
                  const startHourStr = String(Math.floor(startMinutes / 60)).padStart(2, "0");
                  const startMinStr = String(startMinutes % 60).padStart(2, "0");
                  const endHourStr = String(Math.floor(endMinutes / 60)).padStart(2, "0");
                  const endMinStr = String(endMinutes % 60).padStart(2, "0");

                  const N = pb.laneCount;
                  const index = pb.laneIndex;
                  const widthPercent = 100 / N;
                  const leftPercent = index * widthPercent;

                  return (
                    <button
                      key={pb.block.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (justResizedRef.current) {
                          justResizedRef.current = false;
                          return;
                        }
                        onBlockClick?.(pb.block, pb.user);
                      }}
                      onMouseDown={(e) => {
                        // Prevent triggering column drag selection behind the block
                        e.stopPropagation();
                      }}
                      style={{
                        position: "absolute",
                        top,
                        height: Math.max(24, bottom - top),
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `calc(${widthPercent}% - 4px)`,
                        backgroundColor: `${color}1F`, // ~12% opacity color background
                        border: `1px solid ${color}4D`, // ~30% opacity border all around
                        borderLeft: `4px solid ${color}`, // solid left accent bar
                        zIndex: 10,
                      }}
                      className="flex flex-col items-start rounded-[6px] p-2 text-left transition-all hover:shadow-md hover:brightness-95 cursor-pointer"
                    >
                      <span
                        className="font-inter text-[11px] font-medium leading-[14px] truncate w-full"
                        style={{ color: color }}
                      >
                        {pb.user.lastName}, {pb.user.fullName}
                      </span>
                      <span className="font-inter text-[10px] leading-[13px] text-text-secondary truncate w-full">
                        {startHourStr}:{startMinStr} – {endHourStr}:{endMinStr}
                      </span>

                      {/* Resize handles (Admin only) */}
                      {isAdmin && (
                        <>
                          {/* Top handle with centered dot */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (e.button !== 0) return;
                              setResizeState({
                                block: pb.block,
                                edge: "top",
                                startMin: minutesFromTime(pb.block.startTime),
                                currentMin: minutesFromTime(pb.block.startTime),
                                day: pb.block.day,
                              });
                            }}
                            className="absolute top-[-5px] left-0 right-0 h-[10px] cursor-ns-resize flex justify-center items-center z-20 group/handle-top"
                            title="Arrastra para cambiar inicio"
                          >
                            <div
                              className="w-[8px] h-[8px] bg-white border border-solid rounded-full shadow-sm transition-transform group-hover/handle-top:scale-125"
                              style={{ borderColor: color }}
                            />
                          </div>

                          {/* Bottom handle with centered dot */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (e.button !== 0) return;
                              setResizeState({
                                block: pb.block,
                                edge: "bottom",
                                startMin: minutesFromTime(pb.block.endTime),
                                currentMin: minutesFromTime(pb.block.endTime),
                                day: pb.block.day,
                              });
                            }}
                            className="absolute bottom-[-5px] left-0 right-0 h-[10px] cursor-ns-resize flex justify-center items-center z-20 group/handle-bottom"
                            title="Arrastra para cambiar fin"
                          >
                            <div
                              className="w-[8px] h-[8px] bg-white border border-solid rounded-full shadow-sm transition-transform group-hover/handle-bottom:scale-125"
                              style={{ borderColor: color }}
                            />
                          </div>
                        </>
                      )}
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
