// === Backend DTOs (mirror /backend/src/modules/announcements) ===

export type AnnouncementType = "task" | "article" | "text";

export type PriorityName = "low" | "medium" | "high" | "critical";

export interface BackendPriority {
  id: number;
  name: PriorityName | string;
  isActive: boolean;
}

export interface BackendAnnouncement {
  id: number;
  title: string;
  announcementType: AnnouncementType;
  description: string | null;
  visibleUntil: string | null;
  taskId: number | null;
  articleId: number | null;
  createdAt: string;
  priority: BackendPriority;
}

// === Frontend view model ===

export interface Announcement {
  id: number;
  title: string;
  type: AnnouncementType;
  description: string | null;
  visibleUntil: string | null;
  taskId: number | null;
  articleId: number | null;
  createdAt: string;
  priority: BackendPriority;
}

// === Inputs ===

export interface CreateAnnouncementPayload {
  title: string;
  priorityId: number;
  announcementType: AnnouncementType;
  description?: string;
  visibleUntil?: string | null;
  taskId?: number;
  articleId?: number;
}

export interface UpdateAnnouncementPayload {
  title?: string;
  priorityId?: number;
  description?: string;
  visibleUntil?: string | null;
}

export interface FindAnnouncementsParams {
  page?: number;
  limit?: number;
  type?: AnnouncementType;
}

export function priorityLabel(name: string): string {
  switch (name.toLowerCase()) {
    case "low":
      return "Baja";
    case "medium":
      return "Media";
    case "high":
      return "Alta";
    case "critical":
      return "Crítica";
    default:
      return name;
  }
}

export function priorityTone(name: string): { bg: string; text: string; dot: string } {
  switch (name.toLowerCase()) {
    case "critical":
      return { bg: "bg-danger/10", text: "text-danger", dot: "bg-danger" };
    case "high":
      return { bg: "bg-warning/15", text: "text-warning", dot: "bg-warning" };
    case "medium":
      return { bg: "bg-info/10", text: "text-info", dot: "bg-info" };
    case "low":
      return { bg: "bg-success/10", text: "text-success", dot: "bg-success" };
    default:
      return { bg: "bg-neutral-soft", text: "text-text-secondary", dot: "bg-neutral-mid" };
  }
}
