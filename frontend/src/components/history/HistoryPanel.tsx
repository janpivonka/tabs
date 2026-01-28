// src/components/history/HistoryPanel.tsx
import { useEffect, useRef } from "react";
import type { HistoryAction, HistoryActionType } from "../../hooks/useHistory";

interface HistoryPanelProps {
  history: HistoryAction[];
  historyIndex: number;
  containerRef: React.RefObject<HTMLDivElement>;
  jumpTo: (index: number) => void;
}

const getActionStyle = (type: HistoryActionType) => {
  switch (type) {
    case "row_add": return { icon: "✨", bg: "bg-emerald-50", label: "Přidání" };
    case "row_delete": return { icon: "🗑️", bg: "bg-rose-50", label: "Smazání" };
    case "rename": return { icon: "📝", bg: "bg-amber-50", label: "Přejmenování" };
    case "cell": return { icon: "✏️", bg: "bg-blue-50", label: "Úprava" };
    case "sync": return { icon: "☁️", bg: "bg-indigo-50", label: "Cloud Sync" };
    case "bulk_action": return { icon: "📦", bg: "bg-purple-50", label: "Hromadně" };
    default: return { icon: "🕒", bg: "bg-slate-50", label: "Akce" };
  }
};

export function HistoryPanel({ history, historyIndex, containerRef, jumpTo }: HistoryPanelProps) {
  const activeItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [historyIndex]);

  return (
    <div
      ref={containerRef}
      className="border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm max-h-48 overflow-y-auto flex flex-col transition-all duration-300 scrollbar-thin scrollbar-thumb-slate-300 select-none"
    >
      {history.length === 0 ? (
        <div className="px-6 py-4 text-[10px] text-slate-400 italic text-center uppercase tracking-widest font-bold">
          Žádné záznamy
        </div>
      ) : (
        [...history].reverse().map((h, idx) => {
          const realIdx = history.length - 1 - idx;
          const isCurrent = realIdx === historyIndex;
          const isFuture = realIdx > historyIndex;
          const style = getActionStyle(h.type);

          return (
            <div
              key={h.id}
              ref={isCurrent ? activeItemRef : null}
              onClick={() => jumpTo(realIdx)}
              className={`px-5 py-1.5 flex items-center gap-3 transition-all cursor-pointer border-l-[3px] relative ${
                isCurrent
                  ? "bg-white border-indigo-500 text-indigo-900 shadow-sm z-10"
                  : isFuture
                  ? "border-transparent text-slate-300 opacity-60 hover:opacity-100 hover:bg-slate-100"
                  : "border-transparent text-slate-500 hover:bg-slate-100/80"
              }`}
            >
              {/* ČAS */}
              <span className={`text-[9px] font-mono w-12 shrink-0 ${isCurrent ? "text-indigo-500 font-bold" : "text-slate-400"}`}>
                {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>

              {/* MINI IKONA */}
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 transition-transform ${
                style.bg} ${isFuture ? 'grayscale opacity-50' : ''}`}
              >
                {style.icon}
              </div>

              {/* TEXTY */}
              <div className="flex flex-col min-w-0 flex-1 leading-tight">
                <span className={`text-[11px] truncate ${isCurrent ? "font-bold" : "font-medium"}`}>
                  {h.description}
                </span>
                <span className="text-[8px] uppercase tracking-tighter opacity-40 font-bold">
                  {style.label}
                </span>
              </div>

              {/* INDIKÁTOR */}
              {isCurrent && (
                <div className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-600 text-[8px] font-black text-white shadow-sm shadow-indigo-200">
                  NYNÍ
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}