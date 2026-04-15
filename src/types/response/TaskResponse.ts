export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "in_progress" | "pending" | "done" | "blocked";

export interface ActivityLogEntry {
  id: number;
  authorName: string;
  action: string;
  time: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  deadline: string;
  comments: number;
  activityLog: ActivityLogEntry[];
}

export interface TasksResponse {
  tasks: Task[];
}
