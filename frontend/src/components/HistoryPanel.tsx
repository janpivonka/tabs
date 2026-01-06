import type { TableAction } from "../hooks/useApp";

interface HistoryPanelProps {
  history: TableAction[];
  historyIndex: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function HistoryPanel({ history, historyIndex, containerRef }: HistoryPanelProps) {
  return (
    <div
      ref={containerRef}
      className="p-2 border-b max-h-40 overflow-y-auto text-sm flex flex-col bg-gray-50"
    >
      {[...history].reverse().map((h, idx) => {
        const realIdx = history.length - 1 - idx;
        const isCurrent = realIdx === historyIndex;

        return (
          <div
            key={h.id}
            className={`px-2 py-1.5 rounded transition-colors ${
              isCurrent
                ? "bg-blue-50 border-l-4 border-blue-400 text-blue-900 font-medium"
                : "hover:bg-gray-100 text-gray-700"
            }`}
            ref={isCurrent ? (el) => el && el.scrollIntoView({ behavior: "smooth", block: "center" }) : null}
          >
            <span className="text-xs text-gray-500 mr-2">{new Date(h.timestamp).toLocaleTimeString()}</span>
            <span>{h.description}</span>
          </div>
        );
      })}
    </div>
  );
}
