import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  userName: string;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  userName,
  loading,
  error,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[400px] flex-col gap-4 rounded-[14px] bg-surface p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle size={20} strokeWidth={1.8} className="text-danger" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-alexandria text-[18px] font-normal leading-[22px] text-text-primary">
              Eliminar usuario
            </h3>
            <p className="font-inter text-[13px] text-text-body">
              ¿Estás seguro de eliminar a <strong>{userName}</strong>? Esta acción es un soft delete:
              los registros históricos se conservan.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-[8px] border border-[rgba(239,68,68,0.3)] bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-[10px] bg-neutral-soft px-4 py-2 font-inter text-[13px] font-medium text-text-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-[10px] bg-danger px-4 py-2 font-inter text-[13px] font-medium text-on-accent disabled:opacity-50"
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
