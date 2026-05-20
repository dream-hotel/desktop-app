// === Backend DTOs (mirror /backend/src/modules/announcements) ===

export type AnnouncementType = "task" | "article" | "text";

export interface BackendAnnouncement {
  id: number;
  announcementType: AnnouncementType;
  description: string | null;
  visibleUntil: string | null;
  taskId: number | null;
  articleId: number | null;
  createdAt: string;
}

// === Frontend view model ===

export interface Announcement {
  id: number;
  type: AnnouncementType;
  description: string | null;
  visibleUntil: string | null;
  taskId: number | null;
  articleId: number | null;
  createdAt: string;
}

// === Inputs ===

export interface CreateAnnouncementPayload {
  announcementType: AnnouncementType;
  description?: string;
  visibleUntil?: string | null;
  taskId?: number;
  articleId?: number;
}

export interface UpdateAnnouncementPayload {
  description?: string;
  visibleUntil?: string | null;
}

export interface FindAnnouncementsParams {
  page?: number;
  limit?: number;
  type?: AnnouncementType;
}
