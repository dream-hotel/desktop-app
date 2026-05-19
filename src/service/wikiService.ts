import { apiClient } from "./apiClient";
import { PaginatedResponse } from "../types/api";
import {
  BackendArticle,
  BackendCategory,
  WikiArticle,
  WikiDirectory,
} from "../types/models/Wiki";

const MONTHS_SHORT_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return `${MONTHS_SHORT_EN[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function extractDescription(htmlContent: string): string {
  const plainText = htmlContent.replace(/<[^>]+>/g, "");
  return plainText.length > 100 ? `${plainText.substring(0, 100)}...` : plainText;
}

function mapBackendArticle(article: BackendArticle): WikiArticle {
  return {
    id: article.id.toString(),
    categoryId: article.category.id.toString(),
    title: article.title,
    description: extractDescription(article.content),
    author: article.user.fullName,
    date: formatDate(article.createdAt),
    views: 0,
    content: article.content,
    isRestricted: !article.isPublic,
  };
}

export async function getDirectories(): Promise<WikiDirectory[]> {
  const flatCategories = await apiClient.get<BackendCategory[]>("/wiki/categories");

  return flatCategories
    .filter((c) => c.parentId === null)
    .map((directory) => ({
      id: directory.id.toString(),
      name: directory.name,
      categories: flatCategories
        .filter((c) => c.parentId === directory.id)
        .map((c) => ({
          id: c.id.toString(),
          name: c.name,
          articleCount: 0,
        })),
    }));
}

export async function getArticles(
  categoryId?: string,
  search?: string,
): Promise<PaginatedResponse<WikiArticle>> {
  const response = await apiClient.get<PaginatedResponse<BackendArticle>>("/wiki/articles", {
    query: { limit: 50, categoryId, search },
  });

  return {
    data: response.data.map(mapBackendArticle),
    meta: response.meta,
  };
}

export async function getArticlesByCategory(categoryId: string): Promise<WikiArticle[]> {
  const result = await getArticles(categoryId);
  return result.data;
}

export async function searchArticles(query: string): Promise<WikiArticle[]> {
  const result = await getArticles(undefined, query);
  return result.data;
}

interface ArticlePayload {
  title: string;
  content: string;
  categoryId: number;
  isPublic: boolean;
}

export function createArticle(data: ArticlePayload): Promise<BackendArticle> {
  return apiClient.post("/wiki/articles", data);
}

export function updateArticle(id: number, data: Partial<ArticlePayload>): Promise<BackendArticle> {
  return apiClient.patch(`/wiki/articles/${id}`, data);
}

export function deleteArticle(id: number): Promise<void> {
  return apiClient.delete(`/wiki/articles/${id}`);
}

export function publishArticle(id: number): Promise<BackendArticle> {
  return apiClient.post(`/wiki/articles/${id}/publish`);
}
