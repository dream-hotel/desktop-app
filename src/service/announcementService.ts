import { Announcement, CreateAnnouncementRequest } from "../types/models/Announcement";

let mockAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Mantenimiento del Elevador Principal",
    message: "El elevador principal estará fuera de servicio hoy desde las 14:00 hasta las 16:00. Por favor, redirigir a los huéspedes a los elevadores de servicio B y C.",
    priority: "importante",
    audience: "todos",
    author: "Juan Pérez",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "2",
    title: "Llegada Grupo VIP",
    message: "El grupo de la delegación diplomática llegará a las 18:00. Recepción, tener listas las llaves. Limpieza, asegurar amenidades extra en la suite presidencial.",
    priority: "urgente",
    audience: "recepcion",
    author: "María González",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  }
];

export async function getRecentAnnouncements(): Promise<Announcement[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return [...mockAnnouncements].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createAnnouncement(request: CreateAnnouncementRequest, authorName: string): Promise<Announcement> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const newAnnouncement: Announcement = {
    id: Math.random().toString(36).substr(2, 9),
    ...request,
    author: authorName,
    createdAt: new Date().toISOString(),
  };

  mockAnnouncements = [newAnnouncement, ...mockAnnouncements];
  return newAnnouncement;
}
