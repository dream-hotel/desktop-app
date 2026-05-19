import { useState, useEffect } from "react";

export default function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <footer className="flex h-8 w-full shrink-0 items-center justify-between border-t border-border bg-white px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-[6px] font-inter text-[11px] leading-[16.5px] text-text-secondary">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="3" width="10" height="7" rx="1" stroke="#6b7280" strokeWidth="1" />
            <path d="M3 3V2a3 3 0 016 0v1" stroke="#6b7280" strokeWidth="1" />
          </svg>
          <span>Base de Datos Local: Sincronizada</span>
          <span className="h-[6px] w-[6px] rounded-full bg-teal" />
        </div>
        <div className="flex items-center gap-[6px] font-inter text-[11px] leading-[16.5px] text-text-secondary">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4" stroke="#6b7280" strokeWidth="1" />
            <path d="M6 3v3l2 1.5" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span>Online</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-inter text-[11px] text-text-secondary">Vista de Operador</span>
        <div className="h-3 w-px bg-black/10" />
        <div className="flex items-center gap-[6px] font-inter text-[11px] text-text-secondary">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#6b7280" strokeWidth="1" />
            <path d="M6 3v3l2 1" stroke="#6b7280" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span>{formattedTime}</span>
        </div>
      </div>
    </footer>
  );
}
