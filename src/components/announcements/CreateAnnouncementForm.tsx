import { useState } from "react";
import { CreateAnnouncementRequest } from "../../types/models/Announcement";

interface CreateAnnouncementFormProps {
  onSubmit: (data: CreateAnnouncementRequest) => Promise<void>;
}

export default function CreateAnnouncementForm({ onSubmit }: CreateAnnouncementFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [announcementType, setAnnouncementType] = useState<"text" | "task" | "article">("text");
  const [priorityId, setPriorityId] = useState<number>(2); // Default to Medium (2)
  const [visibleUntilDate, setVisibleUntilDate] = useState("");
  const [taskIdInput, setTaskIdInput] = useState("");
  const [articleIdInput, setArticleIdInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert("Por favor completa el título del anuncio.");
      return;
    }

    if (title.length > 150) {
      alert("El título no puede superar los 150 caracteres.");
      return;
    }

    const payload: CreateAnnouncementRequest = {
      title: title.trim(),
      priorityId,
      announcementType,
    };

    if (description.trim()) {
      payload.description = description.trim();
    }

    if (visibleUntilDate) {
      // Set expiration to the end of the selected day in ISO format
      payload.visibleUntil = new Date(`${visibleUntilDate}T23:59:59Z`).toISOString();
    }

    if (announcementType === "task") {
      const taskId = parseInt(taskIdInput);
      if (isNaN(taskId)) {
        alert("Por favor ingresa un ID de Tarea válido.");
        return;
      }
      payload.taskId = taskId;
    } else if (announcementType === "article") {
      const articleId = parseInt(articleIdInput);
      if (isNaN(articleId)) {
        alert("Por favor ingresa un ID de Artículo válido.");
        return;
      }
      payload.articleId = articleId;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      // Reset form
      setTitle("");
      setDescription("");
      setAnnouncementType("text");
      setPriorityId(2);
      setVisibleUntilDate("");
      setTaskIdInput("");
      setArticleIdInput("");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al publicar el anuncio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-[16px] bg-white p-8 shadow-sm border border-border">
      <div>
        <h2 className="font-alexandria text-[20px] font-medium text-text-primary">Redactar Anuncio</h2>
        <p className="mt-1 font-inter text-[13px] text-text-secondary">
          Crea un nuevo aviso oficial para el personal del hotel en la base de datos real.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Título */}
        <div>
          <label className="mb-2 block font-inter text-[13px] font-semibold text-text-primary">
            Título del Anuncio <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Mantenimiento urgente de servidores, Reunión mensual..."
            maxLength={150}
            className="w-full rounded-md border border-border px-4 py-3 font-inter text-[14px] outline-none placeholder:text-text-secondary/60 focus:border-primary/50"
            required
          />
          <span className="mt-1 block text-right font-inter text-[11px] text-text-secondary">
            {title.length}/150 caracteres
          </span>
        </div>

        {/* Tipo de Anuncio y Prioridad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block font-inter text-[13px] font-semibold text-text-primary">
              Tipo de Anuncio
            </label>
            <select
              value={announcementType}
              onChange={(e) => setAnnouncementType(e.target.value as "text" | "task" | "article")}
              className="w-full rounded-md border border-border px-3 py-3 font-inter text-[14px] text-text-primary outline-none focus:border-primary/50"
            >
              <option value="text">Comunicado de Texto</option>
              <option value="task">Notificación de Tarea (Task)</option>
              <option value="article">Aviso de Artículo (Wiki)</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-inter text-[13px] font-semibold text-text-primary">
              Nivel de Prioridad
            </label>
            <select
              value={priorityId}
              onChange={(e) => setPriorityId(parseInt(e.target.value))}
              className="w-full rounded-md border border-border px-3 py-3 font-inter text-[14px] text-text-primary outline-none focus:border-primary/50"
            >
              <option value={1}>Baja (Low)</option>
              <option value={2}>Media (Medium)</option>
              <option value={3}>Alta (High)</option>
              <option value={4}>Crítica (Critical)</option>
            </select>
          </div>
        </div>

        {/* Campos condicionales (Tarea / Artículo) y Expiración */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcementType === "task" && (
            <div>
              <label className="mb-2 block font-inter text-[13px] font-semibold text-text-primary">
                ID de Tarea Asociada <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                value={taskIdInput}
                onChange={(e) => setTaskIdInput(e.target.value)}
                placeholder="Ej. 18"
                className="w-full rounded-md border border-border px-4 py-3 font-inter text-[14px] outline-none focus:border-primary/50"
                required
              />
            </div>
          )}

          {announcementType === "article" && (
            <div>
              <label className="mb-2 block font-inter text-[13px] font-semibold text-text-primary">
                ID de Artículo de Wiki <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                value={articleIdInput}
                onChange={(e) => setArticleIdInput(e.target.value)}
                placeholder="Ej. 5"
                className="w-full rounded-md border border-border px-4 py-3 font-inter text-[14px] outline-none focus:border-primary/50"
                required
              />
            </div>
          )}

          <div className={announcementType === "text" ? "col-span-2" : ""}>
            <label className="mb-2 block font-inter text-[13px] font-semibold text-text-primary">
              Visible hasta (Expiración) <span className="text-text-secondary/60 font-normal">(Opcional)</span>
            </label>
            <input
              type="date"
              value={visibleUntilDate}
              onChange={(e) => setVisibleUntilDate(e.target.value)}
              className="w-full rounded-md border border-border px-4 py-3 font-inter text-[14px] outline-none focus:border-primary/50 text-text-primary"
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="mb-2 block font-inter text-[13px] font-semibold text-text-primary">
            Mensaje o Descripción <span className="text-text-secondary/60 font-normal">(Opcional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles sobre el anuncio..."
            rows={5}
            className="w-full resize-none rounded-md border border-border px-4 py-3 font-inter text-[14px] outline-none placeholder:text-text-secondary/60 focus:border-primary/50"
          />
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-8 font-alegreya-sc text-[16px] font-medium text-white transition-all hover:bg-primary/95 active:scale-95 disabled:opacity-70"
        >
          {isSubmitting ? (
            "Publicando..."
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M16 2L8 10M16 2l-5 14-3-4M16 2L2 7l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Publicar Anuncio
            </>
          )}
        </button>
      </div>
    </form>
  );
}
