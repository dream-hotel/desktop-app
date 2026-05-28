import { Check, FileText, Maximize2, Pencil, Trash2, Paperclip } from "lucide-react";
import { WikiArticleDetail } from "../../types/models/Wiki";
import MarkdownView from "./MarkdownView";
import DocumentViewer from "./DocumentViewer";

interface ArticleViewerProps {
  article: WikiArticleDetail | null;
  loading: boolean;
  isAdmin: boolean;
  breadcrumb: string[];
  onExpandClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onPublishClick: () => void;
  onUploadClick: () => void;
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
  onExpandClick,
  onEditClick,
  onDeleteClick,
  onPublishClick,
  onUploadClick,
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
      <div className="flex w-full items-center justify-end gap-3 border-b border-border px-6 py-3">
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
              <button
                onClick={onUploadClick}
                className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-border text-text-secondary transition-colors hover:bg-border hover:text-text-primary"
                title="Adjuntar o reemplazar archivo"
              >
                <Paperclip size={14} strokeWidth={1.8} />
              </button>

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
          <h1 className="font-alexandria text-[26px] font-medium leading-tight text-text-primary">
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
            {article.fileUrl ? (
              <div className="h-[600px]">
                <DocumentViewer fileUrl={article.fileUrl} fileName={article.title} />
              </div>
            ) : article.contentMarkdown && article.contentMarkdown.trim().length > 0 && article.contentMarkdown !== '{"root":[{"type":"paragraph","content":[]}]}' ? (
              <MarkdownView markdown={article.contentMarkdown} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-text-secondary">
                <FileText size={40} strokeWidth={1} className="mb-3 opacity-20" />
                <p className="font-inter text-[14px] italic">
                  Este artículo todavía no tiene contenido escrito ni documentos adjuntos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
