import { useState, useRef, useEffect } from "react";
import { WikiArticle, WikiDirectory } from "../../types/models/Wiki";
import { User } from "../../types/response/AuthResponse";
import * as wikiService from "../../service/wikiService";

interface ArticleEditorModalProps {
  user: User;
  directories: WikiDirectory[];
  article: WikiArticle | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function ArticleEditorModal({
  user,
  directories,
  article,
  onClose,
  onSaveSuccess,
}: ArticleEditorModalProps) {
  const isEditMode = !!article;
  
  const [title, setTitle] = useState(article?.title || "");
  const [content, setContent] = useState(article?.content || "");
  const [categoryId, setCategoryId] = useState(article?.categoryId || "");
  const [isPublic, setIsPublic] = useState(article ? !article.isRestricted : true);
  
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Tag input state (visual only as requested)
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Initialize editor content only once
  useEffect(() => {
    if (editorRef.current && isEditMode && article) {
      editorRef.current.innerHTML = article.content;
    }
  }, [isEditMode, article]);

  const handleCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("El título es obligatorio");
      return;
    }
    if (!categoryId) {
      alert("Debes seleccionar una categoría");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && article) {
        // En backend real el categoryId es número, pero en nuestro modelo es string.
        // Hacemos cast o parsing según sea necesario, aquí lo paso directo al servicio.
        await wikiService.updateArticle(Number(article.id), {
          title,
          content,
          categoryId: Number(categoryId),
          isPublic,
        });
      } else {
        await wikiService.createArticle({
          title,
          content,
          categoryId: Number(categoryId),
          isPublic,
        });
      }
      onSaveSuccess();
    } catch (error) {
      alert("Error al guardar el artículo");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* Top Bar */}
      <header className="flex h-[72px] items-center justify-between border-b border-border bg-white px-8">
        <div className="flex flex-col">
          <h1 className="font-alexandria text-[24px] font-medium leading-tight text-text-primary">
            Wiki Institucional
          </h1>
          <span className="font-inter text-[12px] text-text-secondary">
            Editor de Artículos Técnicos
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex h-10 items-center justify-center rounded-[10px] bg-warning px-6 font-alegreya-sc text-[16px] font-medium text-white transition-transform active:scale-95 disabled:opacity-70"
          >
            {isSaving ? "Guardando..." : "Guardar Artículo"}
          </button>
          
          <button onClick={onClose} className="text-[13px] text-text-secondary hover:underline">
            Cancelar
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user.fullName.charAt(0)}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        
        {/* Left Column (Editor) */}
        <div className="flex flex-1 flex-col rounded-[16px] bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col p-6 h-full">
            <label className="font-inter text-[14px] font-semibold text-text-primary mb-2">
              Título del Artículo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ingrese el título del protocolo o manual..."
              className="w-full rounded-md border border-border px-4 py-3 font-inter text-[14px] outline-none placeholder:text-text-secondary/60 focus:border-primary/50"
            />

            <label className="font-inter text-[14px] font-semibold text-text-primary mt-6 mb-2">
              Contenido
            </label>
            
            <div className="flex flex-1 flex-col rounded-md border border-border overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-1 border-b border-border bg-primary/5 px-2 py-2">
                <button 
                  onMouseDown={(e) => { e.preventDefault(); handleCommand("formatBlock", "H3"); }} 
                  className="px-3 py-1 font-inter text-[13px] text-text-primary hover:bg-black/5 rounded"
                >
                  Normal ▼
                </button>
                <div className="h-4 w-px bg-border mx-1"></div>
                <button onMouseDown={(e) => { e.preventDefault(); handleCommand("bold"); }} className="w-8 h-8 flex items-center justify-center font-bold hover:bg-black/5 rounded text-text-primary">B</button>
                <button onMouseDown={(e) => { e.preventDefault(); handleCommand("italic"); }} className="w-8 h-8 flex items-center justify-center italic hover:bg-black/5 rounded text-text-primary">I</button>
                <button onMouseDown={(e) => { e.preventDefault(); handleCommand("underline"); }} className="w-8 h-8 flex items-center justify-center underline hover:bg-black/5 rounded text-text-primary">U</button>
                <button onMouseDown={(e) => { e.preventDefault(); handleCommand("strikeThrough"); }} className="w-8 h-8 flex items-center justify-center line-through hover:bg-black/5 rounded text-text-primary">S</button>
                <div className="h-4 w-px bg-border mx-1"></div>
                <button onMouseDown={(e) => { e.preventDefault(); handleCommand("justifyLeft"); }} className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded text-text-primary">≡</button>
                <button onMouseDown={(e) => { e.preventDefault(); handleCommand("justifyCenter"); }} className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded text-text-primary">=</button>
                <div className="h-4 w-px bg-border mx-1"></div>
                <button onMouseDown={(e) => { e.preventDefault(); handleCommand("insertUnorderedList"); }} className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded text-text-primary">•=</button>
              </div>
              
              {/* Content Editable */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                className="prose prose-sm prose-gray max-w-none flex-1 overflow-y-auto p-4 font-inter text-[14px] text-text-body outline-none"
                style={{ minHeight: "200px" }}
              />
              
              {/* Footer of Editor */}
              <div className="flex items-center justify-between border-t border-border px-4 py-2 font-inter text-[11px] text-text-secondary">
                <span>{content.replace(/<[^>]*>/g, "").length} caracteres</span>
                <span>Última modificación: Hoy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Settings) */}
        <div className="flex w-[320px] flex-col gap-6">
          <div className="rounded-[16px] bg-white p-6 shadow-sm">
            <h2 className="font-inter text-[16px] font-bold text-text-primary mb-6">Configuración</h2>
            
            <div className="flex flex-col gap-5">
              <div>
                <label className="font-inter text-[13px] font-semibold text-text-primary mb-2 block">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary/50"
                >
                  <option value="" disabled>Seleccione una categoría</option>
                  {directories.map(dir => (
                    <optgroup key={dir.id} label={dir.name}>
                      {dir.categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-inter text-[13px] font-semibold text-text-primary mb-2 block">Etiquetas de Búsqueda</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    placeholder="Añadir etiqueta..."
                    className="flex-1 rounded-md border border-border px-3 py-2 font-inter text-[13px] outline-none placeholder:text-text-secondary/60 focus:border-primary/50"
                  />
                  <button onClick={addTag} className="flex h-[38px] w-[38px] items-center justify-center rounded-md bg-primary text-white">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-[11px] text-text-primary">
                        {tag}
                        <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-text-secondary hover:text-danger">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1 font-inter text-[10px] text-text-secondary">Las etiquetas mejoran la indexación y búsqueda</p>
              </div>

              <div className="flex items-center justify-between rounded-[8px] border border-border p-4">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={isPublic ? "text-success" : "text-danger"}>
                    <path d="M4 8V6a5 5 0 0110 0v2M4 8h10M4 8v7a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="flex flex-col">
                    <span className="font-inter text-[13px] font-semibold text-text-primary">Público</span>
                    <span className="font-inter text-[11px] text-text-secondary">
                      {isPublic ? "Visible para todos" : "Confidencial"}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${isPublic ? "bg-warning" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${isPublic ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[16px] bg-white p-6 shadow-sm">
            <h2 className="font-inter text-[14px] font-bold text-text-primary mb-4">Metadatos</h2>
            <div className="flex flex-col gap-3 font-inter text-[12px]">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-secondary">Autor:</span>
                <span className="font-semibold text-text-primary">{article ? article.author : user.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-secondary">Creado:</span>
                <span className="font-semibold text-text-primary">{article ? article.date : "Hoy"}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-secondary">Versión:</span>
                <span className="font-semibold text-text-primary">1.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Estado:</span>
                <span className="rounded bg-warning/20 px-2 py-0.5 font-medium text-warning-dark">Borrador</span>
              </div>
            </div>
          </div>
          
          {/* Online indicator */}
          <div className="mt-auto flex justify-end">
             <div className="flex items-center gap-2 rounded-full border border-success px-4 py-1.5">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
                </div>
                <span className="font-inter text-[10px] font-bold text-success uppercase leading-tight">Online<br/>Conectado</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
