import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, Users as UsersIcon, X } from "lucide-react";

export interface AudienceOption {
  id: number;
  label: string;
  sublabel?: string;
}

interface AudiencePickerProps {
  placeholder: string;
  emptyLabel: string;
  options: AudienceOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function AudiencePicker({
  placeholder,
  emptyLabel,
  options,
  selectedIds,
  onChange,
  disabled = false,
  loading = false,
}: AudiencePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(q)),
    );
  }, [options, query]);

  const selectedOptions = useMemo(
    () => options.filter((o) => selectedSet.has(o.id)),
    [options, selectedSet],
  );

  function toggle(id: number) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function removeChip(id: number) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-border bg-bg px-3 py-2 font-inter text-[12.5px] text-text-secondary outline-none transition-colors hover:border-primary/40 hover:bg-surface focus:border-primary/50 focus:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate">
          {selectedOptions.length === 0
            ? placeholder
            : `${selectedOptions.length} seleccionado${selectedOptions.length === 1 ? "" : "s"}`}
        </span>
        <ChevronDown size={14} strokeWidth={1.8} className="shrink-0" />
      </button>

      {selectedOptions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {selectedOptions.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-[2px] font-inter text-[11px] text-primary"
            >
              <span className="truncate">{opt.label}</span>
              <button
                type="button"
                onClick={() => removeChip(opt.id)}
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full hover:bg-primary/20"
                aria-label={`Quitar ${opt.label}`}
              >
                <X size={9} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-border bg-surface shadow-[0px_12px_28px_rgba(0,0,0,0.18)]">
          <div className="relative border-b border-border">
            <Search
              size={14}
              strokeWidth={1.8}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-transparent py-2 pl-9 pr-3 font-inter text-[12.5px] text-text-primary outline-none placeholder:text-text-secondary"
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-3 font-inter text-[12px] text-text-secondary">
                <UsersIcon size={13} strokeWidth={1.8} />
                Cargando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-3 font-inter text-[12px] text-text-secondary">
                {emptyLabel}
              </div>
            ) : (
              filtered.map((opt) => {
                const checked = selectedSet.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(opt.id)}
                    className={`flex w-full items-center gap-2 border-b border-border/50 px-3 py-2 text-left transition-colors last:border-b-0 ${
                      checked ? "bg-primary/5" : "hover:bg-primary/5"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface"
                      }`}
                    >
                      {checked && <Check size={10} strokeWidth={2.6} />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-inter text-[12.5px] text-text-primary">
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span className="truncate font-inter text-[11px] text-text-secondary">
                          {opt.sublabel}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
