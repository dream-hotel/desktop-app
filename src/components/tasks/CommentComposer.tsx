import { useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { addTaskComment, addTaskCommentWithFiles } from "../../service/taskService";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_FILES = 10;

function isAcceptedImage(file: File): boolean {
  return file.type.startsWith("image/") && file.size <= MAX_FILE_BYTES;
}

interface CommentComposerProps {
  taskId: number;
  onAdded: () => void;
  variant?: "compact" | "full";
}

export default function CommentComposer({
  taskId,
  onAdded,
  variant = "compact",
}: CommentComposerProps) {
  const [draft, setDraft] = useState("");
  const [staged, setStaged] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => staged.map((f) => URL.createObjectURL(f)), [staged]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const f of incoming) {
      if (isAcceptedImage(f)) accepted.push(f);
      else rejected.push(f.name);
    }
    setStaged((prev) => {
      const next = [...prev, ...accepted];
      return next.slice(0, MAX_FILES);
    });
    if (rejected.length > 0) {
      setError(`Solo se permiten imágenes (máx. 15 MB): ${rejected.join(", ")}`);
    } else {
      setError(null);
    }
  }

  function removeStaged(index: number) {
    setStaged((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    setError(null);
    try {
      if (staged.length === 0) {
        await addTaskComment(taskId, text);
      } else {
        await addTaskCommentWithFiles(taskId, text, staged);
      }
      setDraft("");
      setStaged([]);
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el comentario");
    } finally {
      setPosting(false);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files: File[] = [];
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  }

  const isFull = variant === "full";

  return (
    <div
      className={`flex flex-col gap-2 ${isFull ? "rounded-lg border border-border bg-surface p-3" : ""}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length > 0) {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }
      }}
    >
      {/* Staged image thumbnails */}
      {staged.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {staged.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="relative h-14 w-14 overflow-hidden rounded-md border border-border bg-neutral-soft"
            >
              <img
                src={previews[i]}
                alt={file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeStaged(i)}
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white hover:bg-danger"
                title="Quitar"
              >
                <X size={9} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe tu comentario de relevo..."
          rows={isFull ? 3 : 2}
          className={`flex-1 resize-none rounded-lg border border-[rgba(0,0,0,0.1)] bg-bg px-3 py-2 font-inter text-[12px] leading-[18px] text-text-primary placeholder:text-text-secondary outline-none focus:border-primary ${isFull ? "rounded-md border-0 bg-bg focus:ring-1 focus:ring-primary" : ""}`}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Adjuntar imágenes"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-strong text-text-secondary hover:bg-neutral-soft"
        >
          <ImageIcon size={14} strokeWidth={1.8} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              addFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim() || posting}
          className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 font-inter text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={12} strokeWidth={2} />
          {posting ? "Enviando..." : "Enviar"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-inter text-[10px] text-text-secondary">
          Arrastra o pega imágenes para adjuntarlas · Ctrl/Cmd + Enter para enviar
        </span>
        {staged.length > 0 && (
          <span className="font-inter text-[10px] text-text-secondary">
            {staged.length} imagen{staged.length === 1 ? "" : "es"} adjunta{staged.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && <p className="font-inter text-[11px] text-danger">{error}</p>}
    </div>
  );
}
