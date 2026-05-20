import { useEffect, useState } from "react";
import {
  Announcement,
  AnnouncementType,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from "../../types/models/Announcement";

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
  const [description, setDescription] = useState(initial?.description ?? "");
  const [hasExpiry, setHasExpiry] = useState<boolean>(!!initial?.visibleUntil);
  const [visibleUntil, setVisibleUntil] = useState<string>(toDateTimeLocal(initial?.visibleUntil));
  const [taskId, setTaskId] = useState<string>(
    initial?.taskId != null ? String(initial.taskId) : "",
  );
  const [articleId, setArticleId] = useState<string>(
    initial?.articleId != null ? String(initial.articleId) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel, saving]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (hasExpiry && !visibleUntil) {
      setError("Selecciona una fecha de vencimiento o desactiva la opción.");
      return;
    }

    const expiryIso = hasExpiry ? fromDateTimeLocal(visibleUntil) : null;

    setSaving(true);
    try {
      if (isEdit && onUpdate) {
        await onUpdate({
          description: description.trim(),
          visibleUntil: expiryIso,
        });
      } else if (!isEdit && onCreate) {
        const payload: CreateAnnouncementPayload = {
          announcementType: type,
        };
        if (description.trim().length > 0) payload.description = description.trim();
        if (expiryIso) payload.visibleUntil = expiryIso;
        if (type === "task") {
          const id = parseInt(taskId, 10);
          if (!Number.isFinite(id) || id <= 0) {
            setError("Ingresa un ID de tarea válido.");
            setSaving(false);
            return;
          }
          payload.taskId = id;
        }
        if (type === "article") {
          const id = parseInt(articleId, 10);
          if (!Number.isFinite(id) || id <= 0) {
            setError("Ingresa un ID de artículo válido.");
            setSaving(false);
            return;
          }
          payload.articleId = id;
        }
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
      <div className="relative z-10 flex w-full max-w-[560px] flex-col overflow-hidden rounded-[16px] border border-border bg-white shadow-[0px_20px_50px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div className="flex flex-col">
            <h2 className="font-alexandria text-[18px] font-medium leading-tight text-text-primary">
              {isEdit ? "Editar anuncio" : "Nuevo anuncio"}
            </h2>
            <p className="mt-0.5 font-inter text-[12px] text-text-secondary">
              {isEdit
                ? "Solo puedes modificar la descripción y la fecha de visibilidad."
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
                          : "border-border bg-white hover:border-primary/30 hover:bg-bg"
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
                  ID de la tarea
                </label>
                <input
                  type="number"
                  min={1}
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  placeholder="Ej. 12"
                  className="w-full rounded-[10px] border border-border bg-bg px-3 py-2 font-inter text-[13px] text-text-primary outline-none transition-colors focus:border-primary/50 focus:bg-white"
                />
                <p className="font-inter text-[11px] text-text-secondary">
                  Encuentra el ID en la sección de Tareas.
                </p>
              </div>
            )}

            {!isEdit && type === "article" && (
              <div className="flex flex-col gap-1.5">
                <label className="font-inter text-[11.5px] font-semibold uppercase tracking-wide text-text-secondary">
                  ID del artículo
                </label>
                <input
                  type="number"
                  min={1}
                  value={articleId}
                  onChange={(e) => setArticleId(e.target.value)}
                  placeholder="Ej. 3"
                  className="w-full rounded-[10px] border border-border bg-bg px-3 py-2 font-inter text-[13px] text-text-primary outline-none transition-colors focus:border-primary/50 focus:bg-white"
                />
                <p className="font-inter text-[11px] text-text-secondary">
                  Encuentra el ID en la Wiki institucional.
                </p>
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
                className="w-full resize-none rounded-[10px] border border-border bg-bg px-3 py-2.5 font-inter text-[13px] leading-relaxed text-text-primary outline-none transition-colors focus:border-primary/50 focus:bg-white"
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
                  className="w-full rounded-[10px] border border-border bg-bg px-3 py-2 font-inter text-[13px] text-text-primary outline-none transition-colors focus:border-primary/50 focus:bg-white"
                />
              ) : (
                <p className="font-inter text-[11.5px] text-text-secondary">
                  El anuncio permanecerá visible indefinidamente.
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border bg-bg px-6 py-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-[10px] border border-border bg-white px-4 py-2 font-inter text-[12.5px] font-medium text-text-secondary transition-colors hover:bg-bg disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-[10px] bg-primary px-4 py-2 font-inter text-[12.5px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
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
