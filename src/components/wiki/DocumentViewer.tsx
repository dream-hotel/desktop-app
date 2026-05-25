import { useEffect, useState } from "react";
import { FileText, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { getAccessToken } from "../../service/apiClient";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
}

type ViewState = 
  | { type: "loading" }
  | { type: "pdf"; url: string }
  | { type: "word"; html: string }
  | { type: "excel"; data: any[][] }
  | { type: "error"; message: string };

export default function DocumentViewer({ fileUrl, fileName }: DocumentViewerProps) {
  const [view, setView] = useState<ViewState>({ type: "loading" });

  const getFullUrl = (url: string) => {
    if (url.startsWith("http")) return url;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const loadDocument = async () => {
      console.log("[DocumentViewer] Iniciando carga de:", fileName);
      setView({ type: "loading" });
      
      try {
        const fullUrl = getFullUrl(fileUrl);
        const token = getAccessToken();
        
        console.log("[DocumentViewer] Usando Tauri Native HTTP para bypass de CORS...");
        const response = await tauriFetch(fullUrl, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error(`Servidor respondió con status ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const blobData = new Blob([arrayBuffer]);
        console.log("[DocumentViewer] Bytes recibidos:", blobData.size);

        const ext = fileUrl.split(".").pop()?.split(/[#?]/)[0].toLowerCase();
        console.log("[DocumentViewer] Extensión detectada:", ext);

        if (cancelled) {
          console.log("[DocumentViewer] Petición terminada pero el componente ya se desmontó.");
          return;
        }

        if (ext === "pdf") {
          console.log("[DocumentViewer] Creando Blob URL para PDF...");
          const pdfBlob = new Blob([arrayBuffer], { type: "application/pdf" });
          objectUrl = URL.createObjectURL(pdfBlob);
          console.log("[DocumentViewer] Blob URL generado:", objectUrl);
          setView({ type: "pdf", url: objectUrl });
        } 
        else if (ext === "docx" || ext === "doc") {
          console.log("[DocumentViewer] Procesando Word con Mammoth...");
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setView({ type: "word", html: result.value });
        }
        else if (ext === "xlsx" || ext === "xls") {
          console.log("[DocumentViewer] Procesando Excel con SheetJS...");
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          setView({ type: "excel", data });
        }
        else {
          setView({ type: "error", message: `Formato .${ext} no soportado.` });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[DocumentViewer] ERROR:", err);
          setView({ type: "error", message: err instanceof Error ? err.message : "Error al cargar." });
        }
      }
    };

    loadDocument();

    return () => {
      cancelled = true;
      if (objectUrl) {
        console.log("[DocumentViewer] Limpiando Blob URL:", objectUrl);
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileUrl]); // Quitamos fileName para evitar re-renders si el título cambia levemente

  if (view.type === "loading") {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-text-secondary">
        <Loader2 className="animate-spin" size={32} strokeWidth={1.5} />
        <span className="font-inter text-[13px]">Procesando documento...</span>
      </div>
    );
  }

  if (view.type === "error") {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertCircle size={24} />
        </div>
        <p className="font-inter text-[14px] font-medium text-text-primary">{view.message}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-bg/30">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-2 overflow-hidden">
          {view.type === "pdf" && <FileText size={16} className="shrink-0 text-danger" />}
          {view.type === "word" && <FileText size={16} className="shrink-0 text-primary" />}
          {view.type === "excel" && <FileSpreadsheet size={16} className="shrink-0 text-success" />}
          <span className="truncate font-inter text-[12px] font-medium text-text-primary">
            {fileName}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-surface">
        {view.type === "pdf" && (
          <div className="h-full w-full bg-white">
            <object
              key={view.url}
              data={view.url}
              type="application/pdf"
              className="h-full w-full"
            >
              <embed src={view.url} type="application/pdf" />
              <div className="flex h-full items-center justify-center p-10 text-center">
                <p className="font-inter text-[13px] text-text-secondary">
                  Tu sistema no permite previsualizar PDFs incrustados.
                </p>
              </div>
            </object>
          </div>
        )}

        {view.type === "word" && (
          <div 
            className="prose prose-sm prose-slate max-w-none p-8 font-inter dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: view.html }}
          />
        )}

        {view.type === "excel" && (
          <div className="min-w-full p-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left font-inter text-[12px]">
              <tbody>
                {view.data.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-border hover:bg-bg/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className={`border-r border-border px-3 py-2 ${rIdx === 0 ? "bg-bg/80 font-semibold" : ""}`}>
                        {cell?.toString() || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
