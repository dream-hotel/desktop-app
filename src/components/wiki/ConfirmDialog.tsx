interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
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
      : "bg-primary hover:bg-primary-hover";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[420px] flex-col gap-4 rounded-[14px] bg-white p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              tone === "danger" ? "bg-danger/10" : "bg-primary/10"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className={tone === "danger" ? "text-danger" : "text-primary"}
            >
              <path d="M10 6v5M10 14h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
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
            className="rounded-[10px] bg-[#f3f4f6] px-4 py-2 font-inter text-[13px] font-medium text-text-secondary"
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
