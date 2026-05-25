import { Check, ChevronRight, FileText, Maximize2, Pencil, Trash2 } from "lucide-react";
import { WikiArticleDetail } from "../../types/models/Wiki";
import MarkdownView from "./MarkdownView";

interface ArticleViewerProps {
  article: WikiArticleDetail | null;
  loading: boolean;
  isAdmin: boolean;
  breadcrumb: string[];
  onExpandClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onPublishClick: () => void;
  publishing: boolean;
}

const MONTHS_ES_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} de ${MONTHS_ES_LONG[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function ArticleViewer({
  article,
  loading,
  isAdmin,
  breadcrumb,
  onExpandClick,
  onEditClick,
  onDeleteClick,
  onPublishClick,
  publishing,
}: ArticleViewerProps) {
  if (loading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-surface font-inter text-[13px] text-text-secondary">
        Cargando artículo...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-surface">
        <div className="flex max-w-sm flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText size={20} strokeWidth={1.6} />
          </div>
          <h3 className="font-alexandria text-[16px] font-medium text-text-primary">
            Ningún artículo seleccionado
          </h3>
          <p className="mt-1 font-inter text-[12px] text-text-secondary">
            Selecciona un artículo de la lista para previsualizar su contenido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-surface">
      <div className="flex w-full items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden font-inter text-[11.5px]">
          {breadcrumb.length === 0 ? (
            <span className="text-text-secondary">Sin categoría</span>
          ) : (
            breadcrumb.map((label, idx) => (
              <span key={`${label}-${idx}`} className="flex items-center gap-1.5">
                <span
                  className={`truncate rounded-full px-2 py-0.5 ${
                    idx === breadcrumb.length - 1
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-text-secondary"
                  }`}
                >
                  {label}
                </span>
                {idx < breadcrumb.length - 1 && (
                  <ChevronRight size={10} strokeWidth={1.6} className="text-text-secondary" />
                )}
              </span>
            ))
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onExpandClick}
            className="flex h-7 items-center gap-1.5 rounded-[8px] border border-border bg-surface px-2.5 font-inter text-[11.5px] font-medium text-text-primary transition-colors hover:bg-bg"
          >
            <Maximize2 size={12} strokeWidth={1.8} />
            Ver completo
          </button>

          {isAdmin && (
            <>
              {article.status === "draft" && (
                <button
                  onClick={onPublishClick}
                  disabled={publishing}
                  className="flex h-7 items-center gap-1.5 rounded-[8px] bg-success px-2.5 font-inter text-[11.5px] font-medium text-white transition-colors hover:bg-success-light disabled:opacity-60"
                >
                  <Check size={12} strokeWidth={2.2} />
                  {publishing ? "Publicando..." : "Publicar"}
                </button>
              )}
              <button
                onClick={onEditClick}
                className="flex h-7 items-center gap-1.5 rounded-[8px] border border-primary/30 bg-primary/5 px-2.5 font-inter text-[11.5px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <Pencil size={12} strokeWidth={1.8} />
                Editar
              </button>
              <button
                onClick={onDeleteClick}
                className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-border text-danger transition-colors hover:bg-danger/10"
                aria-label="Eliminar artículo"
              >
                <Trash2 size={13} strokeWidth={1.8} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] px-8 py-7">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 font-inter text-[10.5px] font-medium ${
                article.status === "published"
                  ? "bg-success/10 text-success"
                  : "bg-warning/15 text-warning"
              }`}
            >
              {article.status === "published" ? "Publicado" : "Borrador"}
            </span>
            <span className="font-inter text-[10.5px] uppercase tracking-wide text-text-secondary">
              Previsualización
            </span>
          </div>
          <h1 className="mt-2.5 font-alexandria text-[26px] font-medium leading-tight text-text-primary">
            {article.title}
          </h1>

          <div className="mt-3 flex items-center justify-between border-b border-border pb-3 font-inter text-[11.5px] text-text-secondary">
            <span>Por {article.authorName}</span>
            <div className="flex items-center gap-3">
              <span>Creado {formatDateLong(article.createdAt)}</span>
              {article.updatedAt && article.updatedAt !== article.createdAt && (
                <span>Actualizado {formatDateLong(article.updatedAt)}</span>
              )}
            </div>
          </div>

          <div className="mt-4">
            {article.contentMarkdown ? (
              <MarkdownView markdown={article.contentMarkdown} />
            ) : (
              <p className="font-inter text-[13px] italic text-text-secondary">
                Este artículo aún no tiene contenido.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
