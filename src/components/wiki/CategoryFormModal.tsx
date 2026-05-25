import { useEffect, useState } from "react";
import { WikiCategoryNode } from "../../types/models/Wiki";

interface CategoryFormModalProps {
  mode: "create" | "edit";
  initialName?: string;
  parentId?: number | null;
  parentName?: string | null;
  flatCategories: WikiCategoryNode[]; // for parent selector on edit
  onCancel: () => void;
  onSubmit: (payload: { name: string; parentId: number | null }) => Promise<void>;
}

function flatten(nodes: WikiCategoryNode[], depth = 0): Array<{ node: WikiCategoryNode; depth: number }> {
  const out: Array<{ node: WikiCategoryNode; depth: number }> = [];
  nodes.forEach((n) => {
    out.push({ node: n, depth });
    out.push(...flatten(n.children, depth + 1));
  });
  return out;
}

export default function CategoryFormModal({
  mode,
  initialName = "",
  parentId = null,
  parentName = null,
  flatCategories,
  onCancel,
  onSubmit,
}: CategoryFormModalProps) {
  const [name, setName] = useState(initialName);
  const [selectedParent, setSelectedParent] = useState<number | null>(parentId);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(initialName);
    setSelectedParent(parentId);
  }, [initialName, parentId]);

  const list = flatten(flatCategories);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (trimmed.length > 100) {
      setError("El nombre no puede superar los 100 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ name: trimmed, parentId: selectedParent });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la categoría.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-[440px] flex-col gap-5 rounded-[14px] bg-surface p-6 shadow-[0px_20px_40px_rgba(0,0,0,0.18)]"
      >
        <header className="flex flex-col gap-1">
          <h3 className="font-alexandria text-[20px] font-medium text-text-primary">
            {mode === "create" ? "Nueva carpeta" : "Editar carpeta"}
          </h3>
          <p className="font-inter text-[12px] text-text-secondary">
            {mode === "create" && parentName
              ? `Se creará dentro de “${parentName}”.`
              : "Las carpetas organizan los artículos en una estructura jerárquica."}
          </p>
        </header>

        <div className="flex flex-col gap-1">
          <label className="font-inter text-[12px] font-medium text-text-primary">
            Nombre de la carpeta
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoFocus
            placeholder="Ej. Housekeeping"
            className="rounded-[10px] border border-border bg-surface px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary/50"
          />
        </div>

        {mode === "edit" && (
          <div className="flex flex-col gap-1">
            <label className="font-inter text-[12px] font-medium text-text-primary">
              Carpeta padre
            </label>
            <select
              value={selectedParent ?? ""}
              onChange={(e) => setSelectedParent(e.target.value ? Number(e.target.value) : null)}
              className="rounded-[10px] border border-border bg-surface px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary/50"
            >
              <option value="">— Raíz —</option>
              {list.map(({ node, depth }) => (
                <option key={node.id} value={node.id}>
                  {" ".repeat(depth * 2)}
                  {node.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="rounded-[8px] border border-danger/30 bg-danger/10 px-3 py-2 font-inter text-[12px] text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-[10px] bg-neutral-soft px-4 py-2 font-inter text-[13px] font-medium text-text-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-[10px] bg-primary px-4 py-2 font-inter text-[13px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
