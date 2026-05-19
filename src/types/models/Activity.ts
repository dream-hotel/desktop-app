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
      return "Autenticación";
    case "users":
      return "Usuarios";
    case "tasks":
      return "Tareas";
    case "wiki":
      return "Wiki";
    case "system":
      return "Sistema";
    case "error":
      return "Error";
    default:
      return name;
  }
}

export const LOG_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  auth: { bg: "#dbeafe", text: "#1e40af" },
  users: { bg: "#ede9fe", text: "#5b21b6" },
  tasks: { bg: "#dcfce7", text: "#166534" },
  wiki: { bg: "#fef3c7", text: "#92400e" },
  system: { bg: "#e5e7eb", text: "#374151" },
  error: { bg: "#fee2e2", text: "#991b1b" },
};
