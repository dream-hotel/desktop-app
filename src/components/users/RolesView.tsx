import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import {
  createRole,
  deleteRole,
  listRoles,
  updateRole,
} from "../../service/roleService";
import {
  CreateRolePayload,
  PERMISSION_MODULES,
  Role,
  UpdateRolePayload,
  roleDisplayName,
} from "../../types/models/Roles";
import RoleFormModal from "./RoleFormModal";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function permissionSummary(role: Role): { label: string; tone: "all" | "partial" | "none" } {
  const total = PERMISSION_MODULES.reduce((acc, m) => acc + m.permissions.length, 0);
  if (role.permissions.length === 0) return { label: "Sin permisos", tone: "none" };
  if (role.permissions.length === total) return { label: "Acceso total", tone: "all" };
  return { label: `${role.permissions.length} permisos`, tone: "partial" };
}

function modulesCovered(role: Role): string[] {
  const set = new Set<string>();
  role.permissions.forEach((id) => {
    const mod = PERMISSION_MODULES.find((m) => m.permissions.some((p) => p.id === id));
    if (mod) set.add(mod.label);
  });
  return Array.from(set);
}

export default function RolesView() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listRoles();
      setRoles(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        roleDisplayName(r.name).toLowerCase().includes(q),
    );
  }, [roles, search]);

  async function handleCreate(payload: CreateRolePayload | UpdateRolePayload) {
    await createRole(payload as CreateRolePayload);
    setShowCreate(false);
    await fetchRoles();
  }

  async function handleEdit(payload: CreateRolePayload | UpdateRolePayload) {
    if (!editing) return;
    await updateRole(editing.id, payload);
    setEditing(null);
    await fetchRoles();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteRole(deleting.id);
      setDeleting(null);
      await fetchRoles();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleteBusy(false);
    }
  }

  const totalLabel = useMemo(() => {
    if (roles.length === 0) return "Sin roles";
    if (roles.length === 1) return "1 rol";
    return `${roles.length} roles`;
  }, [roles.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="font-inter text-[13px] text-text-secondary">
            Definí qué puede hacer cada tipo de cuenta. {totalLabel}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={15}
              strokeWidth={1.6}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder="Buscar rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[240px] rounded-[10px] bg-neutral-soft py-2 pl-9 pr-3 font-inter text-[13px] text-text-primary placeholder:text-text-secondary outline-none"
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-[9px] rounded-[10px] bg-primary px-3 py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-white"
          >
            <Plus size={16} strokeWidth={2} />
            Nuevo Rol
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[18%]" />
            <col className="w-[32%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                Rol
              </th>
              <th className="px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                Permisos
              </th>
              <th className="px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                Módulos
              </th>
              <th className="px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                Actualizado
              </th>
              <th className="px-5 py-3 text-right font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center font-inter text-[13px] text-text-secondary">
                  Cargando roles...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center font-inter text-[13px] text-text-secondary">
                  {search ? `No se encontraron roles con "${search}".` : "Aún no creaste ningún rol."}
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((role) => {
                const summary = permissionSummary(role);
                const mods = modulesCovered(role);
                return (
                  <tr key={role.id} className="border-b border-border last:border-b-0 hover:bg-surface-2">
                    <td className="px-5 py-3 align-top">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-light text-primary">
                          <ShieldCheck size={18} strokeWidth={1.8} />
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-inter text-[13px] font-medium text-text-primary">
                              {roleDisplayName(role.name)}
                            </span>
                            {role.isSystem && (
                              <span className="shrink-0 rounded-full bg-warning/15 px-2 py-[1.5px] font-inter text-[10px] font-medium text-warning">
                                Sistema
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <span className="truncate font-inter text-[11px] text-text-secondary" title={role.description}>
                              {role.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 align-top">
                      <span
                        className={`inline-flex max-w-full items-center gap-[5px] whitespace-nowrap rounded-full px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${
                          summary.tone === "all"
                            ? "bg-success/10 text-success"
                            : summary.tone === "none"
                            ? "bg-danger/10 text-danger"
                            : "bg-primary-light text-primary"
                        }`}
                      >
                        <span
                          className={`h-[6px] w-[6px] shrink-0 rounded-full ${
                            summary.tone === "all"
                              ? "bg-success"
                              : summary.tone === "none"
                              ? "bg-danger"
                              : "bg-primary"
                          }`}
                        />
                        {summary.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 align-top">
                      <div className="flex flex-wrap gap-1">
                        {mods.length === 0 && (
                          <span className="font-inter text-[11px] text-text-secondary">—</span>
                        )}
                        {mods.slice(0, 4).map((m) => (
                          <span
                            key={m}
                            className="whitespace-nowrap rounded-full bg-neutral-soft px-2 py-[2px] font-inter text-[11px] text-text-body"
                          >
                            {m}
                          </span>
                        ))}
                        {mods.length > 4 && (
                          <span
                            className="whitespace-nowrap rounded-full bg-neutral-soft px-2 py-[2px] font-inter text-[11px] text-text-body"
                            title={mods.slice(4).join(", ")}
                          >
                            +{mods.length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-top font-inter text-[12px] text-text-secondary">
                      <span className="whitespace-nowrap">{formatDate(role.updatedAt)}</span>
                    </td>
                    <td className="px-5 py-3 align-top">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(role)}
                          title="Editar"
                          className="rounded-md p-1.5 text-text-secondary hover:bg-primary-light hover:text-primary"
                        >
                          <Pencil size={14} strokeWidth={1.8} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleting(role);
                            setDeleteError(null);
                          }}
                          title={role.isSystem ? "Roles del sistema no se pueden eliminar" : "Eliminar"}
                          disabled={role.isSystem}
                          className="rounded-md p-1.5 text-text-secondary hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
                        >
                          <Trash2 size={14} strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <RoleFormModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
      {editing && (
        <RoleFormModal
          mode="edit"
          role={editing}
          onClose={() => setEditing(null)}
          onSubmit={handleEdit}
        />
      )}
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setDeleting(null);
            setDeleteError(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-[420px] flex-col gap-4 rounded-[14px] bg-surface p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10">
                <AlertTriangle size={20} strokeWidth={1.8} className="text-danger" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-alexandria text-[18px] font-normal leading-[22px] text-text-primary">
                  Eliminar rol
                </h3>
                <p className="font-inter text-[13px] text-text-body">
                  ¿Querés eliminar el rol <strong>{roleDisplayName(deleting.name)}</strong>?
                  Los usuarios que lo tengan asignado quedarán sin permisos hasta que les asignes otro rol.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleting(null);
                  setDeleteError(null);
                }}
                disabled={deleteBusy}
                className="rounded-[10px] bg-neutral-soft px-4 py-2 font-inter text-[13px] font-medium text-text-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteBusy}
                className="rounded-[10px] bg-danger px-4 py-2 font-inter text-[13px] font-medium text-white disabled:opacity-50"
              >
                {deleteBusy ? "Eliminando..." : "Eliminar rol"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
