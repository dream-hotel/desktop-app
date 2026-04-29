import { useState, useEffect, useMemo } from "react";
import WikiSidebar from "../components/wiki/WikiSidebar";
import ArticleList from "../components/wiki/ArticleList";
import ArticleViewer from "../components/wiki/ArticleViewer";
import ArticleEditorModal from "../components/wiki/ArticleEditorModal";
import { WikiDirectory, WikiArticle } from "../types/models/Wiki";
import * as wikiService from "../service/wikiService";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { useAuth } from "../hooks/useAuth";
import { useDashboard } from "../hooks/useDashboard";

export default function WikiPage() {
  const { user } = useAuth();
  const { data: dashboardData } = useDashboard();

  const [directories, setDirectories] = useState<WikiDirectory[]>([]);
  const [articles, setArticles] = useState<WikiArticle[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");

  const loadDirectories = async () => {
    const dirs = await wikiService.getDirectories();
    setDirectories(dirs);
    if (!selectedCategoryId) {
      for (const dir of dirs) {
        if (dir.categories.length > 0) {
          setSelectedCategoryId(dir.categories[0].id);
          break;
        }
      }
    }
  };

  const loadArticles = async () => {
    if (searchQuery.trim().length > 0) {
      const data = await wikiService.searchArticles(searchQuery);
      setArticles(data);
    } else if (selectedCategoryId) {
      const data = await wikiService.getArticlesByCategory(selectedCategoryId);
      setArticles(data);
    }
  };

  useEffect(() => {
    loadDirectories();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [selectedCategoryId, searchQuery]);

  const selectedArticle = useMemo(() => {
    return articles.find((a) => a.id === selectedArticleId) || null;
  }, [articles, selectedArticleId]);

  const { categoryName, directoryName } = useMemo(() => {
    let catName = "";
    let dirName = "";
    if (selectedCategoryId) {
      for (const dir of directories) {
        const cat = dir.categories.find((c) => c.id === selectedCategoryId);
        if (cat) {
          catName = cat.name;
          dirName = dir.name;
          break;
        }
      }
    }

    if (searchQuery && selectedArticle) {
      for (const dir of directories) {
        const cat = dir.categories.find((c) => c.id === selectedArticle.categoryId);
        if (cat) {
          catName = cat.name;
          dirName = dir.name;
          break;
        }
      }
    }
    return { categoryName: catName, directoryName: dirName };
  }, [directories, selectedCategoryId, selectedArticle, searchQuery]);

  const pendingNotifications = dashboardData?.notifications.filter(n => n.status === "pendiente") || [];

  const handleCreateArticle = () => {
    setEditorMode("create");
    setIsEditorOpen(true);
  };

  const handleEditArticle = () => {
    setEditorMode("edit");
    setIsEditorOpen(true);
  };

  const handleSaveSuccess = () => {
    setIsEditorOpen(false);
    loadArticles(); // Reload to show the changes
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg">
      <DashboardHeader
        user={user!}
        notificationCount={pendingNotifications.length}
        notifications={dashboardData?.notifications || []}
        showNotifications={false}
        onToggleNotifications={() => { }}
        onCloseNotifications={() => { }}
        customTitle="Gestión de artículos"
      />

      <div className="flex flex-1 overflow-hidden">
        <WikiSidebar
          directories={directories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(id) => {
            setSelectedCategoryId(id);
            setSearchQuery("");
          }}
        />

        <ArticleList
          articles={articles}
          selectedArticleId={selectedArticleId}
          onSelectArticle={setSelectedArticleId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateClick={handleCreateArticle}
        />

        <ArticleViewer
          article={selectedArticle}
          categoryName={categoryName}
          directoryName={directoryName}
          onEditClick={handleEditArticle}
        />
      </div>

      {isEditorOpen && (
        <ArticleEditorModal
          user={user!}
          directories={directories}
          article={editorMode === "edit" ? selectedArticle : null}
          onClose={() => setIsEditorOpen(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}
