export interface LogType {
  id: number;
  name: string;
}

export interface BackendSystemLog {
  id: number;
  message: string;
  userId: number | null;
  createdAt: string;
  logType: LogType;
}

export interface FindLogsQuery {
  page?: number;
  limit?: number;
  logTypeId?: number;
  userId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export function logTypeLabel(name: string): string {
  switch (name.toLowerCase()) {
    case "auth":
      return "Sesiones";
    case "users":
      return "Usuarios";
    case "tasks":
      return "Tareas";
    case "wiki":
      return "Wiki";
    case "announcements":
      return "Anuncios";
    case "schedules":
      return "Horarios";
    case "system":
      return "Sistema";
    case "error":
      return "Errores";
    default:
      return name;
  }
}
