import type { TableAction } from "../../hooks/useApp";

interface HistoryPanelProps {
  history: TableAction[];
  historyIndex: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function HistoryPanel({ history, historyIndex, containerRef }: HistoryPanelProps) {
  return (
    <div
      ref={containerRef}
      className="border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm max-h-40 overflow-y-auto flex flex-col transition-all duration-300 scrollbar-thin scrollbar-thumb-slate-200"
    >
      {[...history].reverse().map((h, idx) => {
        const realIdx = history.length - 1 - idx;
        const isCurrent = realIdx === historyIndex;

        return (
          <div
            key={h.id}
            ref={isCurrent ? (el) => el && el.scrollIntoView({ behavior: "smooth", block: "center" }) : null}
            className={`px-6 py-2 flex items-center gap-4 transition-all border-l-4 ${
              isCurrent
                ? "bg-white border-indigo-500 text-indigo-900 shadow-sm"
                : "border-transparent text-slate-600 hover:bg-slate-100/50"
            }`}
          >
            <span className={`text-[10px] font-mono w-16 ${isCurrent ? "text-indigo-500 font-bold" : "text-slate-400"}`}>
              {new Date(h.timestamp).toLocaleTimeString()}
            </span>

            <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? "bg-indigo-500 ring-4 ring-indigo-100" : "bg-slate-300"}`} />

            <span className={`text-xs ${isCurrent ? "font-semibold" : "font-normal"}`}>
              {h.description}
            </span>

            {isCurrent && (
              <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-indigo-400">
                Active
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}