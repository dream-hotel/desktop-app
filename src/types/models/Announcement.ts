export type AnnouncementPriorityName = "low" | "medium" | "high" | "critical";

export interface AnnouncementPriority {
  id: number;
  name: AnnouncementPriorityName;
  isActive: boolean;
}

export interface Announcement {
  id: number;
  title: string;
  announcementType: "text" | "task" | "article";
  description: string | null;
  visibleUntil: string | null;
  taskId: number | null;
  articleId: number | null;
  createdAt: string;
  priority: AnnouncementPriority;
}

export interface CreateAnnouncementRequest {
  title: string;
  priorityId: number;
  announcementType: "text" | "task" | "article";
  description?: string;
  visibleUntil?: string;
  taskId?: number;
  articleId?: number;
}

export interface PaginatedAnnouncementsResponse {
  data: Announcement[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

