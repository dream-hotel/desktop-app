import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon, X } from "lucide-react";
import { BackendTaskActivityLog, fullName } from "../../types/models/Task";
import ImageLightbox from "./ImageLightbox";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString([], {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CommentDetailModalProps {
  comment: BackendTaskActivityLog;
  onClose: () => void;
}

export default function CommentDetailModal({ comment, onClose }: CommentDetailModalProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = comment.imageUrls ?? [];
  const authorName = comment.user ? fullName(comment.user) : "Sistema";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && lightboxIndex === null) onClose();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, lightboxIndex]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/55 px-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl bg-surface shadow-[0px_22px_43px_0px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light font-inter text-[14px] font-semibold text-primary">
              {(comment.user?.fullName ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-inter text-[14px] font-medium text-text-primary">
                {authorName}
              </span>
              <span className="font-inter text-[11px] text-text-secondary">
                {formatDateTime(comment.createdAt)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-neutral-soft"
            title="Cerrar (Esc)"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <p className="whitespace-pre-wrap break-words font-inter text-[14px] leading-[22px] text-text-primary">
            {comment.action}
          </p>

          {images.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <ImageIcon size={13} strokeWidth={1.6} />
                <span className="font-inter text-[11px] font-medium uppercase tracking-wide">
                  {images.length} imagen{images.length === 1 ? "" : "es"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {images.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setLightboxIndex(i)}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-neutral-soft"
                    title="Ver imagen"
                  >
                    <img
                      src={url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          urls={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>,
    document.body,
  );
}
