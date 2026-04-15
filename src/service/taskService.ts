import { Task, TasksResponse } from "../types/response/TaskResponse";

const MOCK_TASKS: Task[] = [
  {
    id: 1,
    title: "Suite 301 — A/C compressor replacement",
    description:
      "Falla intermitente del aire acondicionado al enfriar. La unidad requiere un cambio completo del compresor.",
    priority: "critical",
    status: "in_progress",
    assignee: "Carlos M.",
    deadline: "10:00 AM",
    comments: 3,
    activityLog: [
      {
        id: 1,
        authorName: "Carlos M.",
        action: "Inició un diagnostico",
        time: "7:15 AM",
      },
      {
        id: 2,
        authorName: "Roberto S.",
        action: "Ordenó que se reemplace la pieza",
        time: "7:45 AM",
      },
      {
        id: 3,
        authorName: "Carlos M.",
        action: "Inició la instalación",
        time: "9:00 AM",
      },
    ],
  },
  {
    id: 2,
    title: "Pool area — Evening lighting reconfiguration",
    description:
      "Reconfigurar la iluminación nocturna del área de la piscina para mejorar la ambientación.",
    priority: "medium",
    status: "pending",
    assignee: "Ana R.",
    deadline: "4:00 PM",
    comments: 1,
    activityLog: [
      {
        id: 1,
        authorName: "Ana R.",
        action: "Creó la tarea",
        time: "8:00 AM",
      },
    ],
  },
  {
    id: 3,
    title: "VIP Suite 505 — Pre-arrival inspection",
    description:
      "Inspección previa a la llegada del huésped VIP. Verificar amenidades y estado general de la suite.",
    priority: "high",
    status: "pending",
    assignee: "María P.",
    deadline: "1:00 PM",
    comments: 2,
    activityLog: [
      {
        id: 1,
        authorName: "María P.",
        action: "Creó la tarea",
        time: "7:00 AM",
      },
      {
        id: 2,
        authorName: "María P.",
        action: "Asignó prioridad alta",
        time: "7:05 AM",
      },
    ],
  },
  {
    id: 4,
    title: "Restaurant — Wine inventory audit",
    description:
      "Auditoría del inventario de vinos del restaurante principal. Verificar stock y condiciones.",
    priority: "medium",
    status: "done",
    assignee: "Pedro L.",
    deadline: "12:00 PM",
    comments: 4,
    activityLog: [
      {
        id: 1,
        authorName: "Pedro L.",
        action: "Inició la auditoría",
        time: "8:30 AM",
      },
      {
        id: 2,
        authorName: "Pedro L.",
        action: "Completó el conteo",
        time: "10:00 AM",
      },
      {
        id: 3,
        authorName: "Pedro L.",
        action: "Reportó discrepancias",
        time: "10:30 AM",
      },
      {
        id: 4,
        authorName: "Pedro L.",
        action: "Finalizó la tarea",
        time: "11:45 AM",
      },
    ],
  },
  {
    id: 5,
    title: "Lobby — Fresh flower arrangement refresh",
    description:
      "Renovar los arreglos florales del lobby principal. Coordinar con el proveedor.",
    priority: "low",
    status: "done",
    assignee: "Sofía D.",
    deadline: "9:00 AM",
    comments: 0,
    activityLog: [
      {
        id: 1,
        authorName: "Sofía D.",
        action: "Completó el arreglo",
        time: "8:45 AM",
      },
    ],
  },
  {
    id: 6,
    title: "Spa — Equipment sterilization protocol",
    description:
      "Protocolo de esterilización de equipos del spa. Seguir las nuevas directrices sanitarias.",
    priority: "high",
    status: "in_progress",
    assignee: "Laura V.",
    deadline: "11:00 AM",
    comments: 1,
    activityLog: [
      {
        id: 1,
        authorName: "Laura V.",
        action: "Inició el protocolo",
        time: "9:30 AM",
      },
    ],
  },
  {
    id: 7,
    title: "Parking — Guest vehicle valet log update",
    description:
      "Actualizar el registro de valet parking con los vehículos de los huéspedes del día.",
    priority: "low",
    status: "blocked",
    assignee: "Diego R.",
    deadline: "8:00 AM",
    comments: 2,
    activityLog: [
      {
        id: 1,
        authorName: "Diego R.",
        action: "Reportó sistema caído",
        time: "7:30 AM",
      },
      {
        id: 2,
        authorName: "Diego R.",
        action: "Escaló a soporte técnico",
        time: "7:45 AM",
      },
    ],
  },
];

export async function getTasksData(): Promise<TasksResponse> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    tasks: MOCK_TASKS,
  };
}
