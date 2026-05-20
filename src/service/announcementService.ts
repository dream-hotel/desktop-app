import { apiClient } from "./apiClient";
import { PaginatedResponse } from "../types/api";
import {
  Announcement,
  BackendAnnouncement,
  CreateAnnouncementPayload,
  FindAnnouncementsParams,
  UpdateAnnouncementPayload,
} from "../types/models/Announcement";

function mapAnnouncement(a: BackendAnnouncement): Announcement {
  return {
    id: a.id,
    type: a.announcementType,
    description: a.description,
    visibleUntil: a.visibleUntil,
    taskId: a.taskId,
    articleId: a.articleId,
    createdAt: a.createdAt,
  };
}

export async function findAnnouncements(
  params: FindAnnouncementsParams = {},
): Promise<PaginatedResponse<Announcement>> {
  const response = await apiClient.get<PaginatedResponse<BackendAnnouncement>>(
    "/announcements",
    {
      query: {
        page: params.page ?? 1,
        limit: params.limit ?? 50,
        type: params.type,
      },
    },
  );
  return {
    data: response.data.map(mapAnnouncement),
    meta: response.meta,
  };
}

export async function getAnnouncement(id: number): Promise<Announcement> {
  const a = await apiClient.get<BackendAnnouncement>(`/announcements/${id}`);
  return mapAnnouncement(a);
}

export async function createAnnouncement(
  payload: CreateAnnouncementPayload,
): Promise<Announcement> {
  const body: Record<string, unknown> = {
    announcementType: payload.announcementType,
  };
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.visibleUntil) body.visibleUntil = payload.visibleUntil;
  if (payload.announcementType === "task" && payload.taskId !== undefined) {
    body.taskId = payload.taskId;
  }
  if (payload.announcementType === "article" && payload.articleId !== undefined) {
    body.articleId = payload.articleId;
  }
  const created = await apiClient.post<BackendAnnouncement>("/announcements", body);
  return mapAnnouncement(created);
}

export async function updateAnnouncement(
  id: number,
  payload: UpdateAnnouncementPayload,
): Promise<Announcement> {
  const body: Record<string, unknown> = {};
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.visibleUntil !== undefined) {
    body.visibleUntil = payload.visibleUntil;
  }
  const updated = await apiClient.patch<BackendAnnouncement>(`/announcements/${id}`, body);
  return mapAnnouncement(updated);
}

export function deleteAnnouncement(id: number): Promise<void> {
  return apiClient.delete<void>(`/announcements/${id}`);
}
