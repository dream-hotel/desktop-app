import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackendUserListItem,
  CreateUserPayload,
  FindUsersQuery,
  ROLE_OPTIONS,
  UpdateUserPayload,
  roleLabel,
} from "../types/models/Users";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "../service/userService";
import UserFormModal from "../components/users/UserFormModal";
import ConfirmDeleteModal from "../components/users/ConfirmDeleteModal";
import RolesView from "../components/users/RolesView";

type ActiveFilter = "all" | "active" | "inactive";
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
  const [tab, setTab] = useState<Tab>("users");

  const [users, setUsers] = useState<BackendUserListItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: PAGE_SIZE, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<BackendUserListItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<BackendUserListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounced, activeFilter, roleFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: FindUsersQuery = { page, limit: PAGE_SIZE };
      if (searchDebounced) query.search = searchDebounced;
      if (roleFilter !== "all") query.roleId = roleFilter;
      if (activeFilter !== "all") query.isActive = activeFilter === "active";
      const result = await listUsers(query);
      setUsers(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, roleFilter, activeFilter]);

  useEffect(() => {
    if (tab === "users") fetchUsers();
  }, [tab, fetchUsers]);

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

  const totalLabel = useMemo(() => {
    if (meta.total === 0) return "Sin usuarios";
    if (meta.total === 1) return "1 usuario";
    return `${meta.total} usuarios`;
  }, [meta.total]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border px-8 pb-0 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-alexandria text-[31px] font-normal leading-[30px] text-text-primary">
              Usuarios y Roles
            </h1>
            <p className="mt-1 font-inter text-[13px] text-text-secondary">
              {tab === "users"
                ? `Administra cuentas, roles y acceso al sistema. ${totalLabel}.`
                : "Definí roles personalizados y asigná qué permisos puede ejercer cada uno."}
            </p>
          </div>
          {tab === "users" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-[9px] rounded-[10px] bg-primary px-3 py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-white"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 4.5v9M4.5 9h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Nuevo Usuario
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 border-b border-transparent">
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 border-b-2 px-3 pb-3 pt-1 font-inter text-[13px] font-medium transition-colors ${
              tab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M1 16c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="13" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M14 11c2 .4 3 1.8 3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Usuarios
          </button>
          <button
            onClick={() => setTab("roles")}
            className={`flex items-center gap-2 border-b-2 px-3 pb-3 pt-1 font-inter text-[13px] font-medium transition-colors ${
              tab === "roles"
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 1l7 3v5c0 4-3 6.5-7 8-4-1.5-7-4-7-8V4l7-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Roles y permisos
          </button>
        </div>

        {tab === "users" && (
          <div className="flex flex-wrap items-center gap-3 pb-5">
            <div className="relative min-w-[260px] flex-1">
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
                placeholder="Buscar por nombre, apellido o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[10px] bg-[#f3f4f6] py-2 pl-9 pr-4 font-inter text-[13px] text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none"
              />
            </div>

            <select
              value={roleFilter === "all" ? "all" : String(roleFilter)}
              onChange={(e) =>
                setRoleFilter(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className="rounded-[10px] bg-[#f3f4f6] px-3 py-2 font-inter text-[13px] text-text-primary outline-none"
            >
              <option value="all">Todos los roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 rounded-[10px] bg-[#f3f4f6] p-1">
              {(["all", "active", "inactive"] as ActiveFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`rounded-full px-3 py-1 font-inter text-xs font-medium leading-[18px] transition-colors ${
                    activeFilter === f
                      ? "bg-primary text-white"
                      : "bg-transparent text-text-secondary"
                  }`}
                >
                  {f === "all" ? "Todos" : f === "active" ? "Activos" : "Inactivos"}
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
              <div className="mb-4 rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-[#fee2e2] px-3 py-2 font-inter text-[12px] text-[#991b1b]">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-[12px] border border-border bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-[#fafafa]">
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
                      <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-[#fcfbfd]">
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
                          <span
                            className={`inline-flex items-center gap-[5px] rounded-full px-2 py-[2.5px] font-inter text-[11px] leading-[16.5px] ${
                              u.isActive
                                ? "bg-[#ecfdf5] text-[#065f46]"
                                : "bg-[#fee2e2] text-[#991b1b]"
                            }`}
                          >
                            <span
                              className={`h-[6px] w-[6px] rounded-full ${
                                u.isActive ? "bg-[#16a34a]" : "bg-[#dc2626]"
                              }`}
                            />
                            {u.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-inter text-[12px] text-text-secondary">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setEditingUser(u)}
                              title="Editar"
                              className="rounded-md p-1.5 text-text-secondary hover:bg-primary-light hover:text-primary"
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2 12h10M9 2l3 3-7 7H2v-3l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setDeletingUser(u);
                                setDeleteError(null);
                              }}
                              title="Eliminar"
                              className="rounded-md p-1.5 text-text-secondary hover:bg-[#fee2e2] hover:text-[#dc2626]"
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2 3.5h10M5 3.5V2h4v1.5M3 3.5l1 8.5h6l1-8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
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
                    className="rounded-md border border-border bg-white px-3 py-1.5 font-inter text-[12px] font-medium text-text-body disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                    disabled={page >= meta.pages || loading}
                    className="rounded-md border border-border bg-white px-3 py-1.5 font-inter text-[12px] font-medium text-text-body disabled:opacity-40"
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
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingUser && (
        <UserFormModal
          mode="edit"
          user={editingUser}
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
