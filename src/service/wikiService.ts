import { apiClient } from "./apiClient";
import { PaginatedResponse } from "../types/api";
import {
  BackendArticle,
  BackendArticleList,
  BackendCategory,
  WikiArticleDetail,
  WikiArticleSummary,
  WikiCategoryNode,
} from "../types/models/Wiki";

// === Mapping helpers ===

function authorName(user: BackendArticleList["user"]): string {
  return [user.fullName, user.lastName].filter(Boolean).join(" ").trim();
}

function mapArticleListItem(a: BackendArticleList): WikiArticleSummary {
  return {
    id: a.id,
    title: a.title,
    status: a.status,
    categoryId: a.category?.id ?? null,
    categoryName: a.category?.name ?? null,
    authorName: authorName(a.user),
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function mapArticleDetail(a: BackendArticle): WikiArticleDetail {
  return {
    ...mapArticleListItem(a),
    contentMarkdown: a.content?.contentMarkdown ?? "",
    // Backend output DTO does not expose isPublic; default to true (public)
    // and let the editor override on save.
    isPublic: true,
  };
}

export function buildCategoryTree(flat: BackendCategory[]): WikiCategoryNode[] {
  const byId = new Map<number, WikiCategoryNode>();
  flat.forEach((c) => {
    byId.set(c.id, {
      id: c.id,
      parentId: c.parentId,
      name: c.name,
      children: [],
      articleCount: 0,
    });
  });
  const roots: WikiCategoryNode[] = [];
  byId.forEach((node) => {
    if (node.parentId === null) {
      roots.push(node);
    } else {
      const parent = byId.get(node.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  });
  const sortRec = (nodes: WikiCategoryNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

// === Categories ===

export async function getCategoriesTree(): Promise<WikiCategoryNode[]> {
  const response = await apiClient.get<PaginatedResponse<BackendCategory> | BackendCategory[]>(
    "/wiki/categories",
    { query: { limit: 500 } },
  );
  const flat = Array.isArray(response) ? response : response.data;
  return buildCategoryTree(flat);
}

export interface CategoryPayload {
  name: string;
  parentId?: number | null;
}

export function createCategory(payload: CategoryPayload): Promise<BackendCategory> {
  return apiClient.post<BackendCategory>("/wiki/categories", {
    name: payload.name,
    ...(payload.parentId != null ? { parentId: payload.parentId } : {}),
  });
}

export function updateCategory(id: number, payload: Partial<CategoryPayload>): Promise<BackendCategory> {
  return apiClient.patch<BackendCategory>(`/wiki/categories/${id}`, payload);
}

export function deleteCategory(id: number): Promise<void> {
  return apiClient.delete<void>(`/wiki/categories/${id}`);
}

// === Articles ===

export interface FindArticlesParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  status?: "draft" | "published";
}

export async function findArticles(
  params: FindArticlesParams = {},
): Promise<PaginatedResponse<WikiArticleSummary>> {
  const response = await apiClient.get<PaginatedResponse<BackendArticleList>>("/wiki/articles", {
    query: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search,
      categoryId: params.categoryId,
      status: params.status,
    },
  });
  return {
    data: response.data.map(mapArticleListItem),
    meta: response.meta,
  };
}

export async function getArticle(id: number): Promise<WikiArticleDetail> {
  const article = await apiClient.get<BackendArticle>(`/wiki/articles/${id}`);
  return mapArticleDetail(article);
}

export interface ArticleInputPayload {
  title: string;
  content: string;
  categoryId?: number | null;
  isPublic?: boolean;
}

export async function createArticle(payload: ArticleInputPayload): Promise<WikiArticleDetail> {
  const body: Record<string, unknown> = {
    title: payload.title,
    content: payload.content,
  };
  if (payload.categoryId != null) body.categoryId = payload.categoryId;
  if (payload.isPublic !== undefined) body.isPublic = payload.isPublic;
  const created = await apiClient.post<BackendArticle>("/wiki/articles", body);
  return mapArticleDetail(created);
}

export async function updateArticle(
  id: number,
  payload: Partial<ArticleInputPayload>,
): Promise<WikiArticleDetail> {
  const body: Record<string, unknown> = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.content !== undefined) body.content = payload.content;
  if (payload.categoryId !== undefined && payload.categoryId !== null) {
    body.categoryId = payload.categoryId;
  }
  if (payload.isPublic !== undefined) body.isPublic = payload.isPublic;
  const updated = await apiClient.patch<BackendArticle>(`/wiki/articles/${id}`, body);
  return mapArticleDetail(updated);
}

export async function publishArticle(id: number): Promise<WikiArticleDetail> {
  const published = await apiClient.post<BackendArticle>(`/wiki/articles/${id}/publish`);
  return mapArticleDetail(published);
}

export function deleteArticle(id: number): Promise<void> {
  return apiClient.delete<void>(`/wiki/articles/${id}`);
}
