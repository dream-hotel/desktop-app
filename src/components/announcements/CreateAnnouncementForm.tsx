import { useState } from "react";
import { AnnouncementPriority, AnnouncementAudience, CreateAnnouncementRequest } from "../../types/models/Announcement";

interface CreateAnnouncementFormProps {
  onSubmit: (data: CreateAnnouncementRequest) => Promise<void>;
}

export default function CreateAnnouncementForm({ onSubmit }: CreateAnnouncementFormProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [audience, setAudience] = useState<AnnouncementAudience>("todos");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert("Por favor completa el título y el mensaje del anuncio.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ title, message, priority, audience });
      // Reset form
      setTitle("");
      setMessage("");
      setPriority("normal");
      setAudience("todos");
    } catch (error) {
      console.error(error);
      alert("Error al publicar el anuncio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-[16px] bg-white p-8 shadow-sm">
      <div>
        <h2 className="font-alexandria text-[20px] font-medium text-text-primary">Redactar Anuncio</h2>
        <p className="mt-1 font-inter text-[13px] text-text-secondary">
          Crea un nuevo aviso para notificar al personal del hotel.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Título */}
        <div>
          <label className="mb-2 block font-inter text-[13px] font-semibold text-text-primary">
            Título del Anuncio
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Cambio de turno, Mantenimiento..."
            className="w-full rounded-md border border-border px-4 py-3 font-inter text-[14px] outline-none placeholder:text-text-secondary/60 focus:border-primary/50"
          />
        </div>

        <div>
          <label className="mb-2 block font-inter text-[13px] font-semibold text-text-primary">
            Mensaje
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Detalles del anuncio..."
            rows={5}
            className="w-full resize-none rounded-md border border-border px-4 py-3 font-inter text-[14px] outline-none placeholder:text-text-secondary/60 focus:border-primary/50"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-2 block font-inter text-[13px] font-semibold text-text-primary">
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
              className="w-full rounded-md border border-border px-3 py-3 font-inter text-[14px] text-text-primary outline-none focus:border-primary/50"
            >
              <option value="normal">Normal (Informativo)</option>
              <option value="importante">Importante</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="mb-2 block font-inter text-[13px] font-semibold text-text-primary">
              Destinatarios
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
              className="w-full rounded-md border border-border px-3 py-3 font-inter text-[14px] text-text-primary outline-none focus:border-primary/50"
            >
              <option value="todos">Todo el personal</option>
              <option value="recepcion">Recepción</option>
              <option value="limpieza">Limpieza (Housekeeping)</option>
              <option value="administracion">Administración</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-8 font-alegreya-sc text-[16px] font-medium text-white transition-transform active:scale-95 disabled:opacity-70"
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
