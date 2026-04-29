import { useState } from "react";
import { WikiDirectory } from "../../types/models/Wiki";

interface WikiSidebarProps {
  directories: WikiDirectory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
}

export default function WikiSidebar({ directories, selectedCategoryId, onSelectCategory }: WikiSidebarProps) {
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    directories.forEach((d) => (initial[d.id] = true));
    return initial;
  });

  const toggleDir = (id: string) => {
    setExpandedDirs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-full w-[260px] flex-col border-r border-border bg-white">
      <div className="flex items-center gap-2 border-b border-border px-5 py-5">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-teal">
          <path d="M4 3h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 3v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="font-alexandria text-[18px] font-medium text-text-primary">Directorio Base</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-2">
          {directories.map((dir) => (
            <div key={dir.id} className="flex flex-col">
              <button
                onClick={() => toggleDir(dir.id)}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={`text-text-secondary transition-transform ${expandedDirs[dir.id] ? "rotate-90" : ""}`}
                  >
                    <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-warning">
                    <path d="M2 4a2 2 0 012-2h3l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                  <span className="font-inter text-[14px] font-medium text-text-primary">{dir.name}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-text-secondary">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              {expandedDirs[dir.id] && dir.categories.length > 0 && (
                <div className="ml-6 mt-1 flex flex-col gap-1">
                  {dir.categories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => onSelectCategory(cat.id)}
                        className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors ${isSelected ? "bg-teal/10 text-teal" : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-70">
                            <path d="M3 2h8a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5 5h4M5 8h4M5 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span className={`font-inter text-[13px] ${isSelected ? "font-medium" : "font-normal"}`}>
                            {cat.name}
                          </span>
                        </div>
                        {cat.articleCount > 0 && (
                          <span className="flex h-5 items-center justify-center rounded bg-orange-50 px-1.5 text-[11px] font-medium text-orange-600">
                            {cat.articleCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <button className="mt-4 flex items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-gray-50">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-text-secondary">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="font-inter text-[14px] font-medium text-text-primary">Crear Directorio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
