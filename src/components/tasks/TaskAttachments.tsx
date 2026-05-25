import { useRef, useState } from "react";
import { ExternalLink, Paperclip, Trash2, Upload } from "lucide-react";
import { BackendTaskFile } from "../../types/models/Task";
import { removeTaskFile, uploadTaskFile } from "../../service/taskService";
import ImageLightbox from "./ImageLightbox";

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$/i;

function isImageUrl(url: string): boolean {
  return IMAGE_EXT_RE.test(url);
}

function fileNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    const last = parsed.pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : url;
  } catch {
    return url;
  }
}

interface TaskAttachmentsProps {
  taskId: number;
  files: BackendTaskFile[];
  onChanged: () => void;
}

export default function TaskAttachments({ taskId, files, onChanged }: TaskAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const imageFiles = files.filter((f) => isImageUrl(f.url));
  const otherFiles = files.filter((f) => !isImageUrl(f.url));
  const imageUrls = imageFiles.map((f) => f.url);

  async function handleFiles(list: FileList | File[]) {
    const arr = Array.from(list);
    if (arr.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of arr) {
        await uploadTaskFile(taskId, file);
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el archivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fileId: number) {
    const ok = window.confirm("¿Eliminar este archivo?");
    if (!ok) return;
    try {
      await removeTaskFile(taskId, fileId);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el archivo");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed py-5 transition-colors ${
          isDragging
            ? "border-primary bg-primary-light"
            : "border-[rgba(0,0,0,0.12)] bg-surface hover:bg-neutral-soft"
        }`}
      >
        <Upload size={18} strokeWidth={1.5} className="text-text-secondary" />
        <p className="font-inter text-[12px] text-text-secondary">
          {uploading
            ? "Subiendo archivo..."
            : isDragging
              ? "Suelta los archivos para subirlos"
              : "Arrastra fotos aquí o haz clic para seleccionarlas"}
        </p>
        <p className="font-inter text-[10px] text-text-secondary">
          JPG, PNG, GIF, WEBP, SVG, MP4, MOV — máx. 15 MB por archivo
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      {error && <p className="font-inter text-[11px] text-danger">{error}</p>}

      {/* Image grid */}
      {imageFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {imageFiles.map((file, idx) => (
            <div
              key={file.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-neutral-soft"
            >
              <button
                onClick={() => setLightboxIndex(idx)}
                className="absolute inset-0 h-full w-full"
                title="Ver imagen"
              >
                <img
                  src={file.url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
              <button
                onClick={() => handleDelete(file.id)}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
                title="Eliminar"
              >
                <Trash2 size={12} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Non-image attachments */}
      {otherFiles.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {otherFiles.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2"
            >
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex min-w-0 items-center gap-2"
              >
                <Paperclip size={12} strokeWidth={1.6} className="shrink-0 text-text-secondary" />
                <span className="truncate font-inter text-[12px] text-text-primary">
                  {fileNameFromUrl(file.url)}
                </span>
                <ExternalLink size={12} strokeWidth={1.6} className="shrink-0 text-text-secondary" />
              </a>
              <button
                onClick={() => handleDelete(file.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
                title="Eliminar"
              >
                <Trash2 size={12} strokeWidth={1.6} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          urls={imageUrls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
