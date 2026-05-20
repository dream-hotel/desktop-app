import { useEffect, useMemo, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { es as blocknoteEs } from "@blocknote/core/locales";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface MarkdownViewProps {
  markdown: string;
}

export default function MarkdownView({ markdown }: MarkdownViewProps) {
  const editor = useCreateBlockNote({ dictionary: blocknoteEs });
  const [ready, setReady] = useState(false);

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
    () => ({
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
    }),
    [],
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
