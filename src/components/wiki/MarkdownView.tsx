import { useEffect, useMemo, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { es as blocknoteEs } from "@blocknote/core/locales";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useTheme } from "../../hooks/useTheme";

interface MarkdownViewProps {
  markdown: string;
}

const LIGHT_THEME = {
  colors: {
    editor: { text: "#1a1a1a", background: "#ffffff" },
    menu: { text: "#1a1a1a", background: "#ffffff" },
    tooltip: { text: "#ffffff", background: "#1a1a1a" },
    hovered: { text: "#1a1a1a", background: "#f5f0fb" },
    selected: { text: "#492173", background: "#f5f0fb" },
    disabled: { text: "#9ca3af", background: "#fbfbfb" },
    shadow: "#0000001a",
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
};

const DARK_THEME = {
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
};

export default function MarkdownView({ markdown }: MarkdownViewProps) {
  const editor = useCreateBlockNote({ dictionary: blocknoteEs });
  const [ready, setReady] = useState(false);
  const { resolved } = useTheme();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(markdown || "");
      if (cancelled) return;
      editor.replaceBlocks(editor.document, blocks.length > 0 ? blocks : [{ type: "paragraph" }]);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [markdown, editor]);

  const theme = useMemo(
    () => (resolved === "dark" ? DARK_THEME : LIGHT_THEME),
    [resolved],
  );

  if (!ready) {
    return (
      <div className="px-2 py-4 font-inter text-[13px] text-text-secondary">
        Cargando contenido...
      </div>
    );
  }

  return (
    <div className="bn-compact bn-read-only -mx-2">
      <BlockNoteView editor={editor} editable={false} theme={theme as never} />
    </div>
  );
}
