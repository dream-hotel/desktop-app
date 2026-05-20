import { WikiArticleSummary } from "../../types/models/Wiki";

interface ArticleListProps {
  articles: WikiArticleSummary[];
  selectedArticleId: number | null;
  loading: boolean;
  isAdmin: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectArticle: (id: number) => void;
  onCreateClick: () => void;
  totalCount: number;
}

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ArticleList({
  articles,
  selectedArticleId,
  loading,
  isAdmin,
  searchQuery,
  onSearchChange,
  onSelectArticle,
  onCreateClick,
  totalCount,
}: ArticleListProps) {
  return (
    <div className="flex h-full w-[320px] flex-col border-r border-border bg-white">
      <div className="flex flex-col gap-2.5 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="font-alexandria text-[14px] font-medium text-text-primary">
              Artículos
            </h2>
            <span className="font-inter text-[11px] text-text-secondary">
              {totalCount} {totalCount === 1 ? "resultado" : "resultados"}
            </span>
          </div>
          {isAdmin && (
            <button
              onClick={onCreateClick}
              className="flex h-7 items-center justify-center gap-1 rounded-[8px] bg-primary px-2.5 font-inter text-[11.5px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Crear
            </button>
          )}
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-text-secondary">
              <path
                d="M7 13A6 6 0 107 1a6 6 0 000 12zM11 11l4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full rounded-[10px] border border-border bg-bg py-1.5 pl-8 pr-3 font-inter text-[12.5px] text-text-primary outline-none placeholder:text-text-secondary focus:border-primary/50 focus:bg-white"
            placeholder="Buscar por título o contenido..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center font-inter text-[13px] text-text-secondary">
            Cargando artículos...
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              className="mb-2 text-text-secondary/50"
            >
              <path
                d="M4 4h12l4 4v12H4z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M16 4v4h4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <h3 className="font-inter text-[13px] font-medium text-text-primary">
              Sin artículos
            </h3>
            <p className="mt-1 font-inter text-[12px] text-text-secondary">
              {searchQuery
                ? "Ningún artículo coincide con tu búsqueda."
                : "Esta carpeta aún no tiene artículos."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {articles.map((article) => {
              const isSelected = selectedArticleId === article.id;
              return (
                <li key={article.id}>
                  <button
                    onClick={() => onSelectArticle(article.id)}
                    className={`flex w-full flex-col gap-1.5 border-b border-border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-l-[3px] border-l-primary bg-primary/5"
                        : "border-l-[3px] border-l-transparent hover:bg-bg"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-inter text-[13px] font-medium leading-snug text-text-primary">
                        {article.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 font-inter text-[9.5px] font-medium ${
                          article.status === "published"
                            ? "bg-success/10 text-success"
                            : "bg-warning/15 text-warning"
                        }`}
                      >
                        {article.status === "published" ? "Publicado" : "Borrador"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-inter text-[10.5px] text-text-secondary">
                      {article.categoryName && (
                        <>
                          <span className="rounded bg-bg px-1.5 py-0.5 text-text-secondary">
                            {article.categoryName}
                          </span>
                          <span aria-hidden>·</span>
                        </>
                      )}
                      <span className="truncate">{article.authorName}</span>
                    </div>

                    <div className="font-inter text-[10.5px] text-text-secondary">
                      Creado {formatDate(article.createdAt)}
                      {article.updatedAt && article.updatedAt !== article.createdAt && (
                        <> · Editado {formatDate(article.updatedAt)}</>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
