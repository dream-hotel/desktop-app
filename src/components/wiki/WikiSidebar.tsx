import { useEffect, useMemo, useState } from "react";
import {
  WikiArticleSummary,
  WikiCategoryNode,
} from "../../types/models/Wiki";

interface WikiSidebarProps {
  tree: WikiCategoryNode[];
  articles: WikiArticleSummary[];
  selectedCategoryId: number | null;
  selectedArticleId: number | null;
  isAdmin: boolean;
  onSelectCategory: (id: number | null) => void;
  onSelectArticle: (id: number) => void;
  onCreateRoot: () => void;
  onCreateChild: (parent: WikiCategoryNode) => void;
  onEditCategory: (category: WikiCategoryNode) => void;
  onDeleteCategory: (category: WikiCategoryNode) => void;
}

interface NodeRowProps {
  node: WikiCategoryNode;
  depth: number;
  expanded: Set<number>;
  articlesByCategory: Map<number, WikiArticleSummary[]>;
  selectedCategoryId: number | null;
  selectedArticleId: number | null;
  isAdmin: boolean;
  onToggle: (id: number) => void;
  onSelect: (id: number) => void;
  onSelectArticle: (id: number) => void;
  onCreateChild: (parent: WikiCategoryNode) => void;
  onEdit: (category: WikiCategoryNode) => void;
  onDelete: (category: WikiCategoryNode) => void;
}

function ArticleLeaf({
  article,
  depth,
  selected,
  onSelect,
}: {
  article: WikiArticleSummary;
  depth: number;
  selected: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <button
      onClick={() => onSelect(article.id)}
      className={`group/article flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors ${
        selected
          ? "bg-primary/10 text-primary"
          : "text-text-secondary hover:bg-primary/5 hover:text-text-primary"
      }`}
      style={{ paddingLeft: `${depth * 16 + 26}px` }}
      title={article.title}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0"
      >
        <path
          d="M4 2h6l3 3v9H4z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <span
        className={`truncate font-inter text-[12px] ${
          selected ? "font-medium" : "font-normal"
        }`}
      >
        {article.title}
      </span>
      {article.status === "draft" && (
        <span
          aria-label="Borrador"
          className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
        />
      )}
    </button>
  );
}

function NodeRow({
  node,
  depth,
  expanded,
  articlesByCategory,
  selectedCategoryId,
  selectedArticleId,
  isAdmin,
  onToggle,
  onSelect,
  onSelectArticle,
  onCreateChild,
  onEdit,
  onDelete,
}: NodeRowProps) {
  const hasChildren = node.children.length > 0;
  const articles = articlesByCategory.get(node.id) ?? [];
  const hasArticles = articles.length > 0;
  const isExpandable = hasChildren || hasArticles;
  const isOpen = expanded.has(node.id);
  const isSelected = selectedCategoryId === node.id;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <div
        className={`group flex items-center justify-between rounded-md px-1.5 py-1 text-left transition-colors ${
          isSelected ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-primary/5"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          onClick={() => {
            if (isExpandable) onToggle(node.id);
            onSelect(node.id);
          }}
          className="flex flex-1 items-center gap-2 overflow-hidden text-left"
        >
          {isExpandable ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`shrink-0 text-text-secondary transition-transform ${
                isOpen ? "rotate-90" : ""
              }`}
            >
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="inline-block w-3 shrink-0" />
          )}

          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            className={`shrink-0 ${isSelected ? "text-primary" : "text-text-secondary"}`}
          >
            <path
              d="M2 4a2 2 0 012-2h3l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V4z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>

          <span
            className={`truncate font-inter text-[12.5px] ${
              isSelected ? "font-medium text-primary" : "font-normal"
            }`}
          >
            {node.name}
          </span>

          {hasArticles && !isOpen && (
            <span className="ml-auto shrink-0 rounded-full bg-bg px-1.5 py-0.5 font-inter text-[10px] font-medium text-text-secondary">
              {articles.length}
            </span>
          )}
        </button>

        {isAdmin && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="flex h-6 w-6 items-center justify-center rounded text-text-secondary opacity-0 transition-opacity hover:bg-border hover:text-text-primary group-hover:opacity-100"
              aria-label="Acciones de carpeta"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="3" cy="7" r="1" fill="currentColor" />
                <circle cx="7" cy="7" r="1" fill="currentColor" />
                <circle cx="11" cy="7" r="1" fill="currentColor" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <button
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-7 z-20 flex w-44 flex-col rounded-[10px] border border-border bg-surface py-1 shadow-[0px_12px_30px_rgba(0,0,0,0.12)]">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onCreateChild(node);
                    }}
                    className="px-3 py-1.5 text-left font-inter text-[12px] text-text-primary hover:bg-primary/5"
                  >
                    Nueva subcarpeta
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(node);
                    }}
                    className="px-3 py-1.5 text-left font-inter text-[12px] text-text-primary hover:bg-primary/5"
                  >
                    Renombrar
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(node);
                    }}
                    className="px-3 py-1.5 text-left font-inter text-[12px] text-danger hover:bg-danger/5"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {isExpandable && isOpen && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <NodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              articlesByCategory={articlesByCategory}
              selectedCategoryId={selectedCategoryId}
              selectedArticleId={selectedArticleId}
              isAdmin={isAdmin}
              onToggle={onToggle}
              onSelect={onSelect}
              onSelectArticle={onSelectArticle}
              onCreateChild={onCreateChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {articles.map((article) => (
            <ArticleLeaf
              key={article.id}
              article={article}
              depth={depth + 1}
              selected={selectedArticleId === article.id}
              onSelect={onSelectArticle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function WikiSidebar({
  tree,
  articles,
  selectedCategoryId,
  selectedArticleId,
  isAdmin,
  onSelectCategory,
  onSelectArticle,
  onCreateRoot,
  onCreateChild,
  onEditCategory,
  onDeleteCategory,
}: WikiSidebarProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const articlesByCategory = useMemo(() => {
    const map = new Map<number, WikiArticleSummary[]>();
    for (const a of articles) {
      if (a.categoryId == null) continue;
      const list = map.get(a.categoryId);
      if (list) list.push(a);
      else map.set(a.categoryId, [a]);
    }
    map.forEach((list) => list.sort((x, y) => x.title.localeCompare(y.title)));
    return map;
  }, [articles]);

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      tree.forEach((root) => next.add(root.id));
      return next;
    });
  }, [tree]);

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex h-full w-[260px] flex-col border-r border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-primary">
            <path
              d="M4 3h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M6 3v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="font-alexandria text-[14px] font-medium text-text-primary">
            Directorio
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
            selectedCategoryId === null
              ? "bg-primary/10 text-primary"
              : "text-text-primary hover:bg-primary/5"
          }`}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12v9H2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M2 7h12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="font-inter text-[12.5px] font-medium">Todos los artículos</span>
        </button>

        {tree.length === 0 ? (
          <p className="px-2 py-4 font-inter text-[12px] text-text-secondary">
            No hay carpetas todavía.
          </p>
        ) : (
          tree.map((root) => (
            <NodeRow
              key={root.id}
              node={root}
              depth={0}
              expanded={expanded}
              articlesByCategory={articlesByCategory}
              selectedCategoryId={selectedCategoryId}
              selectedArticleId={selectedArticleId}
              isAdmin={isAdmin}
              onToggle={toggle}
              onSelect={onSelectCategory}
              onSelectArticle={onSelectArticle}
              onCreateChild={onCreateChild}
              onEdit={onEditCategory}
              onDelete={onDeleteCategory}
            />
          ))
        )}
      </div>

      {isAdmin && (
        <div className="border-t border-border px-3 py-2.5">
          <button
            onClick={onCreateRoot}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 font-inter text-[12px] font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Nueva carpeta
          </button>
        </div>
      )}
    </div>
  );
}
