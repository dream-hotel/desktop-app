export type AnnouncementPriority = "normal" | "importante" | "urgente";
export type AnnouncementAudience = "todos" | "recepcion" | "limpieza" | "administracion";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  audience: AnnouncementAudience;
  author: string;
  createdAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  message: string;
  priority: AnnouncementPriority;
  audience: AnnouncementAudience;
}
