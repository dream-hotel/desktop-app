import { Announcement, CreateAnnouncementRequest, PaginatedAnnouncementsResponse } from "../types/models/Announcement";

const API_URL = "http://localhost:3000/api/hotel";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

export async function getRecentAnnouncements(type?: string, priorityId?: number): Promise<Announcement[]> {
  const params = new URLSearchParams();
  params.append("limit", "50"); // Get recent 50 announcements
  if (type) params.append("type", type);
  if (priorityId) params.append("priorityId", priorityId.toString());

  const response = await fetch(`${API_URL}/announcements?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Error al obtener los anuncios");
  }

  const result: PaginatedAnnouncementsResponse = await response.json();
  return result.data;
}

export async function createAnnouncement(request: CreateAnnouncementRequest): Promise<Announcement> {
  const response = await fetch(`${API_URL}/announcements`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error al crear el anuncio");
  }

  return response.json();
}

export async function deleteAnnouncement(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/announcements/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Error al eliminar el anuncio");
  }
}

