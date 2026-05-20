import { useState, useRef } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Film,
  Image as ImageIcon,
  Sun,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";

type Priority = "high" | "medium" | "low";

interface CreateTaskForm {
  title: string;
  description: string;
  assignee: string;
  priority: Priority;
  context: string;
  startDate: string;
  startTime: string;
  startAllDay: boolean;
  endDate: string;
  endTime: string;
  endAllDay: boolean;
  files: File[];
}

const EMPTY_FORM: CreateTaskForm = {
  title: "",
  description: "",
  assignee: "",
  priority: "medium",
  context: "",
  startDate: "",
  startTime: "",
  startAllDay: false,
  endDate: "",
  endTime: "",
  endAllDay: false,
  files: [],
};

const PRIORITY_OPTIONS: {
  value: Priority;
  label: string;
  sub: string;
}[] = [
  { value: "high", label: "Alta", sub: "Urgente" },
  { value: "medium", label: "Media", sub: "Normal" },
  { value: "low", label: "Baja", sub: "Sin prisa" },
];

interface CreateTaskModalProps {
  onClose: () => void;
  onCreate: (form: CreateTaskForm) => void;
}

export default function CreateTaskModal({ onClose, onCreate }: CreateTaskModalProps) {
  const [form, setForm] = useState<CreateTaskForm>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update<K extends keyof CreateTaskForm>(key: K, value: CreateTaskForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClear() {
    setForm(EMPTY_FORM);
  }

  function handleSubmit() {
    if (!form.title.trim()) return;
    onCreate(form);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    update("files", [...form.files, ...dropped]);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      update("files", [...form.files, ...Array.from(e.target.files)]);
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-[rgba(0,0,0,0.08)] bg-bg shadow-[0px_22px_43px_0px_rgba(0,0,0,0.25)]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-5 py-4">
        <h2 className="font-alexandria text-[31px] font-normal leading-[30px] text-text-primary">
          Nueva Tarea
        </h2>
        <button
          onClick={onClose}
          className="flex h-[26px] w-[26px] items-center justify-center rounded-lg text-text-secondary hover:bg-neutral-soft"
        >
          <X size={14} strokeWidth={1.8} className="text-text-secondary" />
        </button>
      </div>

      {/* Shift banner */}
      <div className="mx-5 mt-3.5 flex items-center gap-2.5 rounded-lg border border-primary/30 bg-primary-light px-3 py-2">
        <Sun size={12} strokeWidth={1.6} className="shrink-0 text-primary" />
        <span className="font-inter text-[10px] font-medium text-primary">Turno de origen:</span>
        <span className="font-inter text-[10px] text-text-primary">Afternoon Shift (14:00–22:00)</span>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
        <div className="flex flex-col gap-4">
          {/* Título */}
          <FieldGroup label="Título" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ej. Suite 301 — Revisión de climatización"
              className="w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-3.5 py-2 font-inter text-xs text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none"
            />
          </FieldGroup>

          {/* Descripción */}
          <FieldGroup label="Descripción" optional>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Detalla el alcance de la tarea, instrucciones especiales..."
              rows={3}
              className="w-full resize-none rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-3.5 py-2 font-inter text-xs leading-[18px] text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none"
            />
          </FieldGroup>

          {/* Responsable(s) */}
          <FieldGroup label="Responsable(s)" required>
            <div className="flex items-center gap-2 rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-3.5 py-2">
              <UserIcon size={12} strokeWidth={1.4} className="shrink-0 text-text-secondary" />
              <input
                type="text"
                value={form.assignee}
                onChange={(e) => update("assignee", e.target.value)}
                placeholder="Buscar colaborador..."
                className="min-w-0 flex-1 font-inter text-[11px] text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none"
              />
              <ChevronDown size={12} strokeWidth={1.6} className="shrink-0 text-text-secondary" />
            </div>
          </FieldGroup>

          {/* Prioridad */}
          <div className="flex flex-col gap-2">
            <span className="font-inter text-[10px] font-medium leading-4 text-text-body">
              Prioridad
            </span>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => {
                const selected = form.priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => update("priority", opt.value)}
                    className={`flex flex-1 flex-col items-center justify-center rounded-lg border-2 py-3 transition-colors ${
                      selected
                        ? "border-success bg-[rgba(118,199,194,0.15)]"
                        : "border-[rgba(0,0,0,0.08)] bg-surface"
                    }`}
                  >
                    <span
                      className={`font-inter text-[11px] font-semibold ${
                        selected ? "text-success" : "text-text-secondary"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span
                      className={`font-inter text-[9.5px] font-medium opacity-75 ${
                        selected ? "text-success" : "text-text-secondary"
                      }`}
                    >
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estado inicial / Contexto */}
          <FieldGroup label="Estado inicial / Contexto" optional>
            <textarea
              value={form.context}
              onChange={(e) => update("context", e.target.value)}
              placeholder="Ej. Piezas en camino, esperando confirmación del proveedor..."
              rows={2}
              className="w-full resize-none rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-3.5 py-2 font-inter text-xs leading-[18px] text-text-primary placeholder-[rgba(26,26,26,0.5)] outline-none"
            />
          </FieldGroup>

          {/* Dates row */}
          <div className="flex gap-3">
            {/* Fecha de inicio */}
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="font-inter text-[10px] font-medium leading-4 text-text-body">
                Fecha de inicio
              </span>
              <div className="flex items-center rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-2.5 py-2">
                <Calendar size={12} strokeWidth={1.4} className="shrink-0 text-text-secondary" />
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                  className="ml-2 min-w-0 flex-1 font-inter text-[11px] text-text-primary outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  checked={form.startAllDay}
                  onChange={(v) => update("startAllDay", v)}
                />
                <span className="font-inter text-[9.5px] font-medium text-text-secondary">
                  Todo el día
                </span>
              </div>
              {!form.startAllDay && (
                <div className="flex items-center rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-2.5 py-2">
                  <Clock size={12} strokeWidth={1.4} className="shrink-0 text-text-secondary" />
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => update("startTime", e.target.value)}
                    className="ml-2 min-w-0 flex-1 font-inter text-[11px] text-text-primary outline-none"
                  />
                </div>
              )}
            </div>

            {/* Fecha límite */}
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="font-inter text-[10px] font-medium leading-4 text-text-body">
                Fecha límite
              </span>
              <div className="flex items-center rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-2.5 py-2">
                <Calendar size={12} strokeWidth={1.4} className="shrink-0 text-text-secondary" />
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => update("endDate", e.target.value)}
                  className="ml-2 min-w-0 flex-1 font-inter text-[11px] text-text-primary outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <ToggleSwitch
                  checked={form.endAllDay}
                  onChange={(v) => update("endAllDay", v)}
                />
                <span className="font-inter text-[9.5px] font-medium text-text-secondary">
                  Todo el día
                </span>
              </div>
              {!form.endAllDay && (
                <div className="flex items-center rounded-lg border border-[rgba(0,0,0,0.1)] bg-surface px-2.5 py-2">
                  <Clock size={12} strokeWidth={1.4} className="shrink-0 text-text-secondary" />
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => update("endTime", e.target.value)}
                    className="ml-2 min-w-0 flex-1 font-inter text-[11px] text-text-primary outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Archivos adjuntos */}
          <FieldGroup label="Archivos adjuntos" optionalText="(imágenes o vídeos)">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[rgba(0,0,0,0.12)] bg-surface py-5"
            >
              <Upload size={18} strokeWidth={1.4} className="text-text-secondary" />
              <div className="flex flex-col items-center">
                <span className="font-inter text-[11px] text-text-secondary">
                  Arrastra archivos o haz clic para seleccionar
                </span>
                <span className="font-inter text-[9.5px] text-text-secondary">
                  JPG, PNG, WEBP, GIF, MP4, MOV
                </span>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-1">
                  <ImageIcon size={10} strokeWidth={1.4} className="text-text-secondary" />
                  <span className="font-inter text-[9.5px] text-text-secondary">Imágenes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Film size={10} strokeWidth={1.4} className="text-text-secondary" />
                  <span className="font-inter text-[9.5px] text-text-secondary">Vídeos</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            {form.files.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 rounded bg-neutral-soft px-2 py-1 font-inter text-[9px] text-text-secondary"
                  >
                    <span className="max-w-[100px] truncate">{file.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        update("files", form.files.filter((_, j) => j !== i));
                      }}
                      className="ml-0.5 text-text-secondary hover:text-text-primary"
                    >
                      <X size={8} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FieldGroup>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-5 py-3.5">
        <button
          onClick={onClose}
          className="font-inter text-[11px] font-medium text-text-secondary"
        >
          Cancelar
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="rounded-[10px] border border-border-strong px-3 py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-text-secondary"
          >
            Limpiar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-[9px] rounded-[10px] bg-primary px-3 py-[6px] font-inter text-[13px] font-medium leading-[19.5px] text-white"
          >
            <Check size={16} strokeWidth={2} />
            Crear tarea
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Helper components ---

function FieldGroup({
  label,
  required,
  optional,
  optionalText,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  optionalText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-inter text-[10px] font-medium leading-4 text-text-body">
        {label}{" "}
        {required && <span className="text-danger">*</span>}
        {optional && <span className="text-text-secondary">(opcional)</span>}
        {optionalText && <span className="text-text-secondary">{optionalText}</span>}
      </span>
      {children}
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-[14px] w-[28px] rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-neutral-mid"
      }`}
    >
      <div
        className={`absolute top-[2px] h-[10px] w-[10px] rounded-full bg-surface shadow-[0px_1px_2.5px_rgba(0,0,0,0.1),0px_1px_1.7px_rgba(0,0,0,0.1)] transition-transform ${
          checked ? "translate-x-[16px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}
