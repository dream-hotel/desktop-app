export interface Permission {
  id: string;
  module: string;
  action: string;
  label: string;
  description: string;
}

export interface PermissionModule {
  module: string;
  label: string;
  description: string;
  permissions: Permission[];
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  usersCount?: number;
}

export interface CreateRolePayload {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    module: "users",
    label: "Usuarios",
    description: "Gestión de cuentas y accesos",
    permissions: [
      { id: "users.read", module: "users", action: "read", label: "Ver usuarios", description: "Listar y consultar usuarios" },
      { id: "users.create", module: "users", action: "create", label: "Crear usuarios", description: "Dar de alta nuevas cuentas" },
      { id: "users.update", module: "users", action: "update", label: "Editar usuarios", description: "Modificar datos y estado" },
      { id: "users.delete", module: "users", action: "delete", label: "Eliminar usuarios", description: "Dar de baja cuentas" },
    ],
  },
  {
    module: "roles",
    label: "Roles y permisos",
    description: "Definición de roles del sistema",
    permissions: [
      { id: "roles.read", module: "roles", action: "read", label: "Ver roles", description: "Consultar roles y sus permisos" },
      { id: "roles.create", module: "roles", action: "create", label: "Crear roles", description: "Definir nuevos roles" },
      { id: "roles.update", module: "roles", action: "update", label: "Editar roles", description: "Modificar nombre y permisos" },
      { id: "roles.delete", module: "roles", action: "delete", label: "Eliminar roles", description: "Borrar roles no utilizados" },
    ],
  },
  {
    module: "tasks",
    label: "Tareas",
    description: "Asignación y seguimiento de tareas",
    permissions: [
      { id: "tasks.read", module: "tasks", action: "read", label: "Ver tareas", description: "Consultar todas las tareas" },
      { id: "tasks.create", module: "tasks", action: "create", label: "Crear tareas", description: "Generar nuevas tareas" },
      { id: "tasks.update", module: "tasks", action: "update", label: "Editar tareas", description: "Modificar tareas existentes" },
      { id: "tasks.delete", module: "tasks", action: "delete", label: "Eliminar tareas", description: "Borrar tareas" },
      { id: "tasks.assign", module: "tasks", action: "assign", label: "Asignar tareas", description: "Asignar tareas a personal" },
    ],
  },
  {
    module: "wiki",
    label: "Wiki",
    description: "Base de conocimiento interna",
    permissions: [
      { id: "wiki.read", module: "wiki", action: "read", label: "Ver wiki", description: "Leer artículos" },
      { id: "wiki.create", module: "wiki", action: "create", label: "Crear artículos", description: "Publicar nuevos artículos" },
      { id: "wiki.update", module: "wiki", action: "update", label: "Editar artículos", description: "Modificar contenido" },
      { id: "wiki.delete", module: "wiki", action: "delete", label: "Eliminar artículos", description: "Borrar artículos" },
    ],
  },
  {
    module: "announcements",
    label: "Anuncios",
    description: "Comunicados al equipo",
    permissions: [
      { id: "announcements.read", module: "announcements", action: "read", label: "Ver anuncios", description: "Leer comunicados" },
      { id: "announcements.create", module: "announcements", action: "create", label: "Crear anuncios", description: "Publicar anuncios" },
      { id: "announcements.update", module: "announcements", action: "update", label: "Editar anuncios", description: "Modificar anuncios" },
      { id: "announcements.delete", module: "announcements", action: "delete", label: "Eliminar anuncios", description: "Borrar anuncios" },
    ],
  },
  {
    module: "schedules",
    label: "Horarios",
    description: "Turnos y planificación",
    permissions: [
      { id: "schedules.read", module: "schedules", action: "read", label: "Ver horarios", description: "Consultar turnos" },
      { id: "schedules.create", module: "schedules", action: "create", label: "Crear horarios", description: "Definir turnos" },
      { id: "schedules.update", module: "schedules", action: "update", label: "Editar horarios", description: "Modificar turnos" },
      { id: "schedules.delete", module: "schedules", action: "delete", label: "Eliminar horarios", description: "Borrar turnos" },
    ],
  },
  {
    module: "activity",
    label: "Actividad",
    description: "Registro de auditoría",
    permissions: [
      { id: "activity.read", module: "activity", action: "read", label: "Ver actividad", description: "Consultar el log de auditoría" },
      { id: "activity.export", module: "activity", action: "export", label: "Exportar actividad", description: "Descargar registros" },
    ],
  },
  {
    module: "dashboard",
    label: "Dashboard",
    description: "Indicadores y resúmenes",
    permissions: [
      { id: "dashboard.read", module: "dashboard", action: "read", label: "Ver dashboard", description: "Acceder al panel principal" },
    ],
  },
];

export const ALL_PERMISSION_IDS: string[] = PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.id),
);

export function findPermission(id: string): Permission | undefined {
  for (const mod of PERMISSION_MODULES) {
    const p = mod.permissions.find((perm) => perm.id === id);
    if (p) return p;
  }
  return undefined;
}

export function roleDisplayName(name: string): string {
  switch (name.toUpperCase()) {
    case "ADMIN":
      return "Administrador";
    case "RECEPTIONIST":
      return "Recepcionista";
    default:
      return name;
  }
}
