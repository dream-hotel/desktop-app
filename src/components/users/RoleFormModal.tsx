import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  BackendPermission,
  BackendRole,
  CreateRolePayload,
  UpdateRolePayload,
  describeModule,
  describePermission,
  isSystemRole,
} from "../../types/models/Roles";

interface RoleFormModalProps {
  mode: "create" | "edit";
  role?: BackendRole | null;
  allPermissions: BackendPermission[];
  onClose: () => void;
  onSubmit: (payload: CreateRolePayload | UpdateRolePayload) => Promise<void>;
}

interface GroupedModule {
  module: string;
  label: string;
  description: string;
  permissions: BackendPermission[];
}

function groupPermissions(perms: BackendPermission[]): GroupedModule[] {
  const byModule = new Map<string, BackendPermission[]>();
  for (const p of perms) {
    const list = byModule.get(p.module) ?? [];
    list.push(p);
    byModule.set(p.module, list);
  }
  return Array.from(byModule.entries()).map(([module, permissions]) => {
    const meta = describeModule(module);
    return {
      module,
      label: meta.label,
      description: meta.description,
      permissions: permissions.sort((a, b) => a.name.localeCompare(b.name)),
    };
  });
}

export default function RoleFormModal({ mode, role, allPermissions, onClose, onSubmit }: RoleFormModalProps) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const system = mode === "edit" && role ? isSystemRole(role) : false;

  useEffect(() => {
    if (mode === "edit" && role) {
      setName(role.name);
      setSelected(new Set(role.permissions.map((p) => p.id)));
    }
  }, [mode, role]);

  const totalCount = allPermissions.length;
  const selectedCount = selected.size;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  const groupedModules = useMemo(() => groupPermissions(allPermissions), [allPermissions]);

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupedModules;
    return groupedModules
      .map((m) => {
        const matchesModule = m.label.toLowerCase().includes(q);
        const perms = matchesModule
          ? m.permissions
          : m.permissions.filter((p) => {
              const desc = describePermission(p.name);
              return (
                desc.label.toLowerCase().includes(q) ||
                desc.description.toLowerCase().includes(q) ||
                p.name.toLowerCase().includes(q)
              );
            });
        return { ...m, permissions: perms };
      })
      .filter((m) => m.permissions.length > 0);
  }, [groupedModules, search]);

  function toggleModuleCollapsed(module: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  }

  function togglePermission(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModule(module: string, allOn: boolean) {
    const ids = groupedModules.find((m) => m.module === module)?.permissions.map((p) => p.id) ?? [];
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allPermissions.map((p) => p.id)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("El nombre del rol es obligatorio");
      return;
    }
    if (selected.size === 0) {
      setError("Seleccioná al menos un permiso para el rol");
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        const payload: CreateRolePayload = {
          name: name.trim(),
          permissionIds: Array.from(selected),
        };
        await onSubmit(payload);
      } else {
        const payload: UpdateRolePayload = {
          permissionIds: Array.from(selected),
          ...(system ? {} : { name: name.trim() }),
        };
        await onSubmit(payload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-[680px] max-w-[calc(100vw-32px)] flex-col gap-4 rounded-[14px] bg-surface p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="flex shrink-0 items-start justify-between">
          <div>
            <h2 className="font-alexandria text-[22px] font-normal leading-[26px] text-text-primary">
              {mode === "create" ? "Nuevo rol" : system ? "Editar rol del sistema" : "Editar rol"}
            </h2>
            <p className="mt-1 font-inter text-[12px] text-text-secondary">
              {mode === "create"
                ? "Definí el nombre y elegí qué módulos podrá manejar este rol."
                : system
                ? "Es un rol del sistema: podés ajustar sus permisos pero no renombrarlo ni eliminarlo."
                : "Actualizá el nombre y los permisos asignados."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-secondary hover:bg-neutral-soft"
            aria-label="Cerrar"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <label className="font-inter text-[12px] font-medium text-text-body">Nombre del rol</label>
          <input
            required
            maxLength={50}
            disabled={system}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Supervisor de turno"
            className="w-full min-w-0 rounded-[8px] border border-border bg-surface px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary disabled:bg-surface-2 disabled:text-text-secondary"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <span className="font-inter text-[13px] font-medium text-text-primary">Permisos</span>
              <span className="font-inter text-[11px] text-text-secondary">
                {selectedCount} de {totalCount} seleccionados
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  size={13}
                  strokeWidth={1.6}
                  className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary"
                />
                <input
                  type="text"
                  placeholder="Buscar permiso..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-[200px] min-w-0 rounded-[8px] bg-neutral-soft py-1.5 pl-7 pr-3 font-inter text-[12px] text-text-primary placeholder:text-text-secondary outline-none"
                />
              </div>
              <button
                type="button"
                onClick={toggleAll}
                disabled={totalCount === 0}
                className="shrink-0 whitespace-nowrap rounded-[8px] border border-border bg-surface px-3 py-1.5 font-inter text-[12px] font-medium text-text-body hover:border-primary hover:text-primary disabled:opacity-50"
              >
                {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
              </button>
            </div>
          </div>

          <div
            className="flex flex-col gap-2 overflow-y-auto rounded-[10px] border border-border bg-surface-2 p-2"
            style={{ height: "min(420px, 55vh)" }}
          >
            {totalCount === 0 && (
              <div className="shrink-0 px-3 py-6 text-center font-inter text-[12px] text-text-secondary">
                No hay permisos disponibles en el sistema.
              </div>
            )}
            {totalCount > 0 && filteredModules.length === 0 && (
              <div className="shrink-0 px-3 py-6 text-center font-inter text-[12px] text-text-secondary">
                Sin resultados para "{search}".
              </div>
            )}
            {filteredModules.map((mod) => {
              const total = mod.permissions.length;
              const moduleSelected = mod.permissions.filter((p) => selected.has(p.id)).length;
              const allOn = moduleSelected === total && total > 0;
              const someOn = moduleSelected > 0 && moduleSelected < total;
              const isCollapsed = collapsed.has(mod.module) && !search.trim();

              return (
                <div
                  key={mod.module}
                  className="shrink-0 overflow-hidden rounded-[8px] border border-border bg-surface"
                >
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleModuleCollapsed(mod.module)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <ChevronDown
                        size={12}
                        strokeWidth={1.8}
                        className="shrink-0 transition-transform"
                        style={{ transform: isCollapsed ? "rotate(-90deg)" : "none" }}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-inter text-[13px] font-medium text-text-primary">{mod.label}</span>
                        <span className="truncate font-inter text-[11px] text-text-secondary">{mod.description}</span>
                      </div>
                    </button>
                    <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-neutral-soft px-2.5 py-1">
                      <input
                        type="checkbox"
                        checked={allOn}
                        ref={(el) => {
                          if (el) el.indeterminate = someOn;
                        }}
                        onChange={() => toggleModule(mod.module, allOn)}
                        className="h-3.5 w-3.5 accent-[#492173]"
                      />
                      <span className="whitespace-nowrap font-inter text-[11px] font-medium text-text-body">
                        {allOn ? "Todos" : `${moduleSelected}/${total}`}
                      </span>
                    </label>
                  </div>
                  {!isCollapsed && (
                    <div className="grid grid-cols-2 gap-2 p-3">
                      {mod.permissions.map((perm) => {
                        const checked = selected.has(perm.id);
                        const desc = describePermission(perm.name);
                        return (
                          <label
                            key={perm.id}
                            className={`flex min-w-0 cursor-pointer items-start gap-2 rounded-[6px] px-2 py-2 transition-colors ${
                              checked ? "bg-primary-light" : "hover:bg-surface-hover"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(perm.id)}
                              className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[#492173]"
                            />
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <span
                                className={`truncate font-inter text-[12px] font-medium leading-[16px] ${
                                  checked ? "text-primary" : "text-text-primary"
                                }`}
                              >
                                {desc.label}
                              </span>
                              <span className="font-inter text-[11px] leading-[14px] text-text-secondary break-words">
                                {perm.name}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="shrink-0 rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="mt-1 flex shrink-0 justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-[10px] bg-neutral-soft px-4 py-2 font-inter text-[13px] font-medium text-text-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-primary px-4 py-2 font-inter text-[13px] font-medium text-white disabled:opacity-50"
          >
            {saving ? "Guardando..." : mode === "create" ? "Crear rol" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
