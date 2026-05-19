export interface WikiCategory {
  id: string;
  name: string;
  articleCount: number;
}

export interface WikiDirectory {
  id: string;
  name: string;
  categories: WikiCategory[];
}

export interface WikiArticle {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  author: string;
  date: string;
  views: number;
  content: string;
  isRestricted?: boolean;
}

// --- Backend Interfaces ---

export interface BackendCategory {
  id: number;
  parentId: number | null;
  name: string;
  createdAt: string;
}

export interface BackendArticle {
  id: number;
  title: string;
  content: string;
  isPublic: boolean;
  category: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    fullName: string;
    lastName: string;
  };
  createdAt: string;
}

