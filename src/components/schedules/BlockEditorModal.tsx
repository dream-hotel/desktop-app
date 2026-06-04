import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DailyBlock, formatTime } from "../../types/models/Schedule";

const DAY_OPTIONS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

interface BlockEditorModalProps {
  mode: "create" | "edit";
  scheduleName: string;
  initialDay: number;
  initialStart?: string; // "HH:MM"
  initialEnd?: string; // "HH:MM"
  block?: DailyBlock | null;
  onClose: () => void;
  onSave: (payload: { day: number; startTime: string; endTime: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function BlockEditorModal({
  mode,
  scheduleName,
  initialDay,
  initialStart = "09:00",
  initialEnd = "17:00",
  block,
  onClose,
  onSave,
  onDelete,
}: BlockEditorModalProps) {
  const [day, setDay] = useState<number>(initialDay);
  const [startTime, setStartTime] = useState<string>(initialStart);
  const [endTime, setEndTime] = useState<string>(initialEnd);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "edit" && block) {
      setDay(block.day);
      setStartTime(formatTime(block.startTime));
      setEndTime(formatTime(block.endTime));
    }
  }, [mode, block]);

  function validate(): string | null {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) return "La hora de inicio debe estar en formato HH:MM";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) return "La hora de fin debe estar en formato HH:MM";
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    if (sh * 60 + sm >= eh * 60 + em) return "La hora de fin debe ser posterior a la de inicio";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    try {
      await onSave({ day, startTime, endTime });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el bloque");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex w-[420px] flex-col gap-4 rounded-[14px] bg-surface p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-alexandria text-[22px] font-normal leading-[26px] text-text-primary">
              {mode === "create" ? "Nuevo bloque" : "Editar bloque"}
            </h2>
            <p className="mt-1 font-inter text-[12px] text-text-secondary">
              Horario: <span className="font-medium text-text-body">{scheduleName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-secondary hover:bg-neutral-soft"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-inter text-[12px] font-medium text-text-body">Día de la semana</label>
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="rounded-[8px] border border-border bg-surface px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary"
          >
            {DAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="font-inter text-[12px] font-medium text-text-body">Inicio</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="rounded-[8px] border border-border bg-surface px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="font-inter text-[12px] font-medium text-text-body">Fin</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="rounded-[8px] border border-border bg-surface px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="rounded-[10px] bg-danger/10 px-4 py-2 font-inter text-[13px] font-medium text-danger disabled:opacity-50"
            >
              {deleting ? "Eliminando..." : "Eliminar bloque"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className="rounded-[10px] bg-neutral-soft px-4 py-2 font-inter text-[13px] font-medium text-text-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || deleting}
              className="rounded-[10px] bg-primary px-4 py-2 font-inter text-[13px] font-medium text-on-accent disabled:opacity-50"
            >
              {saving ? "Guardando..." : mode === "create" ? "Crear bloque" : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
