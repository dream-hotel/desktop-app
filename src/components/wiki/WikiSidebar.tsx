import { useEffect, useMemo, useState, memo } from "react";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Folder,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import {
  WikiArticleSummary,
  WikiCategoryNode,
} from "../../types/models/Wiki";

interface WikiSidebarProps {
  tree: WikiCategoryNode[];
  articles: WikiArticleSummary[];
  selectedCategoryId: number | null;
  isAdmin: boolean;
  onSelectCategory: (id: number | null) => void;
  onSelectArticle: (id: number) => void;
  onEditArticle: (article: WikiArticleSummary) => void;
  onDeleteArticle: (article: WikiArticleSummary) => void;
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
  isAdmin: boolean;
  onToggle: (id: number) => void;
  onSelect: (id: number) => void;
  onSelectArticle: (id: number) => void;
  onEditArticle: (article: WikiArticleSummary) => void;
  onDeleteArticle: (article: WikiArticleSummary) => void;
  onCreateChild: (parent: WikiCategoryNode) => void;
  onEdit: (category: WikiCategoryNode) => void;
  onDelete: (category: WikiCategoryNode) => void;
}

const ArticleLeaf = memo(function ArticleLeaf({
  article,
  depth,
  isAdmin,
  onSelect,
  onEdit,
  onDelete,
}: {
  article: WikiArticleSummary;
  depth: number;
  isAdmin: boolean;
  onSelect: (id: number) => void;
  onEdit: (article: WikiArticleSummary) => void;
  onDelete: (article: WikiArticleSummary) => void;
}) {
  const isDraft = article.status === "draft";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <div
        className={`group/article flex items-center justify-between rounded-md px-1.5 py-1 text-left transition-colors ${
          isDraft
            ? "bg-warning/10 text-warning hover:bg-warning/20"
            : "text-text-secondary hover:bg-primary/5 hover:text-text-primary"
        }`}
        style={{ paddingLeft: `${depth * 16 + 26}px` }}
      >
        <button
          onClick={() => onSelect(article.id)}
          className="flex flex-1 items-center gap-2 overflow-hidden text-left"
          title={article.title}
        >
          <FileText size={12} strokeWidth={1.6} className="shrink-0" />
          <span
            className={`truncate font-inter text-[12px] ${
              isDraft ? "font-medium" : "font-normal"
            }`}
          >
            {article.title}
          </span>
        </button>

        {isAdmin && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="flex h-6 w-6 items-center justify-center rounded text-text-secondary opacity-0 transition-opacity hover:bg-border hover:text-text-primary group-hover/article:opacity-100"
              aria-label="Acciones de artículo"
            >
              <MoreHorizontal size={14} strokeWidth={2} />
            </button>

            {menuOpen && (
              <>
                <button
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-7 z-20 flex w-44 flex-col rounded-[10px] border border-border bg-surface py-1 shadow-[0px_12_30px_rgba(0,0,0,0.12)]">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(article);
                    }}
                    className="px-3 py-1.5 text-left font-inter text-[12px] text-text-primary hover:bg-primary/5"
                  >
                    Renombrar
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(article);
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
    </div>
  );
});

const NodeRow = memo(function NodeRow({
  node,
  depth,
  expanded,
  articlesByCategory,
  selectedCategoryId,
  isAdmin,
  onToggle,
  onSelect,
  onSelectArticle,
  onEditArticle,
  onDeleteArticle,
  onCreateChild,
  onEdit,
  onDelete,
}: NodeRowProps) {
  const hasChildren = node.children.length > 0;
  const articles = articlesByCategory.get(node.id) ?? [];
  const hasArticles = articles.length > 0;
  const isExpandable = hasChildren || hasArticles;
  const isOpen = expanded.has(node.id);
  const isSelected = selectedCategoryId !== null && Number(selectedCategoryId) === Number(node.id);
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
          onClick={(e) => {
            e.stopPropagation();
            if (isExpandable) onToggle(node.id);
            onSelect(node.id);
          }}
          className="flex flex-1 items-center gap-2 overflow-hidden text-left"
        >
          {isExpandable ? (
            <ChevronRight
              size={12}
              strokeWidth={1.8}
              className={`shrink-0 text-text-secondary transition-transform ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          ) : (
            <span className="inline-block w-3 shrink-0" />
          )}

          <Folder
            size={15}
            strokeWidth={1.6}
            className={`shrink-0 ${isSelected ? "text-primary" : "text-text-secondary"}`}
          />

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
              <MoreHorizontal size={14} strokeWidth={2} />
            </button>

            {menuOpen && (
              <>
                <button
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-7 z-20 flex w-44 flex-col rounded-[10px] border border-border bg-surface py-1 shadow-[0px_12_30px_rgba(0,0,0,0.12)]">
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
              isAdmin={isAdmin}
              onToggle={onToggle}
              onSelect={onSelect}
              onSelectArticle={onSelectArticle}
              onEditArticle={onEditArticle}
              onDeleteArticle={onDeleteArticle}
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
              isAdmin={isAdmin}
              onSelect={onSelectArticle}
              onEdit={onEditArticle}
              onDelete={onDeleteArticle}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default function WikiSidebar({
  tree,
  articles,
  selectedCategoryId,
  isAdmin,
  onSelectCategory,
  onSelectArticle,
  onEditArticle,
  onDeleteArticle,
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

  const uncategorizedArticles = useMemo(() => {
    const categoryIdsInTree = new Set<number>();
    const collectIds = (nodes: WikiCategoryNode[]) => {
      nodes.forEach((n) => {
        categoryIdsInTree.add(n.id);
        collectIds(n.children);
      });
    };
    collectIds(tree);

    return articles
      .filter((a) => {
        return (
          a.categoryId === null ||
          a.categoryId === undefined ||
          a.categoryId === 0 ||
          !categoryIdsInTree.has(a.categoryId)
        );
      })
      .sort((x, y) => x.title.localeCompare(y.title));
  }, [articles, tree]);

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
          <BookOpen size={17} strokeWidth={1.7} className="text-primary" />
          <h2 className="font-alexandria text-[14px] font-medium text-text-primary">
            Directorio
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {uncategorizedArticles.map((article) => (
          <ArticleLeaf
            key={article.id}
            article={article}
            depth={0}
            isAdmin={isAdmin}
            onSelect={onSelectArticle}
            onEdit={onEditArticle}
            onDelete={onDeleteArticle}
          />
        ))}

        {tree.map((root) => (
          <NodeRow
            key={root.id}
            node={root}
            depth={0}
            expanded={expanded}
            articlesByCategory={articlesByCategory}
            selectedCategoryId={selectedCategoryId}
            isAdmin={isAdmin}
            onToggle={toggle}
            onSelect={onSelectCategory}
            onSelectArticle={onSelectArticle}
            onEditArticle={onEditArticle}
            onDeleteArticle={onDeleteArticle}
            onCreateChild={onCreateChild}
            onEdit={onEditCategory}
            onDelete={onDeleteCategory}
          />
        ))}

        {tree.length === 0 && uncategorizedArticles.length === 0 && (
          <p className="px-2 py-4 font-inter text-[12px] text-text-secondary">
            No hay contenido todavía.
          </p>
        )}
      </div>

      {isAdmin && (
        <div className="border-t border-border px-3 py-2.5">
          <button
            onClick={onCreateRoot}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 font-inter text-[12px] font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Plus size={12} strokeWidth={1.9} />
            Nueva carpeta
          </button>
        </div>
      )}
    </div>
  );
}
