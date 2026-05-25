import { FileText, Upload } from "lucide-react";

interface ArticleTypeModalProps {
  onCancel: () => void;
  onSelectWrite: () => void;
  onSelectUpload: () => void;
}

export default function ArticleTypeModal({
  onCancel,
  onSelectWrite,
  onSelectUpload,
}: ArticleTypeModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[440px] flex-col gap-6 rounded-[14px] bg-surface p-7 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
      >
        <header className="flex flex-col gap-1.5">
          <h3 className="font-alexandria text-[20px] font-medium text-text-primary">
            Crear artículo
          </h3>
          <p className="font-inter text-[13px] text-text-secondary">
            Selecciona cómo deseas añadir contenido a la wiki.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onSelectWrite}
            className="group flex flex-col items-center gap-4 rounded-[12px] border border-border bg-surface p-6 transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <FileText size={24} strokeWidth={1.8} />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="font-inter text-[14px] font-semibold text-text-primary">
                Escribir artículo
              </span>
              <span className="font-inter text-[11px] text-text-secondary leading-tight">
                Usa el editor enriquecido con Markdown.
              </span>
            </div>
          </button>

          <button
            onClick={onSelectUpload}
            className="group flex flex-col items-center gap-4 rounded-[12px] border border-border bg-surface p-6 transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Upload size={24} strokeWidth={1.8} />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="font-inter text-[14px] font-semibold text-text-primary">
                Adjuntar archivo
              </span>
              <span className="font-inter text-[11px] text-text-secondary leading-tight">
                Sube un documento PDF, Word o Excel.
              </span>
            </div>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="rounded-[10px] bg-neutral-soft px-4 py-2 font-inter text-[13px] font-medium text-text-secondary transition-colors hover:bg-neutral-soft/80"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
