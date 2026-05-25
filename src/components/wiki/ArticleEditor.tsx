import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { es as blocknoteEs } from "@blocknote/core/locales";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import {
  WikiArticleDetail,
  WikiCategoryNode,
} from "../../types/models/Wiki";
import { User } from "../../types/response/AuthResponse";
import * as wikiService from "../../service/wikiService";
import { useTheme } from "../../hooks/useTheme";
import EditorToolbar from "./EditorToolbar";

interface ArticleEditorProps {
  user: User;
  tree: WikiCategoryNode[];
  article: WikiArticleDetail | null;
  onCancel: () => void;
  onSaved: (article: WikiArticleDetail) => void;
}

interface FlatItem {
  id: number;
  label: string;
}

function flattenForSelect(nodes: WikiCategoryNode[], depth = 0): FlatItem[] {
  const out: FlatItem[] = [];
  for (const node of nodes) {
    out.push({ id: node.id, label: `${"— ".repeat(depth)}${node.name}` });
    out.push(...flattenForSelect(node.children, depth + 1));
  }
  return out;
}

const TITLE_MAX = 150;

export default function ArticleEditor({
  user,
  tree,
  article,
  onCancel,
  onSaved,
}: ArticleEditorProps) {
  const isEditMode = !!article;
  const { resolved } = useTheme();

  const [title, setTitle] = useState(article?.title ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(
    article?.categoryId ?? "",
  );
  const [isPublic, setIsPublic] = useState<boolean>(article?.isPublic ?? true);

  const [saving, setSaving] = useState(false);
  const [publishAfterSave, setPublishAfterSave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [editorTouched, setEditorTouched] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    article?.updatedAt ? new Date(article.updatedAt) : null,
  );

  const editor = useCreateBlockNote({
    dictionary: blocknoteEs,
    uploadFile: async (file: File) => {
      const result = await wikiService.uploadArticleImage(file);
      return result.url;
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(
        article?.contentMarkdown ?? "",
      );
      if (cancelled) return;
      editor.replaceBlocks(
        editor.document,
        blocks.length > 0 ? blocks : [{ type: "paragraph" }],
      );
      const md = await editor.blocksToMarkdownLossy(editor.document);
      setCharCount(md.length);
      setEditorReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [article, editor]);

  const handleEditorChange = async () => {
    setEditorTouched(true);
    const md = await editor.blocksToMarkdownLossy(editor.document);
    setCharCount(md.length);
  };

  const flatCategories = useMemo(() => flattenForSelect(tree), [tree]);

  const submit = async (publish: boolean) => {
    setError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("El título es obligatorio.");
      return;
    }
    if (trimmedTitle.length > TITLE_MAX) {
      setError(`El título no puede superar los ${TITLE_MAX} caracteres.`);
      return;
    }

    const markdown = await editor.blocksToMarkdownLossy(editor.document);

    setSaving(true);
    setPublishAfterSave(publish);
    try {
      let saved: WikiArticleDetail;
      if (isEditMode && article) {
        const patch: Parameters<typeof wikiService.updateArticle>[1] = {
          title: trimmedTitle,
          content: markdown,
          isPublic,
        };
        if (categoryId !== "") patch.categoryId = Number(categoryId);
        saved = await wikiService.updateArticle(article.id, patch);
      } else {
        saved = await wikiService.createArticle({
          title: trimmedTitle,
          content: markdown,
          categoryId: categoryId === "" ? null : Number(categoryId),
          isPublic,
        });
      }
      if (publish && saved.status !== "published") {
        saved = await wikiService.publishArticle(saved.id);
      }
      setLastSavedAt(new Date());
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el artículo.");
    } finally {
      setSaving(false);
      setPublishAfterSave(false);
    }
  };

  const theme = useMemo(
    () =>
      resolved === "dark"
        ? {
            colors: {
              editor: { text: "#f1f1f3", background: "#17171a" },
              menu: { text: "#f1f1f3", background: "#1f1f23" },
              tooltip: { text: "#17171a", background: "#f1f1f3" },
              hovered: { text: "#f1f1f3", background: "#2a1c3a" },
              selected: { text: "#d4c4ee", background: "#2a1c3a" },
              disabled: { text: "#6b7280", background: "#0e0e10" },
              shadow: "#00000088",
              border: "rgba(255,255,255,0.08)",
              sideMenu: "#9ca3af",
              highlights: {
                gray: { text: "#d1d5db", background: "#27272a" },
                brown: { text: "#fbbf24", background: "#3f2a18" },
                red: { text: "#fca5a5", background: "#3a1717" },
                orange: { text: "#fdba74", background: "#3a2317" },
                yellow: { text: "#fde68a", background: "#3a3017" },
                green: { text: "#86efac", background: "#13361f" },
                blue: { text: "#93c5fd", background: "#172a3a" },
                purple: { text: "#d4c4ee", background: "#2a1c3a" },
                pink: { text: "#f9a8d4", background: "#3a1730" },
              },
            },
          }
        : {
            colors: {
              editor: { text: "#1a1a1a", background: "#ffffff" },
              menu: { text: "#1a1a1a", background: "#ffffff" },
              tooltip: { text: "#ffffff", background: "#1a1a1a" },
              hovered: { text: "#1a1a1a", background: "#f5f0fb" },
              selected: { text: "#492173", background: "#f5f0fb" },
              disabled: { text: "#9ca3af", background: "#fbfbfb" },
              shadow: "#0000001f",
              border: "rgba(0,0,0,0.06)",
              sideMenu: "#9ca3af",
              highlights: {
                gray: { text: "#374151", background: "#f3f4f6" },
                brown: { text: "#92400e", background: "#fef3c7" },
                red: { text: "#991b1b", background: "#fee2e2" },
                orange: { text: "#9a3412", background: "#ffedd5" },
                yellow: { text: "#92400e", background: "#fef9c3" },
                green: { text: "#065f46", background: "#dcfce7" },
                blue: { text: "#1e3a8a", background: "#dbeafe" },
                purple: { text: "#492173", background: "#f5f0fb" },
                pink: { text: "#9d174d", background: "#fce7f3" },
              },
            },
          },
    [resolved],
  );

  const initials = user.fullName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-surface text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            aria-label="Cerrar editor"
          >
            <ArrowLeft size={16} strokeWidth={1.8} />
          </button>
          <div className="flex flex-col">
            <h1 className="font-alexandria text-[20px] font-medium leading-tight text-text-primary">
              {isEditMode ? "Editar artículo" : "Nuevo artículo"}
            </h1>
            <span className="font-inter text-[12px] text-text-secondary">
              Wiki institucional · Editor de contenido
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastSavedAt && (
            <span className="font-inter text-[11px] text-text-secondary">
              Guardado a las{" "}
              {lastSavedAt.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-[10px] border border-border bg-surface px-3 py-2 font-inter text-[12px] font-medium text-text-secondary transition-colors hover:bg-bg disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            onClick={() => submit(false)}
            disabled={saving || !editorReady}
            className="rounded-[10px] border border-primary/30 bg-primary/5 px-3 py-2 font-inter text-[12px] font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            {saving && !publishAfterSave ? "Guardando..." : "Guardar borrador"}
          </button>

          <button
            onClick={() => submit(true)}
            disabled={saving || !editorReady}
            className="rounded-[10px] bg-primary px-4 py-2 font-inter text-[12px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {saving && publishAfterSave ? "Publicando..." : "Guardar y publicar"}
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-inter text-[12px] font-semibold text-white">
            {initials}
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-8 mt-4 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-2 font-inter text-[12px] text-danger">
          {error}
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-5 p-5 pt-3">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-border bg-surface">
          <div className="flex flex-col gap-2 border-b border-border px-5 py-4">
            <label className="font-inter text-[11.5px] font-medium text-text-secondary">
              Título del artículo
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Manual de Estándares de Housekeeping"
              maxLength={TITLE_MAX}
              className="w-full border-b border-transparent bg-transparent font-alexandria text-[20px] font-medium text-text-primary outline-none transition-colors placeholder:text-text-secondary/50 focus:border-primary/40"
            />
            <div className="flex justify-between font-inter text-[10px] text-text-secondary">
              <span>El título es visible en la lista de artículos y en buscadores.</span>
              <span>
                {title.length}/{TITLE_MAX}
              </span>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {editorReady && <EditorToolbar editor={editor} />}
            <div className="flex items-center justify-between border-b border-border bg-bg px-5 py-2 font-inter text-[11px] text-text-secondary">
              <span>Editor enriquecido — el contenido se guarda como Markdown.</span>
              <span>{charCount} caracteres en Markdown</span>
            </div>
            <div className="bn-compact flex-1 overflow-y-auto bg-surface">
              {!editorReady ? (
                <div className="px-6 py-6 font-inter text-[13px] text-text-secondary">
                  Cargando editor...
                </div>
              ) : (
                <BlockNoteView
                  editor={editor}
                  onChange={handleEditorChange}
                  theme={theme as never}
                />
              )}
            </div>
          </div>
        </section>

        <aside className="flex w-[320px] shrink-0 flex-col gap-4 overflow-y-auto">
          <div className="rounded-[14px] border border-border bg-surface p-5">
            <h2 className="font-alexandria text-[15px] font-medium text-text-primary">
              Organización
            </h2>
            <p className="mt-0.5 font-inter text-[11px] text-text-secondary">
              Define dónde se ubicará el artículo dentro de la wiki.
            </p>

            <div className="mt-4 flex flex-col gap-1">
              <label className="font-inter text-[12px] font-medium text-text-primary">
                Carpeta
              </label>
              <select
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 font-inter text-[13px] text-text-primary outline-none focus:border-primary/50"
              >
                <option value="">Sin categoría</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-[14px] border border-border bg-surface p-5">
            <h2 className="font-alexandria text-[15px] font-medium text-text-primary">
              Visibilidad
            </h2>
            <p className="mt-0.5 font-inter text-[11px] text-text-secondary">
              Controla qué roles pueden leer el artículo.
            </p>

            <div className="mt-4 flex items-start justify-between gap-3 rounded-[10px] border border-border bg-bg p-3">
              <div className="flex flex-1 flex-col">
                <span className="font-inter text-[12px] font-semibold text-text-primary">
                  {isPublic ? "Público" : "Confidencial"}
                </span>
                <span className="mt-0.5 font-inter text-[11px] text-text-secondary">
                  {isPublic
                    ? "Visible para administradores y recepcionistas."
                    : "Solo visible para administradores."}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic((v) => !v)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  isPublic ? "bg-primary" : "bg-text-secondary/40"
                }`}
                aria-label="Alternar visibilidad"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-surface shadow transition-all ${
                    isPublic ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="rounded-[14px] border border-border bg-surface p-5">
            <h2 className="font-alexandria text-[15px] font-medium text-text-primary">
              Metadatos
            </h2>
            <dl className="mt-3 flex flex-col gap-2 font-inter text-[12px]">
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">Autor</dt>
                <dd className="font-medium text-text-primary">
                  {article?.authorName ?? user.fullName}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">Estado</dt>
                <dd>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      article?.status === "published"
                        ? "bg-success/10 text-success"
                        : "bg-warning/15 text-warning"
                    }`}
                  >
                    {article?.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">Creado</dt>
                <dd className="text-text-primary">
                  {article?.createdAt
                    ? new Date(article.createdAt).toLocaleDateString("es-ES")
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-secondary">Cambios sin guardar</dt>
                <dd className="text-text-primary">
                  {editorTouched ? "Sí" : "No"}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
