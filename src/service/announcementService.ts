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
  const audienceUsers = a.audienceUsers ?? [];
  const audienceRoles = a.audienceRoles ?? [];
  return {
    id: a.id,
    title: a.title,
    type: a.announcementType,
    description: a.description,
    visibleUntil: a.visibleUntil,
    taskId: a.taskId,
    articleId: a.articleId,
    createdAt: a.createdAt,
    priority: a.priority,
    audienceUsers,
    audienceRoles,
    isPublic: audienceUsers.length === 0 && audienceRoles.length === 0,
    views: a.views ?? [],
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
    title: payload.title,
    priorityId: payload.priorityId,
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
  if (payload.audienceUserIds && payload.audienceUserIds.length > 0) {
    body.audienceUserIds = payload.audienceUserIds;
  }
  if (payload.audienceRoleIds && payload.audienceRoleIds.length > 0) {
    body.audienceRoleIds = payload.audienceRoleIds;
  }
  const created = await apiClient.post<BackendAnnouncement>("/announcements", body);
  return mapAnnouncement(created);
}

export async function updateAnnouncement(
  id: number,
  payload: UpdateAnnouncementPayload,
): Promise<Announcement> {
  const body: Record<string, unknown> = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.priorityId !== undefined) body.priorityId = payload.priorityId;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.visibleUntil !== undefined) {
    body.visibleUntil = payload.visibleUntil;
  }
  if (payload.audienceUserIds !== undefined) {
    body.audienceUserIds = payload.audienceUserIds;
  }
  if (payload.audienceRoleIds !== undefined) {
    body.audienceRoleIds = payload.audienceRoleIds;
  }
  const updated = await apiClient.patch<BackendAnnouncement>(`/announcements/${id}`, body);
  return mapAnnouncement(updated);
}

export function deleteAnnouncement(id: number): Promise<void> {
  return apiClient.delete<void>(`/announcements/${id}`);
}
