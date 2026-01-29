// src/components/history/HistoryPanel.tsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { HistoryAction, HistoryActionType } from "../../hooks/useHistory";
import { ActionModal } from "../common/ActionModal";

interface HistoryPanelProps {
  history: HistoryAction[];
  historyIndex: number;
  containerRef: React.RefObject<HTMLDivElement>;
  jumpTo: (index: number) => void;
  onClearHistory?: () => void;
}

/** * DESCRIPTION FORMATTING */
const formatDescription = (text: string, isCurrent: boolean) => {
  const tableTagRegex = /^(\[.*?\])/;
  let parts: React.ReactNode[] = [];
  let workingText = text;

  const tableMatch = workingText.match(tableTagRegex);
  if (tableMatch) {
    parts.push(
      <span key="tag" className={`font-black mr-1.5 ${isCurrent ? 'text-purple-600' : 'text-purple-400'}`}>
        {tableMatch[1]}
      </span>
    );
    workingText = workingText.replace(tableTagRegex, "").trim();
  }

  const subParts = workingText.split(/(\s->\s|\s\(.*?\))/g);
  subParts.forEach((part, i) => {
    if (part.includes("->")) {
      parts.push(<span key={i} className="mx-1 text-slate-400 font-light">→</span>);
    } else if (part.startsWith(" (") && part.endsWith(")")) {
      parts.push(
        <span key={i} className={`text-[10px] ml-1 px-1.5 py-0.5 rounded-md font-mono tracking-tighter ${
          isCurrent ? 'bg-purple-100/50 text-purple-700' : 'bg-slate-100/50 text-slate-500'
        }`}>
          {part.trim()}
        </span>
      );
    } else {
      parts.push(<span key={i}>{part}</span>);
    }
  });
  return parts;
};

/** * ACTION STYLES */
const getActionStyle = (type: HistoryActionType) => {
  switch (type) {
    case "row_add": return { icon: "＋", color: "text-emerald-500", label: "Initialization", bg: "bg-emerald-500/10" };
    case "row_delete": return { icon: "－", color: "text-rose-500", label: "Deletion", bg: "bg-rose-500/10" };
    case "rename": return { icon: "✎", color: "text-amber-500", label: "Refactor", bg: "bg-amber-500/10" };
    case "cell": return { icon: "⋅", color: "text-blue-500", label: "Data Mutation", bg: "bg-blue-500/10" };
    case "sync": return { icon: "◈", color: "text-purple-500", label: "Cloud Ingest", bg: "bg-purple-500/10" };
    case "bulk_action": return { icon: "≡", color: "text-fuchsia-500", label: "Bulk Procedure", bg: "bg-fuchsia-500/10" };
    default: return { icon: "○", color: "text-slate-400", label: "Action", bg: "bg-slate-500/10" };
  }
};

export function HistoryPanel({ history, historyIndex, containerRef, jumpTo, onClearHistory }: HistoryPanelProps) {
  const activeItemRef = useRef<HTMLDivElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [historyIndex]);

  const handlePurge = () => {
    // 1. Spustíme animaci vytrácení v panelu
    setIsPurging(true);

    // 2. Počkáme na doznění animace (ladí s časem v App.tsx)
    setTimeout(() => {
      onClearHistory?.();
      setIsPurging(false);
      setShowClearConfirm(false);
    }, 600);
  };

  return (
    <div className="flex flex-col bg-white/40 backdrop-blur-2xl border-b border-white/40 shadow-xl select-none">

      {/* PORTAL CONFIRMATION MODAL */}
      {showClearConfirm && createPortal(
        <ActionModal
          title="Delete Logs?"
          description={
            <div className="space-y-1">
              <p>You are about to clear all recorded history entries.</p>
              <p className="text-red-500/60 text-[10px] lowercase italic font-bold tracking-wider">this action cannot be undone</p>
            </div>
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handlePurge}
          onCancel={() => setShowClearConfirm(false)}
        />,
        document.body
      )}

      {/* HEADER BAR */}
      <div className="px-8 py-1.5 flex justify-between items-center border-b border-white/20 bg-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-slate-400 opacity-40" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Audit Trail</span>
        </div>

        {history.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowClearConfirm(true);
            }}
            className="group relative px-3 py-0.5 rounded transition-all duration-300"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-rose-100/60" />
            <span className="relative z-10 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-rose-500 transition-colors">
              Clear [×]
            </span>
          </button>
        )}
      </div>

      {/* LOG LIST */}
      <div
        ref={containerRef}
        className={`max-h-60 overflow-y-auto flex flex-col scrollbar-none transition-all duration-700 ${isPurging ? 'animate-transfer-out pointer-events-none' : ''}`}
      >
        <div className="py-2">
          {history.length === 0 ? (
            <div className="px-8 py-10 flex flex-col items-center gap-2 opacity-40">
              <span className="text-lg text-slate-400">✦</span>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Empty</p>
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
                  className={`group px-8 py-2.5 flex items-center gap-6 transition-all cursor-pointer relative border-l-2 ${
                    isCurrent
                      ? "bg-white/80 border-pink-500 shadow-sm z-10"
                      : isFuture
                      ? "opacity-25 grayscale border-transparent hover:opacity-50"
                      : "hover:bg-purple-50/60 border-transparent"
                  }`}
                >
                  {/* TIMESTAMP */}
                  <div className="flex flex-col shrink-0 min-w-[50px]">
                    <span className={`text-[10px] font-mono tracking-tighter ${isCurrent ? "text-pink-600 font-black" : "text-slate-400 font-bold"}`}>
                      {new Date(h.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-[7px] text-slate-300 font-black uppercase tracking-[0.2em]">Timestamp</span>
                  </div>

                  {/* ACTION ICON */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 transition-all duration-300 ${isCurrent ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rotate-6 scale-110 shadow-lg shadow-pink-200' : `${style.bg} ${style.color} group-hover:scale-105 group-hover:bg-white`}`}>
                     {isCurrent ? <span className="animate-pulse">✦</span> : <span>{style.icon}</span>}
                  </div>

                  {/* DESCRIPTION */}
                  <div className="flex flex-col min-w-0 flex-1 leading-tight">
                    <div className="text-[11px] truncate tracking-tight text-slate-700">
                      {formatDescription(h.description, isCurrent)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[8px] font-black tracking-[0.15em] uppercase ${isCurrent ? 'text-pink-500' : 'text-slate-400 group-hover:text-purple-500'}`}>
                        {style.label}
                      </span>
                      {isCurrent && <div className="w-1 h-1 rounded-full bg-pink-500 animate-ping" />}
                    </div>
                  </div>

                  {/* STATUS BADGE */}
                  <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                    isCurrent
                      ? "bg-pink-500 text-white border-pink-500"
                      : isFuture
                      ? "border-slate-100 text-slate-300"
                      : "border-slate-200 text-slate-400 group-hover:border-purple-200 group-hover:text-purple-600 group-hover:bg-white"
                  }`}>
                    {isCurrent ? "Active" : isFuture ? "Fwd" : "Log"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}