import { useState, useMemo } from "react";
import {
  Search,
  X,
  Folder,
  FileText,
  Clock,
  BookOpen,
  SlidersHorizontal,
  ChevronRight,
  Download,
  FileDown,
} from "lucide-react";
import {
  WikiCategoryNode,
  WikiArticleSummary,
} from "../../types/models/Wiki";
import { getFullUrl } from "../../service/apiConfig";

interface ReceptionistWikiViewProps {
  tree: WikiCategoryNode[];
  articles: WikiArticleSummary[];
  articlesLoading: boolean;
  onSelectArticle: (id: number) => void;
}

function getCategoryPath(tree: WikiCategoryNode[], categoryId: number | null): WikiCategoryNode[] {
  if (categoryId == null) return [];
  const path: WikiCategoryNode[] = [];
  const findPath = (nodes: WikiCategoryNode[]): boolean => {
    for (const node of nodes) {
      path.push(node);
      if (node.id === categoryId) return true;
      if (findPath(node.children)) return true;
      path.pop();
    }
    return false;
  };
  findPath(tree);
  return path;
}

function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-warning/20 text-warning font-semibold rounded px-0.5 border border-warning/10">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

function getContentSnippet(contentMarkdown: string | null | undefined, query: string): string {
  if (!contentMarkdown) return "Este artículo no contiene notas de texto adicionales.";
  
  // Strip common markdown syntax
  const cleanText = contentMarkdown
    .replace(/[#*`_\[\]()\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  if (!query.trim()) {
    return cleanText.slice(0, 150) + (cleanText.length > 150 ? "..." : "");
  }
  
  const idx = cleanText.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) {
    return cleanText.slice(0, 150) + (cleanText.length > 150 ? "..." : "");
  }
  
  const start = Math.max(0, idx - 45);
  const end = Math.min(cleanText.length, idx + query.length + 80);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < cleanText.length ? "..." : "";
  return prefix + cleanText.slice(start, end) + suffix;
}

function getFileTypeName(mimetype: string | null): string {
  if (!mimetype) return "Archivo adjunto";
  const m = mimetype.toLowerCase();
  if (m.includes("pdf")) return "Documento PDF";
  if (m.includes("word") || m.includes("msword") || m.includes("officedocument.word")) return "Documento Word";
  if (m.includes("excel") || m.includes("spreadsheet") || m.includes("officedocument.spread")) return "Planilla Excel";
  return "Documento de soporte";
}

function getFileTone(mimetype: string | null): { bg: string; text: string; iconBg: string } {
  if (!mimetype) return { bg: "bg-neutral-soft", text: "text-text-secondary", iconBg: "bg-neutral-mid" };
  const m = mimetype.toLowerCase();
  if (m.includes("pdf")) return { bg: "bg-danger/10", text: "text-danger", iconBg: "bg-danger/15" };
  if (m.includes("word") || m.includes("msword") || m.includes("officedocument.word")) return { bg: "bg-primary/10", text: "text-primary", iconBg: "bg-primary/15" };
  if (m.includes("excel") || m.includes("spreadsheet") || m.includes("officedocument.spread")) return { bg: "bg-success/10", text: "text-success", iconBg: "bg-success/15" };
  return { bg: "bg-info/10", text: "text-info", iconBg: "bg-info/15" };
}

function getRelevanceScore(article: WikiArticleSummary, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const title = article.title.toLowerCase();
  const content = ((article as any).content?.contentMarkdown ?? "").toLowerCase();
  
  let score = 0;
  if (title === q) score += 100;
  else if (title.startsWith(q)) score += 50;
  else if (title.includes(q)) score += 20;
  
  const occurrences = content.split(q).length - 1;
  score += occurrences * 5;
  
  return score;
}

export default function ReceptionistWikiView({
  tree,
  articles,
  articlesLoading,
  onSelectArticle,
}: ReceptionistWikiViewProps) {
  const [localSearch, setLocalSearch] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  
  // Filter panel states
  const [filterType, setFilterType] = useState<"all" | "text" | "file">("all");
  const [filterDate, setFilterDate] = useState<"all" | "7days" | "30days" | "6months">("all");
  const [selectedImportanceIds, setSelectedImportanceIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance");

  // Reset subcategory if main category changes
  const handleMainCategoryClick = (id: number | null) => {
    setSelectedMainCategoryId(id);
    setSelectedSubcategoryId(null);
  };

  // Find dynamic "Importancia" category node to render its child options in sidebar
  const importanceCategoryNode = useMemo(() => {
    const findNode = (nodes: WikiCategoryNode[]): WikiCategoryNode | null => {
      for (const n of nodes) {
        const nameLower = n.name.toLowerCase();
        if (nameLower.includes("importancia") || nameLower.includes("importante")) {
          return n;
        }
        const child = findNode(n.children);
        if (child) return child;
      }
      return null;
    };
    return findNode(tree);
  }, [tree]);

  // Recursively collect all categories under a category to clean up dynamic checks
  const getSubcategoryIds = useMemo(() => {
    const memo = new Map<number, Set<number>>();
    const collect = (node: WikiCategoryNode, set: Set<number>) => {
      set.add(node.id);
      node.children.forEach(c => collect(c, set));
    };
    
    const fillMemo = (nodes: WikiCategoryNode[]) => {
      nodes.forEach(n => {
        const set = new Set<number>();
        collect(n, set);
        memo.set(n.id, set);
        fillMemo(n.children);
      });
    };
    fillMemo(tree);
    return (id: number) => memo.get(id) ?? new Set([id]);
  }, [tree]);

  // Dynamic filter lists
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Filter by category tag hierarchy
    const activeCatId = selectedSubcategoryId ?? selectedMainCategoryId;
    if (activeCatId !== null) {
      const allowedCatIds = getSubcategoryIds(activeCatId);
      result = result.filter(a => a.categoryId !== null && allowedCatIds.has(a.categoryId));
    }

    // Filter by text search query (title + contents)
    if (searchFilter.trim().length > 0) {
      const query = searchFilter.trim().toLowerCase();
      result = result.filter(a => {
        const titleMatch = a.title.toLowerCase().includes(query);
        const contentMatch = ((a as any).content?.contentMarkdown ?? "").toLowerCase().includes(query);
        return titleMatch || contentMatch;
      });
    }

    // Filter by Content Type (text vs support file)
    if (filterType === "text") {
      result = result.filter(a => {
        const content = (a as any).content;
        return content && content.contentMarkdown && !content.fileUrl;
      });
    } else if (filterType === "file") {
      result = result.filter(a => (a as any).content?.fileUrl);
    }

    // Filter by Update Date
    if (filterDate !== "all") {
      const now = Date.now();
      let limitMs = 0;
      if (filterDate === "7days") limitMs = 7 * 24 * 60 * 60 * 1000;
      else if (filterDate === "30days") limitMs = 30 * 24 * 60 * 60 * 1000;
      else if (filterDate === "6months") limitMs = 180 * 24 * 60 * 60 * 1000;

      result = result.filter(a => {
        const date = new Date(a.updatedAt ?? a.createdAt).getTime();
        return now - date <= limitMs;
      });
    }

    // Filter by Importance tags (dynamic folders matching check)
    if (selectedImportanceIds.length > 0) {
      const allowedIds = new Set<number>();
      selectedImportanceIds.forEach(id => {
        getSubcategoryIds(id).forEach(x => allowedIds.add(x));
      });
      result = result.filter(a => a.categoryId !== null && allowedIds.has(a.categoryId));
    }

    // Sort by relevance or date
    if (sortBy === "relevance" && searchFilter.trim().length > 0) {
      result.sort((x, y) => {
        const scoreX = getRelevanceScore(x, searchFilter);
        const scoreY = getRelevanceScore(y, searchFilter);
        if (scoreX !== scoreY) return scoreY - scoreX;
        return new Date(y.updatedAt ?? y.createdAt).getTime() - new Date(x.updatedAt ?? x.createdAt).getTime();
      });
    } else {
      // Default: sort by date desc
      result.sort((x, y) => {
        return new Date(y.updatedAt ?? y.createdAt).getTime() - new Date(x.updatedAt ?? x.createdAt).getTime();
      });
    }

    return result;
  }, [articles, selectedMainCategoryId, selectedSubcategoryId, searchFilter, filterType, filterDate, selectedImportanceIds, sortBy, getSubcategoryIds]);

  const activeMainCategoryNode = useMemo(() => {
    if (selectedMainCategoryId === null) return null;
    const findNode = (nodes: WikiCategoryNode[]): WikiCategoryNode | null => {
      for (const n of nodes) {
        if (n.id === selectedMainCategoryId) return n;
        const child = findNode(n.children);
        if (child) return child;
      }
      return null;
    };
    return findNode(tree);
  }, [tree, selectedMainCategoryId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFilter(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    setSearchFilter("");
  };

  const handleImportanceToggle = (id: number) => {
    setSelectedImportanceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Helper to format date in card
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-8 py-10 bg-bg">
      {/* Banner / Header Area */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto w-full mb-8">
        <h1 className="font-alexandria text-[36px] font-normal leading-[42px] text-text-primary mb-2">
          ¿Qué necesitas encontrar hoy?
        </h1>
        <p className="font-inter text-[14px] text-text-secondary">
          Busca entre toda la información privada de la empresa
        </p>

        {/* Large Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search size={18} strokeWidth={1.8} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar por título o contenido..."
              className="w-full h-[48px] rounded-[12px] border border-border bg-surface pl-11 pr-10 font-inter text-[14px] text-text-primary placeholder:text-text-secondary outline-none shadow-sm focus:border-primary/50 transition-colors"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full hover:bg-neutral-soft text-text-secondary"
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="h-[48px] px-6 rounded-[12px] bg-primary font-inter text-[14px] font-medium text-white hover:bg-primary-hover shadow-sm transition-colors cursor-pointer"
          >
            Buscar
          </button>
        </form>
        <span className="mt-2.5 font-inter text-[11px] text-text-secondary">
          La búsqueda incluye el contenido y los títulos de los documentos
        </span>
      </div>

      {/* Main categories tag list */}
      <div className="flex flex-col gap-2 max-w-4xl mx-auto w-full mb-8 items-center border-b border-border pb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => handleMainCategoryClick(null)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-inter text-[12.5px] font-medium transition-all cursor-pointer ${
              selectedMainCategoryId === null
                ? "bg-primary text-white shadow-sm"
                : "bg-surface border border-border text-text-secondary hover:bg-neutral-soft"
            }`}
          >
            <BookOpen size={13} strokeWidth={1.8} />
            Todo
          </button>
          
          {tree.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleMainCategoryClick(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-inter text-[12.5px] font-medium transition-all cursor-pointer ${
                selectedMainCategoryId === cat.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface border border-border text-text-secondary hover:bg-neutral-soft"
              }`}
            >
              <Folder size={13} strokeWidth={1.8} />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dynamic subcategory tag list */}
        {activeMainCategoryNode && activeMainCategoryNode.children.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 justify-center bg-surface/50 border border-border/60 rounded-xl p-2.5 max-w-2xl">
            <span className="font-inter text-[11px] font-semibold text-text-secondary self-center mr-1.5 uppercase tracking-wider">
              Subcarpetas:
            </span>
            {activeMainCategoryNode.children.map(subcat => (
              <button
                key={subcat.id}
                onClick={() => setSelectedSubcategoryId(
                  selectedSubcategoryId === subcat.id ? null : subcat.id
                )}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-inter text-[11.5px] font-medium transition-all cursor-pointer ${
                  selectedSubcategoryId === subcat.id
                    ? "bg-primary-light text-primary border border-primary/20"
                    : "bg-surface border border-border text-text-secondary hover:bg-neutral-soft"
                }`}
              >
                <Folder size={11} strokeWidth={1.8} />
                {subcat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Primary Split View Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full items-start">
        {/* Results column */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="font-inter text-[13px] text-text-secondary font-medium">
              {searchFilter
                ? `Se encontraron ${filteredArticles.length} resultados para "${searchFilter}"`
                : `Se encontraron ${filteredArticles.length} artículos`}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-inter text-[12px] text-text-secondary">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-inter text-[12.5px] font-semibold text-text-primary outline-none border-none cursor-pointer"
              >
                <option value="relevance">Relevancia</option>
                <option value="date">Más recientes</option>
              </select>
            </div>
          </div>

          {/* Articles list */}
          <div className="flex flex-col gap-3">
            {articlesLoading ? (
              <div className="text-center py-20 bg-surface rounded-2xl border border-border font-inter text-[13px] text-text-secondary">
                Buscando información de soporte...
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-border flex flex-col items-center justify-center p-6">
                <FileText size={40} className="text-text-secondary/40 mb-3" />
                <h3 className="font-inter text-[14px] font-medium text-text-primary">No se encontraron artículos</h3>
                <p className="font-inter text-[12.5px] text-text-secondary mt-1">
                  Prueba cambiando los filtros o la frase de búsqueda.
                </p>
              </div>
            ) : (
              filteredArticles.map(art => {
                const isFile = (art as any).content?.fileUrl;
                const fileMimetype = (art as any).content?.fileMimetype ?? (art as any).content?.mimetype;
                const fileTypeTone = getFileTone(fileMimetype);
                
                // Get the breadcrumbs for path
                const catPath = getCategoryPath(tree, art.categoryId);
                
                return (
                  <div
                    key={art.id}
                    onClick={() => onSelectArticle(art.id)}
                    className="group flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-border bg-surface hover:shadow-md transition-all text-left cursor-pointer"
                  >
                    {/* Content Icon Display Box */}
                    <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${
                      isFile ? fileTypeTone.bg : "bg-primary/5"
                    }`}>
                      {isFile ? (
                        <FileDown className={`w-6 h-6 ${fileTypeTone.text}`} strokeWidth={1.8} />
                      ) : (
                        <FileText className="w-6 h-6 text-primary" strokeWidth={1.8} />
                      )}
                    </div>

                    {/* Metadata Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-1.5 font-inter text-[11px] text-text-secondary mb-1">
                        {catPath.length > 0 ? (
                          catPath.map((node, i) => (
                            <span key={node.id} className="flex items-center gap-1.5">
                              {i > 0 && <ChevronRight size={10} className="text-text-secondary/50" />}
                              <span className="font-medium text-text-secondary hover:text-primary transition-colors">
                                {node.name}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span>General</span>
                        )}
                      </div>

                      <h3 className="font-inter text-[15px] font-semibold leading-snug text-text-primary group-hover:text-primary transition-colors">
                        <HighlightedText text={art.title} highlight={searchFilter} />
                      </h3>

                      <p className="mt-2 font-inter text-[12.5px] leading-relaxed text-text-secondary line-clamp-2">
                        <HighlightedText
                          text={getContentSnippet((art as any).content?.contentMarkdown, searchFilter)}
                          highlight={searchFilter}
                        />
                      </p>

                      <div className="flex items-center gap-3 mt-3.5 font-inter text-[11px] text-text-secondary">
                        <span className="truncate">Por {art.authorName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          Actualizado: {formatDate(art.updatedAt ?? art.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Supports / Attachments Block */}
                    {isFile && (
                      <div className="sm:self-center shrink-0 flex flex-col items-end gap-1 font-inter border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${fileTypeTone.bg} ${fileTypeTone.text}`}>
                          {getFileTypeName(fileMimetype)}
                        </span>
                        <a
                          href={getFullUrl((art as any).content?.fileUrl)}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[11.5px] font-medium text-primary hover:underline mt-1"
                        >
                          <Download size={12} />
                          Ver archivo
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar Filters */}
        <div className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-border pb-3">
            <SlidersHorizontal size={14} className="text-primary" />
            <h3 className="font-alexandria text-[13px] font-normal text-text-primary">
              Filtrar resultados
            </h3>
          </div>

          {/* Section: CONTENT TYPE */}
          <div className="flex flex-col gap-2">
            <h4 className="font-inter text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              Tipo de contenido
            </h4>
            <div className="flex flex-col gap-1.5 mt-1 font-inter text-[12.5px] text-text-body">
              <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
                <input
                  type="radio"
                  name="contentType"
                  checked={filterType === "all"}
                  onChange={() => setFilterType("all")}
                  className="accent-primary cursor-pointer"
                />
                Todos
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
                <input
                  type="radio"
                  name="contentType"
                  checked={filterType === "text"}
                  onChange={() => setFilterType("text")}
                  className="accent-primary cursor-pointer"
                />
                Notas de texto
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
                <input
                  type="radio"
                  name="contentType"
                  checked={filterType === "file"}
                  onChange={() => setFilterType("file")}
                  className="accent-primary cursor-pointer"
                />
                Archivos adjuntos
              </label>
            </div>
          </div>

          {/* Section: DATE LIMIT */}
          <div className="flex flex-col gap-2 mt-4 border-t border-border pt-4">
            <h4 className="font-inter text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              Fecha de actualización
            </h4>
            <div className="flex flex-col gap-1.5 mt-1 font-inter text-[12.5px] text-text-body">
              <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
                <input
                  type="radio"
                  name="dateFilter"
                  checked={filterDate === "all"}
                  onChange={() => setFilterDate("all")}
                  className="accent-primary cursor-pointer"
                />
                Cualquier fecha
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
                <input
                  type="radio"
                  name="dateFilter"
                  checked={filterDate === "7days"}
                  onChange={() => setFilterDate("7days")}
                  className="accent-primary cursor-pointer"
                />
                Últimos 7 días
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
                <input
                  type="radio"
                  name="dateFilter"
                  checked={filterDate === "30days"}
                  onChange={() => setFilterDate("30days")}
                  className="accent-primary cursor-pointer"
                />
                Últimos 30 días
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
                <input
                  type="radio"
                  name="dateFilter"
                  checked={filterDate === "6months"}
                  onChange={() => setFilterDate("6months")}
                  className="accent-primary cursor-pointer"
                />
                Últimos 6 meses
              </label>
            </div>
          </div>

          {/* Section: IMPORTANCE (Dynamic) */}
          {importanceCategoryNode && importanceCategoryNode.children.length > 0 && (
            <div className="flex flex-col gap-2 mt-4 border-t border-border pt-4">
              <h4 className="font-inter text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Importancia
              </h4>
              <div className="flex flex-col gap-1.5 mt-1 font-inter text-[12.5px] text-text-body">
                {importanceCategoryNode.children.map(child => (
                  <label key={child.id} className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
                    <input
                      type="checkbox"
                      checked={selectedImportanceIds.includes(child.id)}
                      onChange={() => handleImportanceToggle(child.id)}
                      className="rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    {child.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
