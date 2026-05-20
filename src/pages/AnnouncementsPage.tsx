import { useState, useEffect } from "react";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import CreateAnnouncementForm from "../components/announcements/CreateAnnouncementForm";
import { useAuth } from "../hooks/useAuth";
import { useDashboard } from "../hooks/useDashboard";
import { Announcement, CreateAnnouncementRequest } from "../types/models/Announcement";
import * as announcementService from "../service/announcementService";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { data: dashboardData } = useDashboard();
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isAdmin = user?.role === "administrador";

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await announcementService.getRecentAnnouncements();
      setRecentAnnouncements(data);
    } catch (error) {
      console.error("Error al cargar anuncios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async (request: CreateAnnouncementRequest) => {
    await announcementService.createAnnouncement(request);
    await loadAnnouncements(); // Reload the list
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este anuncio permanentemente?")) {
      return;
    }
    setDeletingId(id);
    try {
      await announcementService.deleteAnnouncement(id);
      await loadAnnouncements();
    } catch (error) {
      console.error("Error al eliminar el anuncio:", error);
      alert("No se pudo eliminar el anuncio.");
    } finally {
      setDeletingId(null);
    }
  };

  const pendingNotifications = dashboardData?.notifications.filter(n => n.status === "pendiente") || [];

  const getPriorityColor = (priorityName: string) => {
    switch (priorityName) {
      case "critical": return "text-danger bg-danger/10";
      case "high": return "text-warning bg-warning/15";
      case "medium": return "text-primary bg-primary-light";
      default: return "text-text-secondary bg-gray-100";
    }
  };

  const getPriorityLabel = (priorityName: string) => {
    switch (priorityName) {
      case "critical": return "Crítica";
      case "high": return "Alta";
      case "medium": return "Media";
      default: return "Baja";
    }
  };

  const formatDate = (isoString: Date | string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg">
      <DashboardHeader
        user={user!}
        notificationCount={pendingNotifications.length}
        notifications={dashboardData?.notifications || []}
        showNotifications={false}
        onToggleNotifications={() => { }}
        onCloseNotifications={() => { }}
        customTitle="Anuncios Oficiales"
      />

      <div className="flex flex-1 overflow-hidden p-8 gap-8">
        {/* Lado Izquierdo: Formulario (Admin) o Widget Informativo (No-Admin) */}
        <div className="flex flex-col w-[45%] overflow-y-auto pr-2">
          {isAdmin ? (
            <CreateAnnouncementForm onSubmit={handleCreateAnnouncement} />
          ) : (
            <div className="flex flex-col gap-6 rounded-[16px] bg-white p-8 shadow-sm border border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-alexandria text-[18px] font-medium text-text-primary">
                    Panel Informativo
                  </h3>
                  <p className="font-inter text-[13px] text-text-secondary">
                    Canal oficial de anuncios del hotel
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="font-inter text-[14px] leading-relaxed text-text-secondary">
                  ¡Hola, <span className="font-semibold text-text-primary">{user?.fullName}</span>! Te encuentras en la sección de anuncios del hotel. 
                </p>
                <p className="mt-3 font-inter text-[13px] leading-relaxed text-text-secondary">
                  Los anuncios son publicados únicamente por los <strong>Administradores</strong> para notificar al personal sobre mantenimientos urgentes, visitas VIP, auditorías y cambios de turnos obligatorios.
                </p>
              </div>

              <div className="rounded-[12px] bg-primary-light p-4">
                <h4 className="font-inter text-[13px] font-semibold text-primary flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Tus Responsabilidades:
                </h4>
                <ul className="mt-2 list-disc list-inside font-inter text-[12px] text-text-secondary flex flex-col gap-1">
                  <li>Estar atento a avisos con prioridad crítica o alta.</li>
                  <li>Revisar las tareas vinculadas haciendo uso de su ID.</li>
                  <li>Actualizar el servicio en base a las fechas indicadas.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Lado Derecho: Historial de Anuncios */}
        <div className="flex flex-col flex-1 rounded-[16px] bg-white shadow-sm overflow-hidden border border-border">
          <div className="border-b border-border p-6 bg-gray-50/50">
            <h3 className="font-inter text-[16px] font-bold text-text-primary flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-primary">
                <path d="M9 17A8 8 0 109 1a8 8 0 000 16z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Historial de Anuncios
            </h3>
            <p className="mt-1 font-inter text-[12px] text-text-secondary">
              Últimos comunicados publicados en el sistema por la administración.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-full text-text-secondary text-[13px]">
                Cargando historial de anuncios...
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-text-secondary">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-20">
                  <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="font-inter text-[13px]">No hay anuncios registrados actualmente.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="flex flex-col gap-3 rounded-[12px] border border-border p-5 hover:bg-gray-50/50 transition-colors relative group">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1 flex-1 pr-4">
                        <h4 className="font-inter text-[14px] font-bold text-text-primary leading-snug">
                          {announcement.title}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className={`shrink-0 rounded-[4px] px-2 py-0.5 font-inter text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(announcement.priority.name)}`}>
                            {getPriorityLabel(announcement.priority.name)}
                          </span>
                          
                          {/* Badge de tipo de Anuncio */}
                          {announcement.announcementType === "task" && (
                            <span className="bg-[#e0f2fe] text-[#0369a1] rounded-[4px] px-2 py-0.5 font-inter text-[10px] font-bold uppercase">
                              Tarea #{announcement.taskId}
                            </span>
                          )}
                          {announcement.announcementType === "article" && (
                            <span className="bg-[#f3e8ff] text-[#6b21a8] rounded-[4px] px-2 py-0.5 font-inter text-[10px] font-bold uppercase">
                              Wiki #{announcement.articleId}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botón de eliminar (Visible solo para administradores) */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          disabled={deletingId === announcement.id}
                          className="text-text-secondary hover:text-danger p-1 rounded-md hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Eliminar Anuncio"
                        >
                          {deletingId === announcement.id ? (
                            <svg className="animate-spin h-4.5 w-4.5" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>

                    <p className="font-inter text-[13px] text-text-secondary leading-relaxed break-words">
                      {announcement.description || "Sin descripción adicional."}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-between font-inter text-[11px] text-text-secondary border-t border-border pt-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <circle cx="6" cy="6" r="5" stroke="currentColor" />
                          <path d="M6 3v3l2 2" stroke="currentColor" strokeLinecap="round" />
                        </svg>
                        <span>Publicado el: {formatDate(announcement.createdAt)}</span>
                      </div>
                      
                      {announcement.visibleUntil && (
                        <span className="text-warning font-semibold">
                          Visible hasta: {formatDate(announcement.visibleUntil)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

