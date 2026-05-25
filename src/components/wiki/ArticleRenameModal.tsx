import { useState } from "react";

interface ArticleRenameModalProps {
  initialTitle: string;
  onCancel: () => void;
  onSubmit: (newTitle: string) => Promise<void>;
}

export default function ArticleRenameModal({
  initialTitle,
  onCancel,
  onSubmit,
}: ArticleRenameModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("El título es obligatorio.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo renombrar el artículo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-[400px] flex-col gap-5 rounded-[14px] bg-surface p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
      >
        <header className="flex flex-col gap-1">
          <h3 className="font-alexandria text-[18px] font-medium text-text-primary">
            Editar artículo
          </h3>
          <p className="font-inter text-[12px] text-text-secondary">
            Cambia el título del artículo.
          </p>
        </header>

        <div className="flex flex-col gap-1">
          <label className="font-inter text-[12px] font-medium text-text-primary">
            Nombre del artículo
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            autoFocus
            className="rounded-[10px] border border-border bg-surface px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary/50"
          />
        </div>

        {error && (
          <div className="rounded-[8px] border border-danger/30 bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-[10px] bg-neutral-soft px-4 py-2 font-inter text-[13px] font-medium text-text-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-[10px] bg-primary px-4 py-2 font-inter text-[13px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
