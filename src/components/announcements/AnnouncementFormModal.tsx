import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronDown, Search, X } from "lucide-react";
import {
  Announcement,
  AnnouncementType,
  BackendPriority,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
  priorityLabel,
} from "../../types/models/Announcement";
import { listPriorities } from "../../service/priorityService";
import { listTasks } from "../../service/taskService";
import { findArticles } from "../../service/wikiService";
import { listUsers } from "../../service/userService";
import { listRoles } from "../../service/roleService";
import AudiencePicker, { AudienceOption } from "./AudiencePicker";
import { roleDisplayName } from "../../types/models/Roles";
import Dropdown from "../ui/Dropdown";

interface EntityOption {
  id: number;
  title: string;
  subtitle?: string;
}

interface EntitySearchSelectProps {
  selected: EntityOption | null;
  onChange: (option: EntityOption | null) => void;
  loadResults: (query: string) => Promise<EntityOption[]>;
  placeholder: string;
  searchPlaceholder: string;
  emptyResultsLabel: string;
}

function EntitySearchSelect({
  selected,
  onChange,
  loadResults,
  placeholder,
  searchPlaceholder,
  emptyResultsLabel,
}: EntitySearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const list = await loadResults(search);
        if (!cancelled) setResults(list);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, search, loadResults]);

  function selectItem(opt: EntityOption) {
    onChange(opt);
    setOpen(false);
    setSearch("");
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-[10px] border border-primary/40 bg-primary/5 px-3 py-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-inter text-[12.5px] font-medium text-text-primary">
            #{selected.id} · {selected.title}
          </span>
          {selected.subtitle && (
            <span className="truncate font-inter text-[11px] text-text-secondary">
              {selected.subtitle}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
          aria-label="Quitar selección"
        >
          <X size={14} strokeWidth={1.8} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-border bg-bg px-3 py-2 font-inter text-[12.5px] text-text-secondary outline-none transition-colors hover:border-primary/40 hover:bg-surface focus:border-primary/50 focus:bg-surface"
      >
        <span className="truncate">{placeholder}</span>
        <ChevronDown size={14} strokeWidth={1.8} className="shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0px_12px_28px_rgba(0,0,0,0.18)]">
          <div className="relative border-b border-border">
            <Search
              size={14}
              strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent py-2 pl-9 pr-3 font-inter text-[12.5px] text-text-primary outline-none placeholder:text-text-secondary"
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {loading ? (
              <div className="px-3 py-3 font-inter text-[12px] text-text-secondary">
                Buscando...
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-3 font-inter text-[12px] text-text-secondary">
                {emptyResultsLabel}
              </div>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectItem(r)}
                  className="flex w-full flex-col items-start gap-0.5 border-b border-border/50 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-primary/5"
                >
                  <span className="font-inter text-[12.5px] font-medium text-text-primary">
                    #{r.id} · {r.title}
                  </span>
                  {r.subtitle && (
                    <span className="font-inter text-[11px] text-text-secondary">
                      {r.subtitle}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface AnnouncementFormModalProps {
  mode: "create" | "edit";
  initial?: Announcement | null;
  onCancel: () => void;
  onCreate?: (payload: CreateAnnouncementPayload) => Promise<void>;
  onUpdate?: (payload: UpdateAnnouncementPayload) => Promise<void>;
}

const TYPE_OPTIONS: { id: AnnouncementType; label: string; description: string }[] = [
  {
    id: "text",
    label: "Comunicado",
    description: "Mensaje libre para el equipo.",
  },
  {
    id: "task",
    label: "Tarea",
    description: "Vincula el anuncio a una tarea existente.",
  },
  {
    id: "article",
    label: "Artículo",
    description: "Vincula el anuncio a un artículo de la wiki.",
  },
];

function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

function fromDateTimeLocal(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export default function AnnouncementFormModal({
  mode,
  initial,
  onCancel,
  onCreate,
  onUpdate,
}: AnnouncementFormModalProps) {
  const isEdit = mode === "edit";
  const [type, setType] = useState<AnnouncementType>(initial?.type ?? "text");
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priorities, setPriorities] = useState<BackendPriority[]>([]);
  const [priorityId, setPriorityId] = useState<number | "">(initial?.priority?.id ?? "");
  const [hasExpiry, setHasExpiry] = useState<boolean>(!!initial?.visibleUntil);
  const [visibleUntil, setVisibleUntil] = useState<string>(toDateTimeLocal(initial?.visibleUntil));
  const [selectedTask, setSelectedTask] = useState<EntityOption | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<EntityOption | null>(null);
  const [restrictAudience, setRestrictAudience] = useState<boolean>(
    Boolean(initial && (initial.audienceUsers.length > 0 || initial.audienceRoles.length > 0)),
  );
  const [audienceUserIds, setAudienceUserIds] = useState<number[]>(
    initial?.audienceUsers.map((u) => u.id) ?? [],
  );
  const [audienceRoleIds, setAudienceRoleIds] = useState<number[]>(
    initial?.audienceRoles.map((r) => r.id) ?? [],
  );
  const [userOptions, setUserOptions] = useState<AudienceOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<AudienceOption[]>([]);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async (query: string): Promise<EntityOption[]> => {
    const res = await listTasks({ search: query || undefined, limit: 20 });
    return res.data.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.status?.name ? `Estado: ${t.status.name}` : undefined,
    }));
  }, []);

  const loadArticles = useCallback(async (query: string): Promise<EntityOption[]> => {
    const res = await findArticles({ search: query || undefined, limit: 20 });
    return res.data.map((a) => ({
      id: a.id,
      title: a.title,
      subtitle: a.categoryName ?? undefined,
    }));
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel, saving]);

  useEffect(() => {
    listPriorities()
      .then((list) => {
        setPriorities(list);
        if (priorityId === "" && list.length > 0) {
          const defaultPriority =
            list.find((p) => p.name.toLowerCase() === "medium") ?? list[0];
          setPriorityId(defaultPriority.id);
        }
      })
      .catch(() => setPriorities([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAudienceLoading(true);
    Promise.all([listUsers({ page: 1, limit: 100, isActive: true }), listRoles()])
      .then(([users, roles]) => {
        if (cancelled) return;
        setUserOptions(
          users.data.map((u) => ({
            id: u.id,
            label: `${u.fullName} ${u.lastName}`.trim(),
            sublabel: u.email,
          })),
        );
        setRoleOptions(
          roles.map((r) => ({
            id: r.id,
            label: roleDisplayName(r.name),
            sublabel:
              r.permissions.length > 0
                ? `${r.permissions.length} permiso${r.permissions.length === 1 ? "" : "s"}`
                : undefined,
          })),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setUserOptions([]);
        setRoleOptions([]);
      })
      .finally(() => {
        if (!cancelled) setAudienceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("El título es obligatorio.");
      return;
    }
    if (trimmedTitle.length > 150) {
      setError("El título no puede superar los 150 caracteres.");
      return;
    }
    if (priorityId === "") {
      setError("Selecciona una prioridad.");
      return;
    }
    if (hasExpiry && !visibleUntil) {
      setError("Selecciona una fecha de vencimiento o desactiva la opción.");
      return;
    }
    if (restrictAudience && audienceUserIds.length === 0 && audienceRoleIds.length === 0) {
      setError("Selecciona al menos un usuario o rol, o desactiva la restricción de audiencia.");
      return;
    }

    const expiryIso = hasExpiry ? fromDateTimeLocal(visibleUntil) : null;
    const effectiveUserIds = restrictAudience ? audienceUserIds : [];
    const effectiveRoleIds = restrictAudience ? audienceRoleIds : [];

    setSaving(true);
    try {
      if (isEdit && onUpdate) {
        await onUpdate({
          title: trimmedTitle,
          priorityId: priorityId as number,
          description: description.trim(),
          visibleUntil: expiryIso,
          audienceUserIds: effectiveUserIds,
          audienceRoleIds: effectiveRoleIds,
        });
      } else if (!isEdit && onCreate) {
        const payload: CreateAnnouncementPayload = {
          title: trimmedTitle,
          priorityId: priorityId as number,
          announcementType: type,
        };
        if (description.trim().length > 0) payload.description = description.trim();
        if (expiryIso) payload.visibleUntil = expiryIso;
        if (type === "task") {
          if (!selectedTask) {
            setError("Selecciona una tarea para vincular.");
            setSaving(false);
            return;
          }
          payload.taskId = selectedTask.id;
        }
        if (type === "article") {
          if (!selectedArticle) {
            setError("Selecciona un artículo para vincular.");
            setSaving(false);
            return;
          }
          payload.articleId = selectedArticle.id;
        }
        if (effectiveUserIds.length > 0) payload.audienceUserIds = effectiveUserIds;
        if (effectiveRoleIds.length > 0) payload.audienceRoleIds = effectiveRoleIds;
        await onCreate(payload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el anuncio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <button
        className="absolute inset-0 cursor-default"
        onClick={() => !saving && onCancel()}
        aria-label="Cerrar modal"
      />
      <div className="relative z-10 flex w-full max-w-[560px] flex-col overflow-hidden rounded-[16px] border border-border bg-surface shadow-[0px_20px_50px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div className="flex flex-col">
            <h2 className="font-alexandria text-[18px] font-medium leading-tight text-text-primary">
              {isEdit ? "Editar anuncio" : "Nuevo anuncio"}
            </h2>
            <p className="mt-0.5 font-inter text-[12px] text-text-secondary">
              {isEdit
                ? "Actualiza el título, descripción, prioridad o fecha de visibilidad."
                : "Elige el tipo, redacta el contenido y define la visibilidad."}
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex h-7 w-7 items-center justify-center rounded-[8px] text-text-secondary transition-colors hover:bg-bg disabled:opacity-50"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex max-h-[80vh] flex-col overflow-y-auto">
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-[11.5px] font-semibold uppercase tracking-wide text-text-secondary">
                Título <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                placeholder="Ej. Reunión de equipo — viernes 9am"
                className="w-full rounded-[10px] border border-border bg-bg px-3 py-2 font-inter text-[13px] text-text-primary outline-none transition-colors focus:border-primary/50 focus:bg-surface"
              />
              <div className="flex justify-between font-inter text-[10.5px] text-text-secondary">
                <span>Encabezado visible del anuncio.</span>
                <span>{title.length}/150</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-[11.5px] font-semibold uppercase tracking-wide text-text-secondary">
                Prioridad <span className="text-danger">*</span>
              </label>
              <Dropdown<number | "">
                className="w-full"
                ariaLabel="Prioridad"
                disabled={priorities.length === 0}
                value={priorityId}
                onChange={setPriorityId}
                placeholder="Seleccionar prioridad..."
                triggerClassName={`flex w-full items-center justify-between gap-2 rounded-[10px] border border-border bg-bg px-3 py-2 font-inter text-[13px] text-text-primary outline-none transition-colors hover:border-border-strong ${
                  priorities.length === 0 ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                }`}
                options={
                  priorities.length === 0
                    ? [{ value: "", label: "Cargando prioridades...", disabled: true }]
                    : priorities.map((p) => ({ value: p.id, label: priorityLabel(p.name) }))
                }
              />
            </div>

            {!isEdit && (
              <div className="flex flex-col gap-2">
                <label className="font-inter text-[11.5px] font-semibold uppercase tracking-wide text-text-secondary">
                  Tipo de anuncio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setType(opt.id)}
                      className={`flex flex-col items-start gap-1 rounded-[10px] border px-3 py-2.5 text-left transition-colors ${
                        type === opt.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-surface hover:border-primary/30 hover:bg-bg"
                      }`}
                    >
                      <span
                        className={`font-inter text-[12.5px] font-medium ${
                          type === opt.id ? "text-primary" : "text-text-primary"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="font-inter text-[10.5px] leading-snug text-text-secondary">
                        {opt.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isEdit && type === "task" && (
              <div className="flex flex-col gap-1.5">
                <label className="font-inter text-[11.5px] font-semibold uppercase tracking-wide text-text-secondary">
                  Tarea vinculada <span className="text-danger">*</span>
                </label>
                <EntitySearchSelect
                  selected={selectedTask}
                  onChange={setSelectedTask}
                  loadResults={loadTasks}
                  placeholder="Selecciona una tarea..."
                  searchPlaceholder="Buscar tarea por título..."
                  emptyResultsLabel="No se encontraron tareas."
                />
              </div>
            )}

            {!isEdit && type === "article" && (
              <div className="flex flex-col gap-1.5">
                <label className="font-inter text-[11.5px] font-semibold uppercase tracking-wide text-text-secondary">
                  Artículo vinculado <span className="text-danger">*</span>
                </label>
                <EntitySearchSelect
                  selected={selectedArticle}
                  onChange={setSelectedArticle}
                  loadResults={loadArticles}
                  placeholder="Selecciona un artículo..."
                  searchPlaceholder="Buscar artículo por título..."
                  emptyResultsLabel="No se encontraron artículos."
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-[11.5px] font-semibold uppercase tracking-wide text-text-secondary">
                Descripción
                <span className="ml-2 normal-case text-text-secondary/70">
                  {isEdit || type === "text" ? "(requerida)" : "(opcional)"}
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === "text"
                    ? "Redacta el comunicado..."
                    : "Agrega un comentario o contexto (opcional)..."
                }
                rows={5}
                className="w-full resize-none rounded-[10px] border border-border bg-bg px-3 py-2.5 font-inter text-[13px] leading-relaxed text-text-primary outline-none transition-colors focus:border-primary/50 focus:bg-surface"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={hasExpiry}
                  onChange={(e) => setHasExpiry(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                />
                <span className="font-inter text-[12.5px] font-medium text-text-primary">
                  Definir fecha de vencimiento
                </span>
              </label>
              {hasExpiry ? (
                <input
                  type="datetime-local"
                  value={visibleUntil}
                  onChange={(e) => setVisibleUntil(e.target.value)}
                  className="w-full rounded-[10px] border border-border bg-bg px-3 py-2 font-inter text-[13px] text-text-primary outline-none transition-colors focus:border-primary/50 focus:bg-surface"
                />
              ) : (
                <p className="font-inter text-[11.5px] text-text-secondary">
                  El anuncio permanecerá visible indefinidamente.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={restrictAudience}
                  onChange={(e) => setRestrictAudience(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                />
                <span className="font-inter text-[12.5px] font-medium text-text-primary">
                  Limitar quién puede verlo
                </span>
              </label>
              {restrictAudience ? (
                <div className="flex flex-col gap-3 rounded-[10px] border border-border bg-bg p-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                      Roles
                    </label>
                    <AudiencePicker
                      placeholder="Sin roles seleccionados"
                      emptyLabel="No hay roles disponibles."
                      options={roleOptions}
                      selectedIds={audienceRoleIds}
                      onChange={setAudienceRoleIds}
                      loading={audienceLoading}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                      Usuarios específicos
                    </label>
                    <AudiencePicker
                      placeholder="Sin usuarios seleccionados"
                      emptyLabel="No hay usuarios disponibles."
                      options={userOptions}
                      selectedIds={audienceUserIds}
                      onChange={setAudienceUserIds}
                      loading={audienceLoading}
                    />
                  </div>
                  <p className="font-inter text-[11px] leading-snug text-text-secondary">
                    El anuncio se mostrará a los usuarios elegidos <strong>y</strong> a todos los que tengan alguno de los roles seleccionados.
                  </p>
                </div>
              ) : (
                <p className="font-inter text-[11.5px] text-text-secondary">
                  Sin restricciones: todos los usuarios con permiso para ver anuncios lo recibirán.
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
                <AlertCircle size={14} strokeWidth={1.8} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border bg-bg px-6 py-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-[10px] border border-border bg-surface px-4 py-2 font-inter text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-bg disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-[10px] bg-primary px-4 py-2 font-inter text-[12.5px] font-medium text-on-accent transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {saving
                ? isEdit
                  ? "Guardando..."
                  : "Publicando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Publicar anuncio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
