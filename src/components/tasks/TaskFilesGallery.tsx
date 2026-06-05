import { useState } from "react";
import { ExternalLink, Paperclip } from "lucide-react";
import { BackendTaskFile } from "../../types/models/Task";
import ImageLightbox from "./ImageLightbox";
import { getFullUrl } from "../../service/apiConfig";

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$/i;
const isImageUrl = (url: string): boolean => IMAGE_EXT_RE.test(url);

function fileNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    const last = parsed.pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : url;
  } catch {
    return url;
  }
}

interface TaskFilesGalleryProps {
  files: BackendTaskFile[];
  variant?: "compact" | "full";
}

export default function TaskFilesGallery({ files, variant = "full" }: TaskFilesGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  if (files.length === 0) return null;

  const imageFiles = files.filter((f) => isImageUrl(f.url));
  const otherFiles = files.filter((f) => !isImageUrl(f.url));
  const imageUrls = imageFiles.map((f) => getFullUrl(f.url));

  const isCompact = variant === "compact";
  const gridCols = isCompact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4";
  const thumbSize = isCompact ? "aspect-square" : "aspect-square";

  return (
    <div className="flex flex-col gap-2">
      {imageFiles.length > 0 && (
        <div className={`grid ${gridCols} gap-2`}>
          {imageFiles.map((file, idx) => (
            <button
              key={file.id}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className={`group relative ${thumbSize} overflow-hidden rounded-lg border border-border bg-neutral-soft`}
              title="Ver imagen"
            >
              <img
                src={getFullUrl(file.url)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {otherFiles.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {otherFiles.map((file) => (
            <li key={file.id}>
              <a
                href={getFullUrl(file.url)}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 hover:bg-neutral-soft"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Paperclip size={12} strokeWidth={1.6} className="shrink-0 text-text-secondary" />
                  <span className="truncate font-inter text-[12px] text-text-primary">
                    {fileNameFromUrl(file.url)}
                  </span>
                </div>
                <ExternalLink size={12} strokeWidth={1.6} className="shrink-0 text-text-secondary" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {lightboxIndex !== null && imageUrls.length > 0 && (
        <ImageLightbox
          urls={imageUrls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
