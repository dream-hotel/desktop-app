import { useCallback, useEffect, useMemo, useState } from "react";
import WikiSidebar from "../components/wiki/WikiSidebar";
import ArticleList from "../components/wiki/ArticleList";
import ArticleViewer from "../components/wiki/ArticleViewer";
import ArticleFullView from "../components/wiki/ArticleFullView";
import ArticleEditor from "../components/wiki/ArticleEditor";
import CategoryFormModal from "../components/wiki/CategoryFormModal";
import ConfirmDialog from "../components/wiki/ConfirmDialog";
import DashboardHeader from "../components/layout/DashboardHeader";
import { useAuth } from "../hooks/useAuth";
import { useAnnouncementBell, requestNavigate } from "../hooks/useAnnouncementBell";
import * as wikiService from "../service/wikiService";
import {
  WikiArticleDetail,
  WikiArticleSummary,
  WikiCategoryNode,
} from "../types/models/Wiki";

type EditorState =
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; article: WikiArticleDetail };

type CategoryDialog =
  | { kind: "createRoot" }
  | { kind: "createChild"; parent: WikiCategoryNode }
  | { kind: "edit"; category: WikiCategoryNode };

type ConfirmState =
  | { kind: "deleteCategory"; category: WikiCategoryNode }
  | { kind: "deleteArticle"; article: WikiArticleSummary };

function buildBreadcrumb(
  tree: WikiCategoryNode[],
  categoryId: number | null,
): string[] {
  if (categoryId == null) return [];
  const path: string[] = [];
  const findPath = (nodes: WikiCategoryNode[]): boolean => {
    for (const node of nodes) {
      path.push(node.name);
      if (node.id === categoryId) return true;
      if (findPath(node.children)) return true;
      path.pop();
    }
    return false;
  };
  findPath(tree);
  return path;
}

interface WikiPageProps {
  pendingSelectedId?: number | null;
  onConsumeSelection?: () => void;
}

export default function WikiPage({
  pendingSelectedId,
  onConsumeSelection,
}: WikiPageProps = {}) {
  const { user } = useAuth();
  const bell = useAnnouncementBell();
  const [showNotifications, setShowNotifications] = useState(false);
  const isAdmin = user?.role === "administrador";

  const [tree, setTree] = useState<WikiCategoryNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);

  const [articles, setArticles] = useState<WikiArticleSummary[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [allArticles, setAllArticles] = useState<WikiArticleSummary[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<WikiArticleDetail | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [fullView, setFullView] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [editorState, setEditorState] = useState<EditorState>({ mode: "list" });
  const [categoryDialog, setCategoryDialog] = useState<CategoryDialog | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);


  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const newTree = await wikiService.getCategoriesTree();
      setTree(newTree);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Error al cargar carpetas.");
    } finally {
      setTreeLoading(false);
    }
  }, []);

  const loadArticles = useCallback(async () => {
    setArticlesLoading(true);
    try {
      const params: Parameters<typeof wikiService.findArticles>[0] = { limit: 50 };
      if (selectedCategoryId != null) params.categoryId = selectedCategoryId;
      if (debouncedSearch.trim().length > 0) params.search = debouncedSearch.trim();
      const res = await wikiService.findArticles(params);
      setArticles(res.data);
      setTotalArticles(res.meta.total);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Error al cargar artículos.");
    } finally {
      setArticlesLoading(false);
    }
  }, [selectedCategoryId, debouncedSearch]);

  const loadAllArticles = useCallback(async () => {
    try {
      const res = await wikiService.findArticles({ limit: 500 });
      setAllArticles(res.data);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Error al cargar artículos.");
    }
  }, []);

  useEffect(() => {
    loadTree();
    loadAllArticles();
  }, [loadTree, loadAllArticles]);

  useEffect(() => {
    if (pendingSelectedId != null) {
      setSelectedCategoryId(null);
      setSearchQuery("");
      setSelectedArticleId(pendingSelectedId);
      onConsumeSelection?.();
    }
  }, [pendingSelectedId, onConsumeSelection]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Load full article when selection changes
  useEffect(() => {
    if (selectedArticleId == null) {
      setSelectedArticle(null);
      return;
    }
    let cancelled = false;
    setArticleLoading(true);
    wikiService
      .getArticle(selectedArticleId)
      .then((detail) => {
        if (!cancelled) setSelectedArticle(detail);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSelectedArticle(null);
          setGlobalError(err instanceof Error ? err.message : "Error al cargar el artículo.");
        }
      })
      .finally(() => {
        if (!cancelled) setArticleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedArticleId]);

  // If the selected article disappears from the list (after deletion), clear it
  useEffect(() => {
    if (
      selectedArticleId != null &&
      articles.length > 0 &&
      !articles.some((a) => a.id === selectedArticleId)
    ) {
      setSelectedArticleId(null);
    }
  }, [articles, selectedArticleId]);

  // Exit full-view when the selected article is cleared
  useEffect(() => {
    if (selectedArticleId == null && fullView) setFullView(false);
  }, [selectedArticleId, fullView]);

  const breadcrumb = useMemo(
    () => buildBreadcrumb(tree, selectedArticle?.categoryId ?? selectedCategoryId),
    [tree, selectedArticle, selectedCategoryId],
  );

  // === Category handlers ===

  const handleCreateCategorySubmit = async (payload: {
    name: string;
    parentId: number | null;
  }) => {
    await wikiService.createCategory({
      name: payload.name,
      parentId: payload.parentId,
    });
    setCategoryDialog(null);
    await loadTree();
  };

  const handleEditCategorySubmit = async (payload: {
    name: string;
    parentId: number | null;
  }) => {
    if (categoryDialog?.kind !== "edit") return;
    await wikiService.updateCategory(categoryDialog.category.id, {
      name: payload.name,
      parentId: payload.parentId,
    });
    setCategoryDialog(null);
    await loadTree();
  };

  const handleDeleteCategory = async () => {
    if (confirmState?.kind !== "deleteCategory") return;
    setConfirmError(null);
    setConfirmLoading(true);
    try {
      await wikiService.deleteCategory(confirmState.category.id);
      if (selectedCategoryId === confirmState.category.id) {
        setSelectedCategoryId(null);
      }
      setConfirmState(null);
      await Promise.all([loadTree(), loadArticles()]);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "No se pudo eliminar la carpeta.");
    } finally {
      setConfirmLoading(false);
    }
  };

  // === Article handlers ===

  const handleEdit = () => {
    if (!selectedArticle) return;
    setEditorState({ mode: "edit", article: selectedArticle });
  };

  const handleCreate = () => {
    setEditorState({ mode: "create" });
  };

  const handleEditorSaved = async (article: WikiArticleDetail) => {
    setEditorState({ mode: "list" });
    setSelectedArticleId(article.id);
    setSelectedArticle(article);
    await Promise.all([loadArticles(), loadAllArticles()]);
  };

  const handleDeleteArticleConfirm = async () => {
    if (confirmState?.kind !== "deleteArticle") return;
    setConfirmError(null);
    setConfirmLoading(true);
    try {
      await wikiService.deleteArticle(confirmState.article.id);
      if (selectedArticleId === confirmState.article.id) {
        setSelectedArticleId(null);
        setSelectedArticle(null);
      }
      setConfirmState(null);
      await Promise.all([loadArticles(), loadAllArticles()]);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "No se pudo eliminar el artículo.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedArticle || selectedArticle.status === "published") return;
    setPublishing(true);
    try {
      const updated = await wikiService.publishArticle(selectedArticle.id);
      setSelectedArticle(updated);
      await Promise.all([loadArticles(), loadAllArticles()]);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "No se pudo publicar el artículo.");
    } finally {
      setPublishing(false);
    }
  };

  // Editor full-screen takeover (within the WikiPage container, so StatusBar stays visible)
  if (editorState.mode !== "list") {
    return (
      <ArticleEditor
        user={user!}
        tree={tree}
        article={editorState.mode === "edit" ? editorState.article : null}
        onCancel={() => setEditorState({ mode: "list" })}
        onSaved={handleEditorSaved}
      />
    );
  }

  // Full-view takeover (distraction-free reader)
  if (fullView && selectedArticle && !articleLoading) {
    return (
      <ArticleFullView
        article={selectedArticle}
        isAdmin={isAdmin}
        breadcrumb={breadcrumb}
        publishing={publishing}
        onClose={() => setFullView(false)}
        onEditClick={() => {
          setFullView(false);
          handleEdit();
        }}
        onDeleteClick={() => {
          const summary =
            articles.find((a) => a.id === selectedArticle.id) ??
            allArticles.find((a) => a.id === selectedArticle.id);
          if (summary) setConfirmState({ kind: "deleteArticle", article: summary });
        }}
        onPublishClick={handlePublish}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg">
      <DashboardHeader
        user={user!}
        announcements={bell.announcements}
        bellLoading={bell.loading}
        unreadCount={bell.unreadCount}
        isUnread={bell.isUnread}
        showNotifications={showNotifications}
        onToggleNotifications={() => setShowNotifications((v) => !v)}
        onCloseNotifications={() => setShowNotifications(false)}
        onAnnouncementClick={(id) => {
          bell.markSeen(id);
          setShowNotifications(false);
          requestNavigate({ section: "anuncios", announcementId: id });
        }}
        onMarkAllSeen={bell.markAllSeen}
        customTitle="Wiki institucional"
      />

      {globalError && (
        <div className="mx-8 mt-3 flex items-center justify-between rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-2 font-inter text-[12px] text-danger">
          <span>{globalError}</span>
          <button
            onClick={() => setGlobalError(null)}
            className="text-danger/70 hover:text-danger"
            aria-label="Cerrar mensaje"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {treeLoading ? (
          <div className="flex h-full w-[260px] items-center justify-center border-r border-border bg-surface font-inter text-[12px] text-text-secondary">
            Cargando carpetas...
          </div>
        ) : (
          <WikiSidebar
            tree={tree}
            articles={allArticles}
            selectedCategoryId={selectedCategoryId}
            selectedArticleId={selectedArticleId}
            isAdmin={isAdmin}
            onSelectCategory={(id) => {
              setSelectedCategoryId(id);
              setSelectedArticleId(null);
            }}
            onSelectArticle={(id) => {
              setSelectedArticleId(id);
              const a = allArticles.find((x) => x.id === id);
              if (a) setSelectedCategoryId(a.categoryId ?? null);
            }}
            onCreateRoot={() => setCategoryDialog({ kind: "createRoot" })}
            onCreateChild={(parent) =>
              setCategoryDialog({ kind: "createChild", parent })
            }
            onEditCategory={(category) =>
              setCategoryDialog({ kind: "edit", category })
            }
            onDeleteCategory={(category) =>
              setConfirmState({ kind: "deleteCategory", category })
            }
          />
        )}

        <ArticleList
          articles={articles}
          selectedArticleId={selectedArticleId}
          loading={articlesLoading}
          isAdmin={isAdmin}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectArticle={setSelectedArticleId}
          onCreateClick={handleCreate}
          totalCount={totalArticles}
        />

        <ArticleViewer
          article={selectedArticle}
          loading={articleLoading}
          isAdmin={isAdmin}
          breadcrumb={breadcrumb}
          onExpandClick={() => setFullView(true)}
          onEditClick={handleEdit}
          onDeleteClick={() => {
            const summary =
              articles.find((a) => a.id === selectedArticle?.id) ??
              allArticles.find((a) => a.id === selectedArticle?.id);
            if (summary) setConfirmState({ kind: "deleteArticle", article: summary });
          }}
          onPublishClick={handlePublish}
          publishing={publishing}
        />
      </div>

      {categoryDialog?.kind === "createRoot" && (
        <CategoryFormModal
          mode="create"
          flatCategories={tree}
          onCancel={() => setCategoryDialog(null)}
          onSubmit={handleCreateCategorySubmit}
        />
      )}

      {categoryDialog?.kind === "createChild" && (
        <CategoryFormModal
          mode="create"
          parentId={categoryDialog.parent.id}
          parentName={categoryDialog.parent.name}
          flatCategories={tree}
          onCancel={() => setCategoryDialog(null)}
          onSubmit={handleCreateCategorySubmit}
        />
      )}

      {categoryDialog?.kind === "edit" && (
        <CategoryFormModal
          mode="edit"
          initialName={categoryDialog.category.name}
          parentId={categoryDialog.category.parentId}
          flatCategories={tree}
          onCancel={() => setCategoryDialog(null)}
          onSubmit={handleEditCategorySubmit}
        />
      )}

      {confirmState?.kind === "deleteCategory" && (
        <ConfirmDialog
          title="Eliminar carpeta"
          message={`¿Estás seguro de eliminar “${confirmState.category.name}”? Las subcarpetas también se eliminarán (soft delete).`}
          confirmLabel="Eliminar"
          tone="danger"
          loading={confirmLoading}
          error={confirmError}
          onCancel={() => {
            setConfirmState(null);
            setConfirmError(null);
          }}
          onConfirm={handleDeleteCategory}
        />
      )}

      {confirmState?.kind === "deleteArticle" && (
        <ConfirmDialog
          title="Eliminar artículo"
          message={`¿Estás seguro de eliminar “${confirmState.article.title}”? Esta acción es un soft delete.`}
          confirmLabel="Eliminar"
          tone="danger"
          loading={confirmLoading}
          error={confirmError}
          onCancel={() => {
            setConfirmState(null);
            setConfirmError(null);
          }}
          onConfirm={handleDeleteArticleConfirm}
        />
      )}
    </div>
  );
}
