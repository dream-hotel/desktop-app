import { WikiArticle } from "../../types/models/Wiki";

interface ArticleListProps {
  articles: WikiArticle[];
  selectedArticleId: string | null;
  onSelectArticle: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateClick: () => void;
}

export default function ArticleList({
  articles,
  selectedArticleId,
  onSelectArticle,
  searchQuery,
  onSearchChange,
  onCreateClick,
}: ArticleListProps) {
  return (
    <div className="flex h-full w-[350px] flex-col border-r border-border bg-white">
      <div className="border-b border-border p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-inter text-[14px] font-bold text-text-primary">Artículos</h2>
          <button 
            onClick={onCreateClick}
            className="flex h-8 items-center justify-center rounded bg-primary px-3 text-[12px] font-medium text-white transition-colors hover:bg-primary/90"
          >
            + Crear
          </button>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-secondary">
              <path d="M7 13A6 6 0 107 1a6 6 0 000 12zM11 11l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-border bg-gray-50 py-2 pl-10 pr-3 font-inter text-[13px] text-text-primary outline-none placeholder:text-text-secondary focus:border-primary/50 focus:bg-white"
            placeholder="Buscar artículos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {articles.length === 0 ? (
          <div className="p-8 text-center font-inter text-[13px] text-text-secondary">
            No se encontraron artículos.
          </div>
        ) : (
          <div className="flex flex-col">
            {articles.map((article) => {
              const isSelected = selectedArticleId === article.id;
              return (
                <button
                  key={article.id}
                  onClick={() => onSelectArticle(article.id)}
                  className={`flex flex-col border-b border-border p-5 text-left transition-colors ${
                    isSelected
                      ? "border-l-[3px] border-l-teal bg-teal/5"
                      : "border-l-[3px] border-l-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {article.isRestricted && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-danger">
                        <path d="M8 1L2 3v4c0 3.8 2.6 7.3 6 8 3.4-.7 6-4.2 6-8V3L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <h3 className="font-inter text-[14px] font-medium leading-tight text-text-primary">
                      {article.title}
                    </h3>
                  </div>

                  <p className="mt-2 line-clamp-2 font-inter text-[12px] leading-relaxed text-text-secondary">
                    {article.description}
                  </p>

                  <div className="mt-4 flex w-full items-center justify-between font-inter text-[11px] text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 11A5 5 0 106 1a5 5 0 000 10zM6 3v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{article.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 6c1.8-3.3 4.2-5 5-5s3.2 1.7 5 5c-1.8 3.3-4.2 5-5 5s-3.2-1.7-5-5zM6 8.5A2.5 2.5 0 106 3.5a2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{article.views}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
