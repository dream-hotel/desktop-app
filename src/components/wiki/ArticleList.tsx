import { FileText, Plus, Search } from "lucide-react";
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
}: ArticleListProps) {
  return (
    <div className="flex h-full w-[320px] flex-col border-r border-border bg-surface">
      <div className="flex flex-col gap-2.5 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="font-alexandria text-[14px] font-medium text-text-primary">
              Artículos
            </h2>
          </div>
          {isAdmin && (
            <button
              onClick={onCreateClick}
              className="flex h-7 items-center justify-center gap-1 rounded-[8px] bg-primary px-2.5 font-inter text-[11.5px] font-medium text-on-accent transition-colors hover:bg-primary-hover"
            >
              <Plus size={12} strokeWidth={2.2} />
              Crear
            </button>
          )}
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
            <Search size={13} strokeWidth={1.6} className="text-text-secondary" />
          </div>
          <input
            type="text"
            className="block w-full rounded-[10px] border border-border bg-bg py-1.5 pl-8 pr-3 font-inter text-[12.5px] text-text-primary outline-none placeholder:text-text-secondary focus:border-primary/50 focus:bg-surface"
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
            <FileText size={32} strokeWidth={1.4} className="mb-2 text-text-secondary/50" />
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
