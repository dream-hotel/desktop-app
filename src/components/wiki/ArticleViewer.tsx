import { WikiArticle } from "../../types/models/Wiki";

interface ArticleViewerProps {
  article: WikiArticle | null;
  categoryName: string;
  directoryName: string;
  onEditClick: () => void;
}

export default function ArticleViewer({
  article,
  categoryName,
  directoryName,
  onEditClick,
}: ArticleViewerProps) {
  if (!article) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-white">
        <div className="flex flex-col items-center text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-4 text-gray-300">
            <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h3 className="font-alexandria text-[16px] font-medium text-text-primary">
            Ningún artículo seleccionado
          </h3>
          <p className="mt-1 font-inter text-[13px] text-text-secondary">
            Selecciona un artículo de la lista para ver su contenido o crea uno nuevo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-y-auto bg-white">
      <div className="flex w-full items-center justify-between border-b border-border px-8 py-5">
        <div className="flex items-center gap-2 font-inter text-[13px]">
          <span className="rounded-full bg-teal/10 px-2.5 py-1 font-medium text-teal">
            {directoryName}
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-secondary">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-text-secondary">{categoryName}</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onEditClick} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12.5 1.5a2.1 2.1 0 00-3 0L2 9l-1 4 4-1 7.5-7.5a2.1 2.1 0 000-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-danger transition-colors hover:bg-danger/10">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 2L6 2l-2 4v8h8V6l-2-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 6L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col px-8 py-8">
        <h1 className="font-alexandria text-[32px] font-medium leading-tight text-text-primary">
          {article.title}
        </h1>

        <div className="mt-6 flex items-center justify-between border-b border-border pb-6 font-inter text-[13px] text-text-secondary">
          <span>By {article.author}</span>
          <div className="flex items-center gap-6">
            <span>Updated {article.date}</span>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7c2-4 5-6 6-6s4 2 6 6c-2 4-5 6-6 6s-4-2-6-6zM7 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{article.views} views</span>
            </div>
          </div>
        </div>

        <div 
          className="prose prose-sm prose-gray max-w-none py-8 font-inter text-[14px] leading-relaxed text-text-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </div>
  );
}
