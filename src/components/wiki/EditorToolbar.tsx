import { ReactNode, useMemo } from "react";
import { Code, IndentDecrease, IndentIncrease, Link as LinkIcon, List, ListChecks, ListOrdered } from "lucide-react";
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

      <ToolbarButton title="Disminuir sangría" onClick={() => { editor.unnestBlock(); editor.focus(); }}>
        <IndentDecrease size={14} strokeWidth={1.8} />
      </ToolbarButton>
      <ToolbarButton title="Aumentar sangría" onClick={() => { editor.nestBlock(); editor.focus(); }}>
        <IndentIncrease size={14} strokeWidth={1.8} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Insertar enlace" onClick={handleLink} disabled={isList && false}>
        <LinkIcon size={14} strokeWidth={1.8} />
      </ToolbarButton>
    </div>
  );
}
