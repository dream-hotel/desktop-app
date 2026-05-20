import { WikiArticleDetail } from "../../types/models/Wiki";
import MarkdownView from "./MarkdownView";

interface ArticleFullViewProps {
  article: WikiArticleDetail;
  isAdmin: boolean;
  breadcrumb: string[];
  publishing: boolean;
  onClose: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onPublishClick: () => void;
}

const MONTHS_ES_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} de ${MONTHS_ES_LONG[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function ArticleFullView({
  article,
  isAdmin,
  breadcrumb,
  publishing,
  onClose,
  onEditClick,
  onDeleteClick,
  onPublishClick,
}: ArticleFullViewProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-border bg-surface text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            aria-label="Volver"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L4 8l6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

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
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" className="text-text-secondary">
                      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isAdmin && (
            <>
              {article.status === "draft" && (
                <button
                  onClick={onPublishClick}
                  disabled={publishing}
                  className="flex h-8 items-center gap-1.5 rounded-[8px] bg-success px-3 font-inter text-[12px] font-medium text-white transition-colors hover:bg-success-light disabled:opacity-60"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {publishing ? "Publicando..." : "Publicar"}
                </button>
              )}
              <button
                onClick={onEditClick}
                className="flex h-8 items-center gap-1.5 rounded-[8px] border border-primary/30 bg-primary/5 px-3 font-inter text-[12px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M12.5 1.5a2.1 2.1 0 00-3 0L2 9l-1 4 4-1 7.5-7.5a2.1 2.1 0 000-3z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Editar
              </button>
              <button
                onClick={onDeleteClick}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border text-danger transition-colors hover:bg-danger/10"
                aria-label="Eliminar artículo"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4l1 9h4l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <article className="mx-auto max-w-[880px] px-12 py-10">
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
              Vista completa
            </span>
          </div>

          <h1 className="mt-3 font-alexandria text-[32px] font-medium leading-tight text-text-primary">
            {article.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4 font-inter text-[12px] text-text-secondary">
            <span>Por {article.authorName}</span>
            <div className="flex flex-wrap items-center gap-3">
              <span>Creado {formatDateLong(article.createdAt)}</span>
              {article.updatedAt && article.updatedAt !== article.createdAt && (
                <span>Actualizado {formatDateLong(article.updatedAt)}</span>
              )}
            </div>
          </div>

          <div className="mt-5">
            {article.contentMarkdown ? (
              <MarkdownView markdown={article.contentMarkdown} />
            ) : (
              <p className="font-inter text-[13px] italic text-text-secondary">
                Este artículo aún no tiene contenido.
              </p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
