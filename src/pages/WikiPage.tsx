import { useCallback, useEffect, useMemo, useState } from "react";
import WikiSidebar from "../components/wiki/WikiSidebar";
import ArticleList from "../components/wiki/ArticleList";
import ArticleViewer from "../components/wiki/ArticleViewer";
import ArticleFullView from "../components/wiki/ArticleFullView";
import ArticleEditor from "../components/wiki/ArticleEditor";
import CategoryFormModal from "../components/wiki/CategoryFormModal";
import ArticleRenameModal from "../components/wiki/ArticleRenameModal";
import ArticleTypeModal from "../components/wiki/ArticleTypeModal";
import ArticleFileUploadModal from "../components/wiki/ArticleFileUploadModal";
import ConfirmDialog from "../components/wiki/ConfirmDialog";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";
import { usePolling } from "../hooks/usePolling";
import { notifyAnnouncementsChanged } from "../hooks/useAnnouncementBell";
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

type CreationFlow = 
  | { kind: "selection" }
  | { kind: "upload" };

type ArticleDialog =
  | { kind: "rename"; article: WikiArticleSummary }
  | { kind: "attachFile"; article: WikiArticleSummary };

type ConfirmState =
  | { kind: "deleteCategory"; category: WikiCategoryNode }
  | { kind: "deleteArticle"; article: WikiArticleSummary }
  | { kind: "replaceWithFile"; article: WikiArticleSummary; file: File; newTitle: string };

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
  const { has } = usePermissions();
  const isAdmin = has("wiki:write") || has("wiki:delete");

  const [tree, setTree] = useState<WikiCategoryNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);

  const [articles, setArticles] = useState<WikiArticleSummary[]>([]);
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
  const [creationFlow, setCreationFlow] = useState<CreationFlow | null>(null);
  const [categoryDialog, setCategoryDialog] = useState<CategoryDialog | null>(null);
  const [articleDialog, setArticleDialog] = useState<ArticleDialog | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);


  const loadTree = useCallback(async (silent = false) => {
    if (!silent) setTreeLoading(true);
    try {
      const newTree = await wikiService.getCategoriesTree();
      setTree(newTree);
    } catch (err) {
      if (!silent) setGlobalError(err instanceof Error ? err.message : "Error al cargar carpetas.");
    } finally {
      if (!silent) setTreeLoading(false);
    }
  }, []);

  const loadArticles = useCallback(async (silent = false) => {
    if (selectedCategoryId === null) {
      let data = [...allArticles];
      if (debouncedSearch.trim().length > 0) {
        const s = debouncedSearch.trim().toLowerCase();
        data = data.filter(a => 
          a.title.toLowerCase().includes(s) || 
          (a.categoryName && a.categoryName.toLowerCase().includes(s))
        );
      }
      const categoryIdsInTree = new Set<number>();
      const collectIds = (nodes: WikiCategoryNode[]) => {
        nodes.forEach((n) => {
          categoryIdsInTree.add(n.id);
          collectIds(n.children);
        });
      };
      collectIds(tree);
      data = data.filter(a => !a.categoryId || !categoryIdsInTree.has(a.categoryId));
      setArticles(data);
      return;
    }

    if (!silent) setArticlesLoading(true);
    try {
      const params: Parameters<typeof wikiService.findArticles>[0] = {
        limit: 50,
        categoryId: selectedCategoryId
      };
      if (debouncedSearch.trim().length > 0) params.search = debouncedSearch.trim();
      const res = await wikiService.findArticles(params);
      setArticles(res.data);
    } catch (err) {
      if (!silent) setGlobalError(err instanceof Error ? err.message : "Error al cargar artículos.");
    } finally {
      if (!silent) setArticlesLoading(false);
    }
  }, [selectedCategoryId, debouncedSearch, tree, allArticles]);

  const loadAllArticles = useCallback(async (silent = false) => {
    try {
      const res = await wikiService.findArticles({ limit: 500 });
      setAllArticles(res.data);
    } catch (err) {
      if (!silent) setGlobalError(err instanceof Error ? err.message : "Error al cargar artículos.");
    }
  }, []);

  useEffect(() => {
    loadTree();
    loadAllArticles();
  }, [loadTree, loadAllArticles]);

  usePolling(() => {
    loadTree(true);
    loadAllArticles(true);
    loadArticles(true);
  });

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

  useEffect(() => {
    if (
      selectedArticleId != null &&
      articles.length > 0 &&
      !articles.some((a) => a.id === selectedArticleId)
    ) {
      setSelectedArticleId(null);
    }
  }, [articles, selectedArticleId]);

  useEffect(() => {
    if (selectedArticleId == null && fullView) setFullView(false);
  }, [selectedArticleId, fullView]);

  const breadcrumb = useMemo(
    () => buildBreadcrumb(tree, selectedArticle?.categoryId ?? selectedCategoryId),
    [tree, selectedArticle, selectedCategoryId],
  );

  // === Article Sidebar Handlers ===

  const handleRenameArticle = async (newTitle: string) => {
    if (articleDialog?.kind !== "rename") return;
    try {
      await wikiService.updateArticle(articleDialog.article.id, { title: newTitle });
      setArticleDialog(null);
      await Promise.all([loadArticles(), loadAllArticles()]);
      if (selectedArticleId === articleDialog.article.id) {
        const detail = await wikiService.getArticle(articleDialog.article.id);
        setSelectedArticle(detail);
      }
    } catch (err) {
      throw err;
    }
  };

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
    setCreationFlow({ kind: "selection" });
  };

  const handleFileUpload = async (file: File, title: string) => {
    try {
      const article = await wikiService.createArticle({
        title,
        categoryId: selectedCategoryId,
        isPublic: true
      });
      await wikiService.setArticleFile(article.id, file);
      setCreationFlow(null);
      await Promise.all([loadArticles(), loadAllArticles()]);
      setSelectedArticleId(article.id);
      notifyAnnouncementsChanged();
    } catch (err) {
      throw err;
    }
  };

  const handleAttachFileToExisting = async (file: File, title: string) => {
    if (articleDialog?.kind !== "attachFile") return;
    const article = articleDialog.article;
    setArticleDialog(null);
    setConfirmState({ kind: "replaceWithFile", article, file, newTitle: title });
  };

  const handleConfirmReplaceWithFile = async () => {
    if (confirmState?.kind !== "replaceWithFile") return;
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      const { article, file, newTitle } = confirmState;
      // Actualizamos el título por si se cambió en el modal de subida
      await wikiService.updateArticle(article.id, { title: newTitle });
      // Subimos el archivo
      await wikiService.setArticleFile(article.id, file);
      
      setConfirmState(null);
      await Promise.all([loadArticles(), loadAllArticles()]);
      // Forzamos recarga del detalle
      if (selectedArticleId === article.id) {
        const detail = await wikiService.getArticle(article.id);
        setSelectedArticle(detail);
      }
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "No se pudo adjuntar el archivo.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleEditorSaved = async (article: WikiArticleDetail) => {
    setEditorState({ mode: "list" });
    setSelectedArticleId(article.id);
    setSelectedArticle(article);
    await Promise.all([loadArticles(), loadAllArticles()]);
    notifyAnnouncementsChanged();
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
      notifyAnnouncementsChanged();
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
      notifyAnnouncementsChanged();
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "No se pudo publicar el artículo.");
    } finally {
      setPublishing(false);
    }
  };

  if (editorState.mode !== "list") {
    return (
      <ArticleEditor
        user={user!}
        tree={tree}
        article={editorState.mode === "edit" ? editorState.article : null}
        defaultCategoryId={selectedCategoryId}
        onCancel={() => setEditorState({ mode: "list" })}
        onSaved={handleEditorSaved}
      />
    );
  }

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-bg">

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
            isAdmin={isAdmin}
            onSelectCategory={(id) => {
              setSelectedCategoryId(id);
              setSelectedArticleId(null);
            }}
            onSelectArticle={(id) => {
              setSelectedArticleId(id);
              const a = allArticles.find((x) => x.id === id);
              if (!a) return;
              const categoryIdsInTree = new Set<number>();
              const collectIds = (nodes: WikiCategoryNode[]) => {
                nodes.forEach((n) => {
                  categoryIdsInTree.add(n.id);
                  collectIds(n.children);
                });
              };
              collectIds(tree);
              const isOrphan = a.categoryId && !categoryIdsInTree.has(a.categoryId);
              if (!a.categoryId || isOrphan) {
                setSelectedCategoryId(null);
              } else {
                setSelectedCategoryId(a.categoryId);
              }
            }}
            onEditArticle={(article) => setArticleDialog({ kind: "rename", article })}
            onDeleteArticle={(article) => setConfirmState({ kind: "deleteArticle", article })}
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
          onUploadClick={() => {
            const summary =
              articles.find((a) => a.id === selectedArticle?.id) ??
              allArticles.find((a) => a.id === selectedArticle?.id);
            if (summary) setArticleDialog({ kind: "attachFile", article: summary });
          }}
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
          currentId={categoryDialog.category.id}
          initialName={categoryDialog.category.name}
          parentId={categoryDialog.category.parentId}
          flatCategories={tree}
          onCancel={() => setCategoryDialog(null)}
          onSubmit={handleEditCategorySubmit}
        />
      )}

      {articleDialog?.kind === "rename" && (
        <ArticleRenameModal
          initialTitle={articleDialog.article.title}
          onCancel={() => setArticleDialog(null)}
          onSubmit={handleRenameArticle}
        />
      )}

      {articleDialog?.kind === "attachFile" && (
        <ArticleFileUploadModal
          initialTitle={articleDialog.article.title}
          onCancel={() => setArticleDialog(null)}
          onSubmit={handleAttachFileToExisting}
        />
      )}

      {creationFlow?.kind === "selection" && (
        <ArticleTypeModal
          onCancel={() => setCreationFlow(null)}
          onSelectWrite={() => {
            setCreationFlow(null);
            setEditorState({ mode: "create" });
          }}
          onSelectUpload={() => setCreationFlow({ kind: "upload" })}
        />
      )}

      {creationFlow?.kind === "upload" && (
        <ArticleFileUploadModal
          onCancel={() => setCreationFlow(null)}
          onSubmit={handleFileUpload}
        />
      )}

      {confirmState?.kind === "deleteCategory" && (
        <ConfirmDialog
          title="Eliminar carpeta"
          message={`¿Estás seguro de eliminar “${confirmState.category.name}”? Todos los artículos y subcarpetas que contiene también se eliminarán.`}
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
          message={`¿Estás seguro de eliminar “${confirmState.article.title}”? Esta acción no se puede deshacer.`}
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

      {confirmState?.kind === "replaceWithFile" && (
        <ConfirmDialog
          title="Reemplazar contenido"
          message={`¿Estás seguro de adjuntar este archivo? Todo el contenido actual del artículo será reemplazado por el documento subido.`}
          confirmLabel="Confirmar y Subir"
          tone="warning"
          loading={confirmLoading}
          error={confirmError}
          onCancel={() => {
            setConfirmState(null);
            setConfirmError(null);
          }}
          onConfirm={handleConfirmReplaceWithFile}
        />
      )}
    </div>
  );
}
