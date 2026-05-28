export interface BackendPermission {
  id: number;
  name: string;
  module: string;
}

export interface BackendRole {
  id: number;
  name: string;
  permissions: BackendPermission[];
}

export interface CreateRolePayload {
  name: string;
  permissionIds: number[];
}

export interface UpdateRolePayload {
  name?: string;
  permissionIds?: number[];
}

export interface PermissionDescriptor {
  name: string;
  label: string;
  description: string;
  action: string;
}

export interface PermissionModuleDescriptor {
  module: string;
  label: string;
  description: string;
}

const MODULE_DESCRIPTORS: PermissionModuleDescriptor[] = [
  { module: "Usuarios", label: "Usuarios", description: "Gestión de cuentas y accesos" },
  { module: "Roles y Permisos", label: "Roles y permisos", description: "Definición de roles del sistema" },
  { module: "Tareas", label: "Tareas", description: "Asignación y seguimiento de tareas" },
  { module: "Wiki", label: "Wiki", description: "Base de conocimiento interna" },
  { module: "Anuncios", label: "Anuncios", description: "Comunicados al equipo" },
  { module: "Horarios", label: "Horarios", description: "Turnos y planificación" },
  { module: "Auditoría", label: "Actividad", description: "Registro de auditoría del sistema" },
  { module: "Dashboard", label: "Dashboard", description: "Indicadores y resúmenes" },
  { module: "Sistema", label: "Sistema", description: "Permisos transversales — saltean filtros de audiencia, asignación y rol" },
];

const ACTION_LABELS: Record<string, { label: string; description: string }> = {
  read: { label: "Ver", description: "Consultar registros" },
  create: { label: "Crear", description: "Dar de alta registros" },
  update: { label: "Editar", description: "Modificar registros" },
  delete: { label: "Eliminar", description: "Borrar registros" },
  write: { label: "Editar", description: "Crear o modificar registros" },
};

const MODULE_NAMES: Record<string, string> = {
  users: "usuarios",
  roles: "roles",
  tasks: "tareas",
  wiki: "artículos",
  announcements: "anuncios",
  schedules: "horarios",
  audit: "actividad",
  dashboard: "dashboard",
  global: "sistema",
};

/**
 * Permisos con etiquetas/explicaciones específicas que no encajan con el patrón
 * verbo+sustantivo derivado de `module:action`. Cuando el permiso aparece acá,
 * `describePermission` usa esto en lugar de armar la descripción automáticamente.
 */
const SPECIAL_PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
  "global:admin": {
    label: "Administrador global",
    description:
      "Acceso total: ve todos los anuncios, tareas y artículos sin importar la audiencia, asignación o rol.",
  },
};

export const GLOBAL_ADMIN_PERMISSION = "global:admin";

export function describePermission(name: string): PermissionDescriptor {
  const special = SPECIAL_PERMISSION_LABELS[name];
  const [module, action] = name.split(":");
  if (special) {
    return {
      name,
      action: action ?? name,
      label: special.label,
      description: special.description,
    };
  }
  const actionInfo = ACTION_LABELS[action] ?? { label: action, description: action };
  const moduleNoun = MODULE_NAMES[module] ?? module;
  return {
    name,
    action: action ?? name,
    label: `${actionInfo.label} ${moduleNoun}`,
    description: `${actionInfo.description} de ${moduleNoun}.`,
  };
}

export function describeModule(module: string): PermissionModuleDescriptor {
  return (
    MODULE_DESCRIPTORS.find((m) => m.module.toLowerCase() === module.toLowerCase()) ?? {
      module,
      label: module,
      description: "",
    }
  );
}

export const SYSTEM_ROLE_IDS = [1, 2];

export function isSystemRole(role: { id: number }): boolean {
  return SYSTEM_ROLE_IDS.includes(role.id);
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
