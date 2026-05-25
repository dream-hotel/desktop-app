import React, { useState, useRef, useEffect } from "react";
import { Upload, X, FileIcon, FileSpreadsheet, FileText } from "lucide-react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { readFile } from "@tauri-apps/plugin-fs";

interface ArticleFileUploadModalProps {
  initialTitle?: string;
  onCancel: () => void;
  onSubmit: (file: File, title: string) => Promise<void>;
}

export default function ArticleFileUploadModal({
  initialTitle = "",
  onCancel,
  onSubmit,
}: ArticleFileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [isDragging, setIsDragover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  // Helper to guess mime type from extension (since Tauri paths don't give it)
  const getMimeType = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "application/pdf";
    if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (ext === "doc") return "application/msword";
    if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (ext === "xls") return "application/vnd.ms-excel";
    return "application/octet-stream";
  };

  const handleNativeDrop = async (path: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const fileName = path.split(/[/\\]/).pop() || "archivo";
      const mimeType = getMimeType(path);
      
      // Read bytes from disk via Tauri Plugin FS
      const bytes = await readFile(path);
      
      // Reconstruct standard JavaScript File object
      const nativeFile = new File([bytes], fileName, { type: mimeType });
      
      validateAndSetFile(nativeFile);
    } catch (err) {
      console.error("Native drop error:", err);
      setError("No se pudo leer el archivo arrastrado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for native OS drag & drop events (Tauri v2)
    const unlisten = getCurrentWebviewWindow().onDragDropEvent((event) => {
      if (event.payload.type === "hover") {
        setIsDragover(true);
      } else if (event.payload.type === "drop") {
        setIsDragover(false);
        const paths = event.payload.paths;
        if (paths && paths.length > 0) {
          handleNativeDrop(paths[0]);
        }
      } else {
        setIsDragover(false);
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const validateAndSetFile = (selected: File) => {
    setError(null);
    if (!allowedTypes.includes(selected.type) && selected.type !== "application/octet-stream") {
      setError("Solo se permiten archivos PDF, Word o Excel.");
      return;
    }
    setFile(selected);
    // Sugerir título basado en el nombre del archivo si está vacío
    if (!title) {
      const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // No encendemos setIsDragover aquí para no duplicar con el evento nativo de Tauri
    e.dataTransfer.dropEffect = "copy";
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    // Los eventos de archivos del SO son capturados por onDragDropEvent de Tauri,
    // pero mantenemos esto por si acaso se arrastra algo interno.
    e.preventDefault();
    e.stopPropagation();
    setIsDragover(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Debes seleccionar un archivo.");
      return;
    }
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(file, title.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload size={32} />;
    if (file.type.includes("pdf")) return <FileText size={32} className="text-danger" />;
    if (file.type.includes("sheet") || file.type.includes("excel"))
      return <FileSpreadsheet size={32} className="text-success" />;
    return <FileIcon size={32} className="text-primary" />;
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-[480px] flex-col gap-5 rounded-[14px] bg-surface p-7 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
      >
        <header className="flex flex-col gap-1.5">
          <h3 className="font-alexandria text-[20px] font-medium text-text-primary">
            Adjuntar archivo
          </h3>
          <p className="font-inter text-[13px] text-text-secondary">
            Sube un documento para crear un artículo referenciado.
          </p>
        </header>

        <div className="flex flex-col gap-1.5">
          <label className="font-inter text-[12px] font-medium text-text-primary">
            Título del artículo
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Guía de Procesos 2024"
            className="rounded-[10px] border border-border bg-surface px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary/50"
          />
        </div>

        <div
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed p-8 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : file
              ? "border-primary/30 bg-primary/5"
              : "border-border hover:bg-bg"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
          />

          <div className="text-text-secondary/60">{getFileIcon()}</div>

          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-inter text-[14px] font-medium text-text-primary">
              {file ? file.name : "Arrastra un archivo o haz clic aquí"}
            </span>
            <span className="font-inter text-[11px] text-text-secondary">
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                : "PDF, Word o Excel (máx. 10MB)"}
            </span>
          </div>

          {file && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="absolute right-3 top-3 rounded-full p-1 text-text-secondary hover:bg-border hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-[8px] border border-danger/30 bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-[10px] bg-neutral-soft px-4 py-2 font-inter text-[13px] font-medium text-text-secondary transition-colors hover:bg-neutral-soft/80"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !file}
            className="rounded-[10px] bg-primary px-5 py-2 font-inter text-[13px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Subiendo..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
