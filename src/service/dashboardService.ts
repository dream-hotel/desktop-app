import {
  DashboardResponse,
  Notification,
  RecentTask,
  StatsData,
} from "../types/response/DashboardResponse";

const MOCK_STATS: StatsData = {
  tareasActivas: 14,
  tareasActivasDiff: "+3 que ayer",
  porcentajeCompletado: 84,
  porcentajeCompletadoDiff: "+10 en comparación",
  checkInsPendientes: 6,
  checkInsPendientesDiff: "2 inminentes",
  alertasCriticas: 3,
  alertasCriticasDiff: "1 nuevo",
};

const MOCK_TASKS: RecentTask[] = [
  { id: 1, tarea: "Verificar reservas del día", turno: "Mañana" },
  { id: 2, tarea: "Preparar informe de ocupación", turno: "Tarde" },
  { id: 3, tarea: "Actualizar tarifas temporada alta", turno: "Mañana" },
  { id: 4, tarea: "Revisar inventario amenidades", turno: "Noche" },
  { id: 5, tarea: "Capacitación nuevo protocolo check-in", turno: "Mañana" },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: "Cambio en artículo: Precios de habitaciones",
    authorName: "Alan M.",
    authorRole: "Recepcionista",
    date: "Hace 2 horas",
    description:
      "Se han actualizado los precios de las habitaciones dobles. Favor de revisar el detalle.",
    priority: "alta",
    status: "pendiente",
    actionLabel: "ver artículo",
    actionType: "articulo",
  },
  {
    id: 2,
    title: "Tarea prioritaria: Registrar pago pendiente",
    authorName: "María P.",
    authorRole: "F&B Manager",
    date: "Ayer",
    description:
      "La sra. Valenzuela de la habitación 503 dejó un adelanto de 100 dolares para su estadía. Porfavor registrar ese monto en caja.",
    priority: "alta",
    status: "pendiente",
    actionLabel: "ver tarea",
    actionType: "tarea",
  },
  {
    id: 3,
    title: "Cambio en artículo: horarios de check-in y check-out",
    authorName: "Elizabeth M.",
    authorRole: "General Manager",
    date: "8 abril",
    description:
      "Se han actualizado los horarios de check-in y check-out. Por favor, consultar los nuevos horarios.",
    priority: "media",
    status: "pendiente",
    actionLabel: "ver artículo",
    actionType: "articulo",
  },
];

export async function getDashboardData(): Promise<DashboardResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    stats: MOCK_STATS,
    recentTasks: MOCK_TASKS,
    notifications: MOCK_NOTIFICATIONS,
  };
}
