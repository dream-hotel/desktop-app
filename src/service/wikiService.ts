import { 
  WikiDirectory, 
  WikiArticle, 
  BackendCategory, 
  BackendArticle, 
  PaginatedResponse 
} from "../types/models/Wiki";

const API_URL = "http://localhost:3000/api";

// ==========================================
// TOGGLE DE DATOS: true = Mocks, false = Backend Real
// ==========================================
const USE_MOCK = true;

// --- MOCK DATA ---
export const MOCK_DIRECTORIES: WikiDirectory[] = [
  {
    id: "1",
    name: "Protocols",
    categories: [
      { id: "101", name: "Guest Services", articleCount: 4 },
      { id: "102", name: "Safety", articleCount: 3 },
      { id: "103", name: "Compliance", articleCount: 2 },
    ],
  },
  {
    id: "2",
    name: "Emergency",
    categories: [],
  },
  {
    id: "3",
    name: "Manuals",
    categories: [
      { id: "104", name: "Housekeeping", articleCount: 5 },
      { id: "105", name: "F&B", articleCount: 4 },
      { id: "106", name: "Front Desk", articleCount: 3 },
      { id: "107", name: "Spa", articleCount: 2 },
    ],
  },
  {
    id: "4",
    name: "Administration",
    categories: [],
  },
];

export const MOCK_ARTICLES: WikiArticle[] = [
  {
    id: "1001",
    categoryId: "104", // Housekeeping
    title: "Normas de Tarifario actual",
    description: "Completa paso a paso el procedimiento de evacuación para cada una de las zonas de construcción.",
    author: "María P.",
    date: "Mar 15, 2026",
    views: 142,
    content: "<p>Contenido de Normas de Tarifario...</p>",
  },
  {
    id: "1002",
    categoryId: "104",
    title: "Protocolo de bienvenida de huésped VIP",
    description: "Procedimiento estándar para la recepción de huéspedes de nivel VIP, incluyendo la colocación de amenidades y el informe al personal.",
    author: "Elizabeth M.",
    date: "Mar 12, 2026",
    views: 89,
    content: "<p>Contenido de Protocolo VIP...</p>",
  },
  {
    id: "1003",
    categoryId: "104",
    title: "Procesamiento de nómina — Confidencial",
    description: "Guías y cronogramas internos de procesamiento de nómina. Restringido a roles de administración.",
    author: "Alan M.",
    date: "Mar 10, 2026",
    views: 12,
    content: "<p>Contenido confidencial de nómina...</p>",
    isRestricted: true,
  },
  {
    id: "1004",
    categoryId: "104",
    title: "Manual de Estándares de Housekeeping",
    description: "Estándares integrales de limpieza y presentación para todo tipo de habitaciones.",
    author: "María P.",
    date: "Mar 8, 2026",
    views: 234,
    content: `<h3>Tipos de Habitación y Asignación de Tiempo</h3>
<ul>
  <li>Habitación Estándar: 35 minutos</li>
  <li>Suite Deluxe: 50 minutos</li>
  <li>Suite Presidencial: 75 minutos</li>
</ul>
<h3>Quality Checklist</h3>
<ul>
  <li>Superficies: Todas las superficies libres de polvo.</li>
  <li>Ropa de cama: Doblado tipo "hospital" (esquinas a 45°), sin arrugas visibles.</li>
</ul>`,
  },
  {
    id: "1005",
    categoryId: "104",
    title: "Estándares de Servicio de Vinos",
    description: "Técnicas adecuadas de servicio de vinos, guías de temperatura y recomendaciones de maridaje.",
    author: "Carlos T.",
    date: "Mar 17, 2026",
    views: 45,
    content: "<p>Contenido de servicio de vinos...</p>",
  },
];

// --- FUNCIONES AUXILIARES ---

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function extractDescription(htmlContent: string): string {
  // Strip HTML tags and get first 100 chars
  const plainText = htmlContent.replace(/<[^>]+>/g, "");
  return plainText.length > 100 ? plainText.substring(0, 100) + "..." : plainText;
}

// --- SERVICIOS ---

export async function getDirectories(): Promise<WikiDirectory[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_DIRECTORIES;
  }

  const response = await fetch(`${API_URL}/wiki/categories`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Error fetching categories");

  const flatCategories: BackendCategory[] = await response.json();
  
  // Mapear de lista plana a árbol
  const directories: WikiDirectory[] = flatCategories
    .filter((c) => c.parentId === null)
    .map((d) => ({
      id: d.id.toString(),
      name: d.name,
      categories: flatCategories
        .filter((c) => c.parentId === d.id)
        .map((c) => ({
          id: c.id.toString(),
          name: c.name,
          articleCount: 0, // El backend no devuelve el conteo aquí, lo dejamos en 0 o podríamos iterar si los artículos vinieran.
        })),
    }));

  return directories;
}

export async function getArticles(categoryId?: string, search?: string): Promise<PaginatedResponse<WikiArticle>> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    let filtered = [...MOCK_ARTICLES];
    
    if (categoryId) {
      filtered = filtered.filter((a) => a.categoryId === categoryId);
    }
    
    if (search) {
      const lowerQuery = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.description.toLowerCase().includes(lowerQuery)
      );
    }

    return {
      data: filtered,
      meta: { page: 1, limit: 50, pages: 1, total: filtered.length }
    };
  }

  // Llamada Real
  const queryParams = new URLSearchParams({ limit: "50" });
  if (categoryId) queryParams.append("categoryId", categoryId);
  if (search) queryParams.append("search", search);

  const response = await fetch(`${API_URL}/wiki/articles?${queryParams.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error("Error fetching articles");

  const rawData: PaginatedResponse<BackendArticle> = await response.json();

  const mappedArticles: WikiArticle[] = rawData.data.map((backendArt) => ({
    id: backendArt.id.toString(),
    categoryId: backendArt.category.id.toString(),
    title: backendArt.title,
    description: extractDescription(backendArt.content),
    author: backendArt.user.fullName,
    date: formatDate(backendArt.createdAt),
    views: 0, // Backend no devuelve vistas
    content: backendArt.content,
    isRestricted: !backendArt.isPublic,
  }));

  return {
    data: mappedArticles,
    meta: rawData.meta,
  };
}

// Para retrocompatibilidad temporal con WikiPage.tsx
export async function getArticlesByCategory(categoryId: string): Promise<WikiArticle[]> {
  const result = await getArticles(categoryId, undefined);
  return result.data;
}

export async function searchArticles(query: string): Promise<WikiArticle[]> {
  const result = await getArticles(undefined, query);
  return result.data;
}

// --- CRUD ENDPOINTS (Preparados para futuras UI) ---

export async function createArticle(data: { title: string; content: string; categoryId: number; isPublic: boolean }) {
  const response = await fetch(`${API_URL}/wiki/articles`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error creating article");
  return response.json();
}

export async function updateArticle(id: number, data: Partial<{ title: string; content: string; categoryId: number; isPublic: boolean }>) {
  const response = await fetch(`${API_URL}/wiki/articles/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error updating article");
  return response.json();
}

export async function deleteArticle(id: number) {
  const response = await fetch(`${API_URL}/wiki/articles/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Error deleting article");
}

export async function publishArticle(id: number) {
  const response = await fetch(`${API_URL}/wiki/articles/${id}/publish`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Error publishing article");
}
