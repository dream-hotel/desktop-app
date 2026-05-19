import { useCallback, useEffect, useMemo, useState } from "react";
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <circle cx="7" cy="7" r="5" stroke="#9ca3af" strokeWidth="1.2" />
              <path d="M11 11l3 3" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[240px] rounded-[10px] bg-[#f3f4f6] py-2 pl-9 pr-3 font-inter text-[13px] text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none"
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-[9px] rounded-[10px] bg-primary px-3 py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-white"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 4.5v9M4.5 9h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Nuevo Rol
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-[#fee2e2] px-3 py-2 font-inter text-[12px] text-[#991b1b]">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[12px] border border-border bg-white">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[18%]" />
            <col className="w-[32%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-[#fafafa]">
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
                  <tr key={role.id} className="border-b border-border last:border-b-0 hover:bg-[#fcfbfd]">
                    <td className="px-5 py-3 align-top">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-light text-primary">
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M9 1l7 3v5c0 4-3 6.5-7 8-4-1.5-7-4-7-8V4l7-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-inter text-[13px] font-medium text-text-primary">
                              {roleDisplayName(role.name)}
                            </span>
                            {role.isSystem && (
                              <span className="shrink-0 rounded-full bg-[#fef3c7] px-2 py-[1.5px] font-inter text-[10px] font-medium text-[#92400e]">
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
                            ? "bg-[#ecfdf5] text-[#065f46]"
                            : summary.tone === "none"
                            ? "bg-[#fee2e2] text-[#991b1b]"
                            : "bg-primary-light text-primary"
                        }`}
                      >
                        <span
                          className={`h-[6px] w-[6px] shrink-0 rounded-full ${
                            summary.tone === "all"
                              ? "bg-[#16a34a]"
                              : summary.tone === "none"
                              ? "bg-[#dc2626]"
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
                            className="whitespace-nowrap rounded-full bg-[#f3f4f6] px-2 py-[2px] font-inter text-[11px] text-text-body"
                          >
                            {m}
                          </span>
                        ))}
                        {mods.length > 4 && (
                          <span
                            className="whitespace-nowrap rounded-full bg-[#f3f4f6] px-2 py-[2px] font-inter text-[11px] text-text-body"
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
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 12h10M9 2l3 3-7 7H2v-3l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setDeleting(role);
                            setDeleteError(null);
                          }}
                          title={role.isSystem ? "Roles del sistema no se pueden eliminar" : "Eliminar"}
                          disabled={role.isSystem}
                          className="rounded-md p-1.5 text-text-secondary hover:bg-[#fee2e2] hover:text-[#dc2626] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 3.5h10M5 3.5V2h4v1.5M3 3.5l1 8.5h6l1-8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
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
            className="flex w-[420px] flex-col gap-4 rounded-[14px] bg-white p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fee2e2]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 6v5M10 14h.01" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="10" cy="10" r="8" stroke="#dc2626" strokeWidth="1.5" />
                </svg>
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
              <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-[#fee2e2] px-3 py-2 font-inter text-[12px] text-[#991b1b]">
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
                className="rounded-[10px] bg-[#f3f4f6] px-4 py-2 font-inter text-[13px] font-medium text-text-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteBusy}
                className="rounded-[10px] bg-[#dc2626] px-4 py-2 font-inter text-[13px] font-medium text-white disabled:opacity-50"
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
