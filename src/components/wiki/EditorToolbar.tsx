import { ReactNode, useMemo } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import { useActiveStyles, useSelectedBlocks } from "@blocknote/react";

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

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const activeStyles = useActiveStyles(editor);
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
    editor.toggleStyles({ [style]: true } as never);
    editor.focus();
  };

  const setList = (type: "bulletListItem" | "numberedListItem" | "checkListItem") => {
    const block = editor.getTextCursorPosition().block;
    if (!block) return;
    if (block.type === type) {
      editor.updateBlock(block, { type: "paragraph" });
    } else {
      editor.updateBlock(block, { type });
    }
    editor.focus();
  };

  const handleLink = () => {
    const url = window.prompt("URL del enlace");
    if (!url) return;
    const text = window.getSelection()?.toString();
    if (text && text.length > 0) {
      editor.createLink(url);
    } else {
      editor.createLink(url, url);
    }
    editor.focus();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface px-3 py-2">
      <select
        value={blockSelectValue}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          applyBlockOption(editor, e.target.value);
          editor.focus();
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
        title="Negrita (Ctrl+B)"
        active={!!activeStyles.bold}
        onClick={() => toggleStyle("bold")}
      >
        <span className="font-bold">N</span>
      </ToolbarButton>
      <ToolbarButton
        title="Cursiva (Ctrl+I)"
        active={!!activeStyles.italic}
        onClick={() => toggleStyle("italic")}
      >
        <span className="italic">C</span>
      </ToolbarButton>
      <ToolbarButton
        title="Subrayado (Ctrl+U)"
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
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M5 4L1 8l4 4M11 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Lista con viñetas"
        active={blockType === "bulletListItem"}
        onClick={() => setList("bulletListItem")}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="3" cy="4" r="1" fill="currentColor" />
          <circle cx="3" cy="8" r="1" fill="currentColor" />
          <circle cx="3" cy="12" r="1" fill="currentColor" />
          <path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        title="Lista numerada"
        active={blockType === "numberedListItem"}
        onClick={() => setList("numberedListItem")}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <text x="1" y="6" fontSize="5" fill="currentColor" fontFamily="Inter, sans-serif">1.</text>
          <text x="1" y="11" fontSize="5" fill="currentColor" fontFamily="Inter, sans-serif">2.</text>
          <text x="1" y="16" fontSize="5" fill="currentColor" fontFamily="Inter, sans-serif">3.</text>
          <path d="M6 4h8M6 9h8M6 14h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        title="Lista de verificación"
        active={blockType === "checkListItem"}
        onClick={() => setList("checkListItem")}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="2" width="4" height="4" stroke="currentColor" strokeWidth="1.4" rx="0.6" />
          <rect x="1" y="7" width="4" height="4" stroke="currentColor" strokeWidth="1.4" rx="0.6" />
          <path d="M1.6 9l1 1 1.6-1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 4h8M7 9h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Disminuir sangría" onClick={() => { editor.unnestBlock(); editor.focus(); }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M14 3H2M14 13H2M14 8H6M5 6L2 8l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </ToolbarButton>
      <ToolbarButton title="Aumentar sangría" onClick={() => { editor.nestBlock(); editor.focus(); }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M14 3H2M14 13H2M14 8H6M3 6l3 2-3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Insertar enlace" onClick={handleLink} disabled={isList && false}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M7 9a3 3 0 004 0l2-2a3 3 0 10-4-4l-1 1M9 7a3 3 0 00-4 0L3 9a3 3 0 104 4l1-1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ToolbarButton>
    </div>
  );
}
