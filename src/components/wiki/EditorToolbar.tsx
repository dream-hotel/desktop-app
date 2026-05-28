import { ReactNode, useMemo, useRef, useState } from "react";
import { Code, Image as ImageIcon, IndentDecrease, IndentIncrease, Link as LinkIcon, List, ListChecks, ListOrdered } from "lucide-react";
import type { BlockNoteEditor } from "@blocknote/core";
import { useEditorState, useSelectedBlocks } from "@blocknote/react";
import { shortcut } from "../../hooks/usePlatform";

interface EditorToolbarProps {
  editor: BlockNoteEditor;
}

type BlockOption = {
  value: string;
  label: string;
};

const BLOCK_OPTIONS: BlockOption[] = [
  { value: "paragraph", label: "Párrafo" },
  { value: "heading-1", label: "Título 1" },
  { value: "heading-2", label: "Título 2" },
  { value: "heading-3", label: "Título 3" },
];

function currentBlockOption(blockType: string, level?: number): string {
  if (blockType === "heading") return `heading-${level ?? 1}`;
  return "paragraph";
}

function applyBlockOption(editor: BlockNoteEditor, value: string) {
  const cursor = editor.getTextCursorPosition();
  if (!cursor?.block) return;
  if (value === "paragraph") {
    editor.updateBlock(cursor.block, { type: "paragraph" });
    return;
  }
  if (value.startsWith("heading-")) {
    const level = Number(value.split("-")[1]) as 1 | 2 | 3;
    editor.updateBlock(cursor.block, { type: "heading", props: { level } });
  }
}

interface ToolbarButtonProps {
  active?: boolean;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

function ToolbarButton({ active, title, onClick, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-[6px] font-inter text-[13px] transition-colors disabled:opacity-40 ${
        active
          ? "bg-primary text-white"
          : "text-text-primary hover:bg-primary/10 hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden />;
}

type StyleFlags = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
};

const EMPTY_STYLES: StyleFlags = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  code: false,
};

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const activeStyles = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      const tt = (ed as unknown as { _tiptapEditor?: { isActive?: (n: string) => boolean } })._tiptapEditor;
      if (!tt?.isActive) return EMPTY_STYLES;
      return {
        bold: tt.isActive("bold"),
        italic: tt.isActive("italic"),
        underline: tt.isActive("underline"),
        strike: tt.isActive("strike"),
        code: tt.isActive("code"),
      };
    },
  }) as StyleFlags;
  const selectedBlocks = useSelectedBlocks(editor);

  const { blockType, headingLevel, isList } = useMemo(() => {
    const block = selectedBlocks[0];
    const type = block?.type ?? "paragraph";
    const level =
      type === "heading" ? Number((block?.props as { level?: number })?.level ?? 1) : undefined;
    return {
      blockType: type,
      headingLevel: level,
      isList: type === "bulletListItem" || type === "numberedListItem" || type === "checkListItem",
    };
  }, [selectedBlocks]);

  const blockSelectValue = currentBlockOption(blockType, headingLevel);

  const toggleStyle = (style: "bold" | "italic" | "underline" | "strike" | "code") => {
    editor.focus();
    editor.toggleStyles({ [style]: true } as never);
  };

  const setList = (type: "bulletListItem" | "numberedListItem" | "checkListItem") => {
    editor.focus();
    const block = editor.getTextCursorPosition().block;
    if (!block) return;
    if (block.type === type) {
      editor.updateBlock(block, { type: "paragraph" });
    } else {
      editor.updateBlock(block, { type });
    }
  };

  const handleLink = () => {
    const url = window.prompt("URL del enlace");
    if (!url) return;
    editor.focus();
    const text = window.getSelection()?.toString();
    if (text && text.length > 0) {
      editor.createLink(url);
    } else {
      editor.createLink(url, url);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!editor.uploadFile) {
      window.alert("La carga de imágenes no está disponible.");
      return;
    }
    setUploading(true);
    try {
      editor.focus();
      const cursor = editor.getTextCursorPosition();
      const result = await editor.uploadFile(file);
      const url = typeof result === "string" ? result : result.url;
      const block = {
        type: "image" as const,
        props: { url, caption: "", name: file.name },
      };
      if (cursor?.block) {
        editor.insertBlocks([block], cursor.block, "after");
      } else {
        editor.insertBlocks([block], editor.document[editor.document.length - 1], "after");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir la imagen";
      window.alert(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface px-3 py-2">
      <select
        value={blockSelectValue}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          editor.focus();
          applyBlockOption(editor, e.target.value);
        }}
        className="h-8 rounded-[6px] border border-border bg-surface px-2 font-inter text-[12px] text-text-primary outline-none focus:border-primary/50"
        title="Tipo de bloque"
        aria-label="Tipo de bloque"
      >
        {BLOCK_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <Divider />

      <ToolbarButton
        title={`Negrita (${shortcut("B")})`}
        active={!!activeStyles.bold}
        onClick={() => toggleStyle("bold")}
      >
        <span className="font-bold">N</span>
      </ToolbarButton>
      <ToolbarButton
        title={`Cursiva (${shortcut("I")})`}
        active={!!activeStyles.italic}
        onClick={() => toggleStyle("italic")}
      >
        <span className="italic">C</span>
      </ToolbarButton>
      <ToolbarButton
        title={`Subrayado (${shortcut("U")})`}
        active={!!activeStyles.underline}
        onClick={() => toggleStyle("underline")}
      >
        <span className="underline">S</span>
      </ToolbarButton>
      <ToolbarButton
        title="Tachado"
        active={!!activeStyles.strike}
        onClick={() => toggleStyle("strike")}
      >
        <span className="line-through">T</span>
      </ToolbarButton>
      <ToolbarButton
        title="Código en línea"
        active={!!activeStyles.code}
        onClick={() => toggleStyle("code")}
      >
        <Code size={14} strokeWidth={1.8} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Lista con viñetas"
        active={blockType === "bulletListItem"}
        onClick={() => setList("bulletListItem")}
      >
        <List size={14} strokeWidth={1.8} />
      </ToolbarButton>
      <ToolbarButton
        title="Lista numerada"
        active={blockType === "numberedListItem"}
        onClick={() => setList("numberedListItem")}
      >
        <ListOrdered size={14} strokeWidth={1.8} />
      </ToolbarButton>
      <ToolbarButton
        title="Lista de verificación"
        active={blockType === "checkListItem"}
        onClick={() => setList("checkListItem")}
      >
        <ListChecks size={14} strokeWidth={1.8} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Disminuir sangría" onClick={() => { editor.focus(); editor.unnestBlock(); }}>
        <IndentDecrease size={14} strokeWidth={1.8} />
      </ToolbarButton>
      <ToolbarButton title="Aumentar sangría" onClick={() => { editor.focus(); editor.nestBlock(); }}>
        <IndentIncrease size={14} strokeWidth={1.8} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Insertar enlace" onClick={handleLink} disabled={isList && false}>
        <LinkIcon size={14} strokeWidth={1.8} />
      </ToolbarButton>

      <ToolbarButton
        title={uploading ? "Subiendo imagen..." : "Insertar imagen"}
        onClick={handleImageClick}
        disabled={uploading}
      >
        <ImageIcon size={14} strokeWidth={1.8} />
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleImageSelected}
      />
    </div>
  );
}
