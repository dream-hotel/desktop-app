export interface StatsData {
  tareasActivas: number;
  tareasActivasDiff: string;
  porcentajeCompletado: number;
  porcentajeCompletadoDiff: string;
  checkInsPendientes: number;
  checkInsPendientesDiff: string;
  alertasCriticas: number;
  alertasCriticasDiff: string;
}

export interface RecentTask {
  id: number;
  tarea: string;
  turno: "Mañana" | "Tarde" | "Noche";
}

export type NotificationPriority = "alta" | "media" | "baja";
export type NotificationStatus = "pendiente" | "leida";

export interface Notification {
  id: number;
  title: string;
  authorName: string;
  authorRole: string;
  date: string;
  description: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  actionLabel: string;
  actionType: "articulo" | "tarea";
}

export interface DashboardResponse {
  stats: StatsData;
  recentTasks: RecentTask[];
  notifications: Notification[];
}
