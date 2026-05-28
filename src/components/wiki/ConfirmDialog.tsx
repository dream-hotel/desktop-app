import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary" | "warning";
  loading?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "primary",
  loading = false,
  error,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const confirmClass =
    tone === "danger"
      ? "bg-danger hover:bg-danger/90"
      : tone === "warning"
      ? "bg-warning hover:bg-warning/90"
      : "bg-primary hover:bg-primary-hover";

  const iconBgClass =
    tone === "danger"
      ? "bg-danger/10"
      : tone === "warning"
      ? "bg-warning/10"
      : "bg-primary/10";

  const iconColorClass =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
      ? "text-warning"
      : "text-primary";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[420px] flex-col gap-4 rounded-[14px] bg-surface p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBgClass}`}
          >
            <AlertTriangle
              size={20}
              strokeWidth={1.8}
              className={iconColorClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-alexandria text-[18px] font-normal leading-[22px] text-text-primary">
              {title}
            </h3>
            <p className="font-inter text-[13px] text-text-body">{message}</p>
          </div>
        </div>

        {error && (
          <div className="rounded-[8px] border border-danger/30 bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-[10px] bg-neutral-soft px-4 py-2 font-inter text-[13px] font-medium text-text-secondary"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-[10px] px-4 py-2 font-inter text-[13px] font-medium text-white transition-colors disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
