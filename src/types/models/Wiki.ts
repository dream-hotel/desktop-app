// === Backend DTOs (mirror /backend/src/modules/wiki) ===

export interface BackendCategory {
  id: number;
  parentId: number | null;
  name: string;
  createdAt: string;
}

export interface BackendArticleAuthor {
  id: number;
  fullName: string;
  lastName: string;
}

export interface BackendArticleContent {
  id: number;
  contentMarkdown: string | null;
}

export interface BackendArticleList {
  id: number;
  title: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string | null;
  category: BackendCategory | null;
  user: BackendArticleAuthor;
}

export interface BackendArticle extends BackendArticleList {
  content: BackendArticleContent | null;
}

// === Frontend view models ===

export interface WikiCategoryNode {
  id: number;
  parentId: number | null;
  name: string;
  children: WikiCategoryNode[];
  articleCount: number;
}

export interface WikiArticleSummary {
  id: number;
  title: string;
  status: "draft" | "published";
  categoryId: number | null;
  categoryName: string | null;
  authorName: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface WikiArticleDetail extends WikiArticleSummary {
  contentMarkdown: string;
  isPublic: boolean;
}
