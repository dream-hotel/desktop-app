import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2, Users as UsersIcon } from "lucide-react";
import {
  BackendUserListItem,
  CreateUserPayload,
  FindUsersQuery,
  UpdateUserPayload,
  roleLabel,
} from "../types/models/Users";
import { BackendRole } from "../types/models/Roles";
import {
  createUser,
  deleteUser,
  listUsers,
  restoreUser,
  updateUser,
} from "../service/userService";
import { listRoles } from "../service/roleService";
import UserFormModal from "../components/users/UserFormModal";
import ConfirmDeleteModal from "../components/users/ConfirmDeleteModal";
import RolesView from "../components/users/RolesView";
import Dropdown from "../components/ui/Dropdown";
import { usePermissions } from "../hooks/usePermissions";
import { usePolling } from "../hooks/usePolling";

type ActiveFilter = "active" | "inactive";
type RoleFilter = "all" | number;
type Tab = "users" | "roles";

const PAGE_SIZE = 10;

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

function initials(user: BackendUserListItem): string {
  const a = user.fullName?.[0] ?? "";
  const b = user.lastName?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export default function UsersPage() {
  const { has, hasAny } = usePermissions();
  const canReadUsers = has("users:read");
  const canCreateUsers = has("users:create");
  const canUpdateUsers = has("users:update");
  const canDeleteUsers = has("users:delete");
  const canViewRoles = hasAny(["roles:read"]);

  const initialTab: Tab = canReadUsers ? "users" : canViewRoles ? "roles" : "users";
  const [tab, setTab] = useState<Tab>(initialTab);

  const [users, setUsers] = useState<BackendUserListItem[]>([]);
  const [roles, setRoles] = useState<BackendRole[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_SIZE, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<BackendUserListItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<BackendUserListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [restoringUserId, setRestoringUserId] = useState<number | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounced, activeFilter, roleFilter]);

  const fetchUsers = useCallback(async (silent = false) => {
    if (!canReadUsers) {
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const query: FindUsersQuery = { page, limit: PAGE_SIZE };
      if (searchDebounced) query.search = searchDebounced;
      if (roleFilter !== "all") query.roleId = roleFilter;
      if (activeFilter === "inactive") {
        query.onlyDeleted = true;
      }
      const result = await listUsers(query);
      setUsers(result.data);
      setMeta(result.meta);
      if (silent) setError(null);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios");
        setUsers([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, searchDebounced, roleFilter, activeFilter, canReadUsers]);

  const fetchRoles = useCallback(async () => {
    if (!canViewRoles) return;
    try {
      const data = await listRoles();
      setRoles(data);
    } catch {
      /* keep last good roles on failure */
    }
  }, [canViewRoles]);

  useEffect(() => {
    if (tab === "users") fetchUsers();
  }, [tab, fetchUsers]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  usePolling(() => {
    fetchRoles();
    if (tab === "users") fetchUsers(true);
  });

  async function handleCreate(payload: CreateUserPayload | UpdateUserPayload) {
    await createUser(payload as CreateUserPayload);
    setShowCreateModal(false);
    await fetchUsers();
  }

  async function handleEdit(payload: CreateUserPayload | UpdateUserPayload) {
    if (!editingUser) return;
    await updateUser(editingUser.id, payload as UpdateUserPayload);
    setEditingUser(null);
    await fetchUsers();
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteUser(deletingUser.id);
      setDeletingUser(null);
      await fetchUsers();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  async function handleRestore(u: BackendUserListItem) {
    if (restoringUserId !== null) return;
    setRestoringUserId(u.id);
    try {
      await restoreUser(u.id);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restaurar el usuario");
    } finally {
      setRestoringUserId(null);
    }
  }


  if (!canReadUsers && !canViewRoles) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-10">
        <ShieldCheck size={36} className="text-text-secondary" />
        <h2 className="mt-3 font-alexandria text-[22px] font-normal text-text-primary">Sin acceso</h2>
        <p className="mt-1 font-inter text-[13px] text-text-secondary">
          No tenés permisos para ver usuarios ni roles.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg">
      <div className="flex flex-col gap-4 border-b border-border px-8 pb-0 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 border-b border-transparent">
            {canReadUsers && (
              <button
                onClick={() => setTab("users")}
                className={`flex items-center gap-2 border-b-2 px-3 pb-3 pt-1 font-inter text-[13px] font-medium transition-colors ${
                  tab === "users"
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <UsersIcon size={15} strokeWidth={1.8} />
                Usuarios
              </button>
            )}
            {canViewRoles && (
              <button
                onClick={() => setTab("roles")}
                className={`flex items-center gap-2 border-b-2 px-3 pb-3 pt-1 font-inter text-[13px] font-medium transition-colors ${
                  tab === "roles"
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <ShieldCheck size={15} strokeWidth={1.8} />
                Roles y permisos
              </button>
            )}
          </div>

          {tab === "users" && canCreateUsers && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mb-2 flex items-center gap-[9px] rounded-[10px] bg-primary px-3 py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-on-accent"
            >
              <Plus size={16} strokeWidth={2} />
              Nuevo Usuario
            </button>
          )}
        </div>

        {tab === "users" && (
          <div className="flex flex-wrap items-center gap-3 pb-5">
            <div className="relative min-w-[260px] flex-1">
              <Search
                size={15}
                strokeWidth={1.6}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[10px] bg-neutral-soft py-2 pl-9 pr-4 font-inter text-[13px] text-text-primary placeholder:text-text-secondary outline-none"
              />
            </div>

            <Dropdown<RoleFilter>
              className="w-[190px]"
              ariaLabel="Filtrar por rol"
              value={roleFilter}
              onChange={setRoleFilter}
              triggerClassName="flex w-full items-center justify-between gap-2 cursor-pointer rounded-[10px] bg-neutral-soft px-3 py-2 font-inter text-[13px] text-text-primary outline-none transition-colors hover:bg-surface-hover"
              options={[
                { value: "all", label: "Todos los roles" },
                ...roles.map((r) => ({ value: r.id, label: roleLabel(r.name) })),
              ]}
            />

            <div className="flex items-center gap-1 rounded-[10px] bg-neutral-soft p-1">
              {(["active", "inactive"] as ActiveFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`rounded-full px-3 py-1 font-inter text-xs font-medium leading-[18px] transition-colors ${
                    activeFilter === f
                      ? "bg-primary text-on-accent"
                      : "bg-transparent text-text-secondary"
                  }`}
                >
                  {f === "active" ? "Activos" : "Inactivos"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-5">
        {tab === "roles" ? (
          <RolesView />
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                      Usuario
                    </th>
                    <th className="px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                      Rol
                    </th>
                    <th className="px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                      Estado
                    </th>
                    <th className="px-5 py-3 text-left font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                      Creado
                    </th>
                    <th className="px-5 py-3 text-right font-inter text-[12px] font-medium uppercase tracking-wide text-text-secondary">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center font-inter text-[13px] text-text-secondary">
                        Cargando usuarios...
                      </td>
                    </tr>
                  )}
                  {!loading && users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center font-inter text-[13px] text-text-secondary">
                        No se encontraron usuarios con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    users.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-surface-2">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light font-inter text-[12px] font-medium text-primary">
                              {initials(u)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-inter text-[13px] font-medium text-text-primary">
                                {u.fullName} {u.lastName}
                              </span>
                              <span className="font-inter text-[11px] text-text-secondary">ID #{u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-inter text-[13px] text-text-body">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center rounded-full bg-primary-light px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] text-primary">
                            {roleLabel(u.role.name)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {u.deletedAt ? (
                            <span className="inline-flex items-center gap-[5px] rounded-full bg-danger/10 px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] text-danger">
                              <span className="h-[6px] w-[6px] rounded-full bg-danger" />
                              Eliminado
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-[5px] rounded-full px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${
                                u.isActive
                                  ? "bg-success/10 text-success"
                                  : "bg-danger/10 text-danger"
                              }`}
                            >
                              <span
                                className={`h-[6px] w-[6px] rounded-full ${
                                  u.isActive ? "bg-success" : "bg-danger"
                                }`}
                              />
                              {u.isActive ? "Activo" : "Inactivo"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-inter text-[12px] text-text-secondary">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            {!u.deletedAt && canUpdateUsers && (
                              <button
                                onClick={() => setEditingUser(u)}
                                title="Editar"
                                className="rounded-md p-1.5 text-text-secondary hover:bg-primary-light hover:text-primary"
                              >
                                <Pencil size={14} strokeWidth={1.8} />
                              </button>
                            )}
                            {!u.deletedAt && canDeleteUsers && (
                              <button
                                onClick={() => {
                                  setDeletingUser(u);
                                  setDeleteError(null);
                                }}
                                title="Eliminar"
                                className="rounded-md p-1.5 text-text-secondary hover:bg-danger/10 hover:text-danger"
                              >
                                <Trash2 size={14} strokeWidth={1.8} />
                              </button>
                            )}
                            {u.deletedAt && canUpdateUsers && (
                              <button
                                onClick={() => handleRestore(u)}
                                disabled={restoringUserId === u.id}
                                title="Restaurar"
                                className="rounded-md p-1.5 text-text-secondary hover:bg-primary-light hover:text-primary disabled:opacity-50"
                              >
                                <RotateCcw
                                  size={14}
                                  strokeWidth={1.8}
                                  className={restoringUserId === u.id ? "animate-spin" : ""}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {meta.pages > 1 && (
              <div className="mt-4 flex items-center justify-between font-inter text-[12px] text-text-secondary">
                <span>
                  Página {meta.page} de {meta.pages} — {meta.total} resultados
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 font-inter text-[12px] font-medium text-text-body disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                    disabled={page >= meta.pages || loading}
                    className="rounded-md border border-border bg-surface px-3 py-1.5 font-inter text-[12px] font-medium text-text-body disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <UserFormModal
          mode="create"
          roles={roles}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingUser && (
        <UserFormModal
          mode="edit"
          user={editingUser}
          roles={roles}
          onClose={() => setEditingUser(null)}
          onSubmit={handleEdit}
        />
      )}
      {deletingUser && (
        <ConfirmDeleteModal
          userName={`${deletingUser.fullName} ${deletingUser.lastName}`}
          loading={deleting}
          error={deleteError}
          onCancel={() => {
            setDeletingUser(null);
            setDeleteError(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
