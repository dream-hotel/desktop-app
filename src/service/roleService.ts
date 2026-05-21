import {
  ALL_PERMISSION_IDS,
  CreateRolePayload,
  Role,
  UpdateRolePayload,
} from "../types/models/Roles";

const STORAGE_KEY = "stannum.roles.v2";

function seed(): Role[] {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      name: "Administrador",
      description: "Gestiona la operación diaria del hotel.",
      permissions: ALL_PERMISSION_IDS.filter(
        (p) => !p.startsWith("roles.") || p === "roles.read",
      ),
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      name: "Recepcionista",
      description: "Atención al huésped y tareas operativas.",
      permissions: [
        "dashboard.read",
        "tasks.read",
        "tasks.update",
        "wiki.read",
        "announcements.read",
        "schedules.read",
        "users.read",
      ],
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function load(): Role[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Role[];
    if (!Array.isArray(parsed)) throw new Error("Formato inválido");
    return parsed;
  } catch {
    const seeded = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function persist(roles: Role[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
}

function nextId(roles: Role[]): number {
  return roles.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 120));
}

export function listRoles(): Promise<Role[]> {
  return delay(load());
}

export function getRole(id: number): Promise<Role | null> {
  const roles = load();
  return delay(roles.find((r) => r.id === id) ?? null);
}

export function createRole(payload: CreateRolePayload): Promise<Role> {
  const roles = load();
  const name = payload.name.trim();
  if (!name) return Promise.reject(new Error("El nombre del rol es obligatorio"));
  if (roles.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
    return Promise.reject(new Error("Ya existe un rol con ese nombre"));
  }
  const now = new Date().toISOString();
  const role: Role = {
    id: nextId(roles),
    name,
    description: payload.description.trim(),
    permissions: Array.from(new Set(payload.permissions)),
    isSystem: false,
    createdAt: now,
    updatedAt: now,
  };
  const next = [...roles, role];
  persist(next);
  return delay(role);
}

export function updateRole(id: number, payload: UpdateRolePayload): Promise<Role> {
  const roles = load();
  const idx = roles.findIndex((r) => r.id === id);
  if (idx === -1) return Promise.reject(new Error("Rol no encontrado"));
  const current = roles[idx];
  if (current.isSystem && payload.name && payload.name.trim() !== current.name) {
    return Promise.reject(new Error("No se puede renombrar un rol del sistema"));
  }
  if (payload.name) {
    const newName = payload.name.trim();
    if (
      roles.some(
        (r) => r.id !== id && r.name.toLowerCase() === newName.toLowerCase(),
      )
    ) {
      return Promise.reject(new Error("Ya existe un rol con ese nombre"));
    }
  }
  const updated: Role = {
    ...current,
    name: payload.name?.trim() ?? current.name,
    description: payload.description?.trim() ?? current.description,
    permissions: payload.permissions
      ? Array.from(new Set(payload.permissions))
      : current.permissions,
    updatedAt: new Date().toISOString(),
  };
  const next = [...roles];
  next[idx] = updated;
  persist(next);
  return delay(updated);
}

export function deleteRole(id: number): Promise<void> {
  const roles = load();
  const target = roles.find((r) => r.id === id);
  if (!target) return Promise.reject(new Error("Rol no encontrado"));
  if (target.isSystem) {
    return Promise.reject(new Error("No se puede eliminar un rol del sistema"));
  }
  persist(roles.filter((r) => r.id !== id));
  return delay(undefined);
}
