import {
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";

export interface DropdownOption<T extends string | number> {
  value: T;
  label: ReactNode;
  /** Plain-text fallback used for the trigger label and type-ahead when
   *  `label` is a rich node. Optional. */
  searchText?: string;
  disabled?: boolean;
}

interface DropdownProps<T extends string | number> {
  value: T | null | undefined;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: ReactNode;
  disabled?: boolean;
  invalid?: boolean;
  /** Width / positioning on the root wrapper (e.g. "w-full", "w-[200px]"). */
  className?: string;
  /** Fully overrides the trigger styling when provided. */
  triggerClassName?: string;
  menuClassName?: string;
  size?: "sm" | "md";
  id?: string;
  ariaLabel?: string;
  title?: string;
  onBlur?: () => void;
  /** Needed inside rich-text editors so opening doesn't steal selection. */
  stopMouseDown?: boolean;
}

const SIZES = {
  md: "rounded-[10px] px-3 py-2 text-[13px]",
  sm: "rounded-[8px] px-2.5 py-1.5 text-[12px]",
} as const;

function optionText<T extends string | number>(o: DropdownOption<T>): string {
  if (o.searchText) return o.searchText;
  if (typeof o.label === "string" || typeof o.label === "number") return String(o.label);
  return "";
}

export default function Dropdown<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  disabled = false,
  invalid = false,
  className = "",
  triggerClassName,
  menuClassName = "",
  size = "md",
  id,
  ariaLabel,
  title,
  onBlur,
  stopMouseDown = false,
}: DropdownProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const typeahead = useRef<{ buffer: string; ts: number }>({ buffer: "", ts: 0 });

  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [active, setActive] = useState<number>(-1);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : firstEnabled(options));
    setOpen(true);
  }, [disabled, options, selectedIndex]);

  // Decide whether the menu should flip above the trigger.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimated = Math.min(options.length * 34 + 10, 264);
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpenUp(spaceBelow < estimated && rect.top > spaceBelow);
  }, [open, options.length]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (open && active >= 0) optionRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  // Close on outside click / Escape / resize.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onWinChange = () => close();
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("resize", onWinChange);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("resize", onWinChange);
    };
  }, [open, close]);

  const commit = (idx: number) => {
    const opt = options[idx];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    close();
    triggerRef.current?.focus();
  };

  const move = (dir: 1 | -1) => {
    if (!options.length) return;
    let i = active;
    for (let step = 0; step < options.length; step++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i].disabled) break;
    }
    setActive(i);
  };

  const handleTypeahead = (key: string) => {
    const now = Date.now();
    const buffer = now - typeahead.current.ts > 700 ? key : typeahead.current.buffer + key;
    typeahead.current = { buffer, ts: now };
    const match = options.findIndex(
      (o) => !o.disabled && optionText(o).toLowerCase().startsWith(buffer.toLowerCase()),
    );
    if (match >= 0) {
      setActive(match);
      if (!open) commit(match);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        open ? move(1) : openMenu();
        break;
      case "ArrowUp":
        e.preventDefault();
        open ? move(-1) : openMenu();
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(firstEnabled(options));
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(lastEnabled(options));
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        open ? commit(active) : openMenu();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          close();
        }
        break;
      case "Tab":
        if (open) close();
        break;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          handleTypeahead(e.key);
        }
    }
  };

  const triggerCls =
    triggerClassName ??
    [
      "flex w-full items-center justify-between gap-2 border font-inter outline-none transition-colors",
      SIZES[size],
      "bg-surface text-text-primary",
      invalid ? "border-danger" : "border-border hover:border-border-strong",
      open && !invalid ? "border-primary/50" : "",
      disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        className={triggerCls}
        onMouseDown={stopMouseDown ? (e) => e.stopPropagation() : undefined}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        <span className={`truncate ${selected ? "" : "text-text-secondary"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={size === "sm" ? 14 : 16}
          strokeWidth={2}
          className={`shrink-0 text-text-secondary transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute z-50 max-h-[264px] min-w-full overflow-auto rounded-[10px] border border-border-strong bg-surface p-1 shadow-lg shadow-black/10 ${
            openUp ? "bottom-full mb-1" : "top-full mt-1"
          } ${menuClassName}`}
          onKeyDown={onKeyDown}
        >
          {options.length === 0 && (
            <div className="px-2.5 py-2 font-inter text-[12px] text-text-secondary">
              Sin opciones
            </div>
          )}
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === active;
            return (
              <button
                key={String(opt.value)}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={opt.disabled}
                className={[
                  "flex w-full items-center justify-between gap-2 rounded-[7px] px-2.5 py-1.5 text-left font-inter text-[13px] transition-colors",
                  opt.disabled
                    ? "cursor-not-allowed text-text-secondary opacity-50"
                    : isSelected
                    ? "bg-primary-light font-medium text-primary"
                    : isActive
                    ? "bg-surface-hover text-text-primary"
                    : "text-text-body hover:bg-surface-hover",
                ].join(" ")}
                onMouseEnter={() => !opt.disabled && setActive(i)}
                onClick={() => commit(i)}
              >
                <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                {isSelected && <Check size={14} strokeWidth={2.5} className="shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function firstEnabled<T extends string | number>(options: DropdownOption<T>[]): number {
  const i = options.findIndex((o) => !o.disabled);
  return i;
}

function lastEnabled<T extends string | number>(options: DropdownOption<T>[]): number {
  for (let i = options.length - 1; i >= 0; i--) if (!options[i].disabled) return i;
  return -1;
}
