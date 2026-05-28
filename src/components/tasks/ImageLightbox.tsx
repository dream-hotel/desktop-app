import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";

interface ImageLightboxProps {
  urls: string[];
  startIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({ urls, startIndex, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(startIndex);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + urls.length) % urls.length);
  }, [urls.length]);
  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % urls.length);
  }, [urls.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [goPrev, goNext, onClose]);

  if (urls.length === 0) return null;
  const current = urls[Math.max(0, Math.min(index, urls.length - 1))];

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70"
        title="Cerrar (Esc)"
      >
        <X size={18} strokeWidth={2} />
      </button>

      {urls.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70"
            title="Anterior (←)"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70"
            title="Siguiente (→)"
          >
            <ChevronRight size={20} strokeWidth={2} />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 font-inter text-[12px] text-white">
            {index + 1} / {urls.length}
          </span>
        </>
      )}

      <img
        src={current}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] rounded object-contain shadow-2xl"
      />
    </div>,
    document.body,
  );
}
