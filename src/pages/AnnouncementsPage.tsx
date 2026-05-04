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

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await announcementService.getRecentAnnouncements();
      setRecentAnnouncements(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnnouncement = async (request: CreateAnnouncementRequest) => {
    await announcementService.createAnnouncement(request, user?.fullName || "Usuario");
    await loadAnnouncements(); // Reload the list
  };

  const pendingNotifications = dashboardData?.notifications.filter(n => n.status === "pendiente") || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgente": return "text-danger bg-danger/10";
      case "importante": return "text-warning bg-warning/20";
      default: return "text-text-secondary bg-gray-100";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgente": return "Urgente";
      case "importante": return "Importante";
      default: return "Normal";
    }
  };

  const formatDate = (isoString: string) => {
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
        customTitle="Creación de Anuncios"
      />

      <div className="flex flex-1 overflow-hidden p-8 gap-8">
        <div className="flex flex-col w-[60%] overflow-y-auto pr-2">
          <CreateAnnouncementForm onSubmit={handleCreateAnnouncement} />
        </div>

        <div className="flex flex-col flex-1 rounded-[16px] bg-white shadow-sm overflow-hidden border border-border">
          <div className="border-b border-border p-6 bg-gray-50/50">
            <h3 className="font-inter text-[16px] font-bold text-text-primary flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-primary">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Historial de Anuncios
            </h3>
            <p className="mt-1 font-inter text-[12px] text-text-secondary">
              Últimos anuncios publicados en el sistema.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full text-text-secondary text-[13px]">
                Cargando...
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-text-secondary">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-20">
                  <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="font-inter text-[13px]">No hay anuncios recientes.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="flex flex-col gap-2 rounded-[12px] border border-border p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <h4 className="font-inter text-[14px] font-semibold text-text-primary line-clamp-1 flex-1 pr-2">
                        {announcement.title}
                      </h4>
                      <span className={`shrink-0 rounded px-2 py-0.5 font-inter text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(announcement.priority)}`}>
                        {getPriorityLabel(announcement.priority)}
                      </span>
                    </div>

                    <p className="font-inter text-[12px] text-text-secondary line-clamp-2 leading-relaxed">
                      {announcement.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between font-inter text-[11px] text-text-secondary border-t border-border pt-2">
                      <div className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <circle cx="6" cy="6" r="5" stroke="currentColor" />
                          <path d="M6 3v3l2 2" stroke="currentColor" strokeLinecap="round" />
                        </svg>
                        <span>{formatDate(announcement.createdAt)}</span>
                      </div>
                      <span className="font-medium">Para: {announcement.audience}</span>
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
