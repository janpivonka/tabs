// src/components/table/TableEditor.tsx
import { useState } from "react";
import type { TableData } from "../../lib/storage";
import { useTableEditor } from "../../hooks/useTableEditor";
import { ActionModal } from "../common/ActionModal";

export function TableEditor({
  table,
  onUpdate,
  onSave,
  onExport,
  isSyncing,
}: {
  table: TableData;
  onUpdate: (updated: TableData, description?: string) => void;
  onSave: () => void;
  onExport: () => void;
  isSyncing?: boolean;
}) {
  const [activeModal, setActiveModal] = useState<{
    type: "delete_row" | "delete_col" | "save";
    title: string;
    description: string | React.ReactNode;
  } | null>(null);

  const [editingValue, setEditingValue] = useState<{ r: number; c: number; val: string } | null>(null);
  const [purgingRow, setPurgingRow] = useState<number | null>(null);
  const [purgingCol, setPurgingCol] = useState<number | null>(null);

  if (!table) return null;

  const normalizedTable: TableData = {
    ...table,
    rows: table.rows.map((r) => {
      const row: string[] = Array(table.columns.length).fill("");
      row[0] = r[0];
      for (let i = 1; i < table.columns.length; i++) {
        row[i] = r[i] ?? "";
      }
      return row;
    }),
  };

  const {
    selectedCell,
    setSelectedCell,
    updateCell,
    updateColumnName,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
  } = useTableEditor(normalizedTable, onUpdate);

  const handleCellChange = (rIdx: number, cIdx: number, value: string) => {
    updateCell(rIdx, cIdx, value); // Popis si bere hook automaticky
  };

  const handleConfirmAction = () => {
    if (!activeModal) return;

    if (activeModal.type === "save") {
      onSave();
    } else if (activeModal.type === "delete_row") {
      if (selectedCell) {
        setPurgingRow(selectedCell.row);
        setTimeout(() => {
          deleteRow();
          setPurgingRow(null);
          setSelectedCell(null);
        }, 400);
      }
    } else if (activeModal.type === "delete_col") {
      if (selectedCell) {
        setPurgingCol(selectedCell.col);
        setTimeout(() => {
          deleteColumn();
          setPurgingCol(null);
          setSelectedCell(null);
        }, 400);
      }
    }

    setActiveModal(null);
  };

  return (
    <div className={`p-8 w-full min-h-full flex flex-col relative z-10 transition-all duration-700 ${isSyncing ? 'scale-[0.99] blur-[0.5px]' : ''}`}>

      <style>{`
        @keyframes peony-reveal {
          0% { opacity: 0; transform: translateY(40px) scale(0.95); filter: blur(15px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes peony-row-in {
          0% { opacity: 0; transform: scaleY(0.7); filter: blur(10px); background: rgba(168, 85, 247, 0.05); }
          100% { opacity: 1; transform: scaleY(1); filter: blur(0); background: transparent; }
        }
        @keyframes peony-exit {
          0% { opacity: 1; transform: scale(1); filter: blur(0); }
          100% { opacity: 0; transform: scale(0.9) translateY(-10px); filter: blur(12px); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-150%) skewX(-25deg); }
          100% { transform: translateX(150%) skewX(-25deg); }
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
        }

        .animate-peony-in { animation: peony-reveal 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-row-in { animation: peony-row-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; transform-origin: top; }
        .animate-exit { animation: peony-exit 0.4s cubic-bezier(0.4, 0, 1, 1) forwards; pointer-events: none; }
        .animate-star { display: inline-block; animation: star-twinkle 0.8s infinite ease-in-out; }

        .peony-transition { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .peony-add-btn { border: 1px solid transparent; }
        .peony-add-btn:hover { background: white !important; transform: translateY(-1px); }
        .peony-add-row-btn:hover { border-color: #a855f7 !important; color: #a855f7 !important; }
        .peony-add-col-btn:hover { border-color: #ec4899 !important; color: #ec4899 !important; }

        .peony-del-btn:not(:disabled):hover {
          background: radial-gradient(circle, #ef4444 0%, #b91c1c 100%) !important;
          color: white !important;
          border-color: transparent !important;
          transform: translateY(-1px);
        }

        .peony-export-btn { border: 1px solid rgba(255, 255, 255, 0.6); }
        .peony-export-btn:hover {
          border-color: #a855f7 !important;
          color: #a855f7 !important;
          background: white !important;
          transform: translateY(-1px);
        }
        .peony-save-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }

        .delay-1 { animation-delay: 0.2s; opacity: 0; }
        .delay-2 { animation-delay: 0.4s; opacity: 0; }
      `}</style>

      {/* 1. GLASS TOOLBAR */}
      <div className={`mb-8 flex gap-3 flex-wrap items-center bg-white/30 backdrop-blur-xl p-2 rounded-[2rem] border border-white/40 shadow-2xl shadow-purple-500/5 sticky top-0 z-20 animate-peony-in ${isSyncing ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="flex bg-white/40 p-1 rounded-2xl border border-white/20">
          <button onClick={() => addRow("above")} className="peony-transition peony-add-btn peony-add-row-btn px-4 py-2 rounded-xl text-[11px] font-black text-slate-600 uppercase tracking-tighter active:scale-95">Row ↑</button>
          <button onClick={() => addRow("below")} className="peony-transition peony-add-btn peony-add-row-btn px-4 py-2 rounded-xl text-[11px] font-black text-slate-600 uppercase tracking-tighter active:scale-95">Row ↓</button>
          <div className="w-px h-4 bg-white/40 self-center mx-1" />
          <button onClick={() => addColumn("before")} className="peony-transition peony-add-btn peony-add-col-btn px-4 py-2 rounded-xl text-[11px] font-black text-slate-600 uppercase tracking-tighter active:scale-95">Col ←</button>
          <button onClick={() => addColumn("after")} className="peony-transition peony-add-btn peony-add-col-btn px-4 py-2 rounded-xl text-[11px] font-black text-slate-600 uppercase tracking-tighter active:scale-95">Col →</button>
        </div>

        <div className="flex bg-red-50/10 p-1 rounded-2xl border border-red-100/10 gap-1">
          <button
            disabled={!selectedCell}
            onClick={() => setActiveModal({
              type: "delete_row",
              title: "Terminate Row",
              description: "This action will permanently remove the record from the current instance."
            })}
            className={`peony-transition peony-del-btn px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 ${selectedCell ? 'bg-white/60 text-red-500 shadow-sm active:scale-95' : 'opacity-10 text-slate-400'}`}
          >
            Del Row
          </button>
          <button
            disabled={!selectedCell || selectedCell.col === 0}
            onClick={() => setActiveModal({
              type: "delete_col",
              title: "Drop Column",
              description: "Warning: All data within this column will be discarded across the entire table structure."
            })}
            className={`peony-transition peony-del-btn px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 ${(selectedCell && selectedCell.col !== 0) ? 'bg-white/60 text-red-500 shadow-sm active:scale-95' : 'opacity-10 text-slate-400'}`}
          >
            Del Col
          </button>
        </div>

        <div className="flex gap-2 ml-auto">
          <button onClick={onExport} className="peony-transition peony-export-btn px-6 py-2.5 bg-white/40 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 shadow-sm">
            Export
          </button>
          <button
            onClick={() => setActiveModal({
              type: "save",
              title: "Cloud Migration",
              description: "Initiate synchronization sequence to commit local changes to the remote database?"
            })}
            className="peony-transition peony-save-btn px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl text-[11px] font-black shadow-lg shadow-emerald-200/40 uppercase tracking-[0.2em] active:scale-95 flex items-center gap-2"
          >
            Save Table
          </button>
        </div>
      </div>

      {/* 2. TRANSPARENT GRID TABLE */}
      <div className="relative border-2 border-white/40 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white/10 backdrop-blur-md animate-peony-in delay-1">

        {/* SHIMMER OVERLAY */}
        {isSyncing && (
          <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{ animation: 'shimmer-sweep 1.2s infinite' }}
            />
          </div>
        )}

        <table className={`w-full border-collapse table-fixed transition-opacity duration-500 ${isSyncing ? 'opacity-40' : 'opacity-100'}`}>
          <thead>
            <tr className="bg-white/40 border-b-2 border-slate-300/40">
              {normalizedTable.columns.map((col, i) => (
                <th
                  key={`col-static-${i}`}
                  className={`border-r-2 border-slate-300/40 last:border-0 p-0 ${i === 0 ? 'w-20' : ''} ${purgingCol === i ? 'animate-exit' : ''}`}
                >
                  <input
                    value={editingValue?.r === -1 && editingValue?.c === i ? editingValue.val : col}
                    readOnly={i === 0 || isSyncing}
                    onChange={e => setEditingValue({ r: -1, c: i, val: e.target.value })}
                    onBlur={() => { if (editingValue?.r === -1) { updateColumnName(i, editingValue.val); setEditingValue(null); } }}
                    className={`peony-transition w-full bg-transparent px-4 py-5 outline-none text-[10px] font-black uppercase tracking-[0.2em] text-center ${i === 0 ? 'text-slate-400/50' : 'text-purple-800/70 focus:text-purple-600'}`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalizedTable.rows.map((row, rIdx) => (
              <tr
                key={row[0]}
                className={`group border-b-2 border-slate-300/30 last:border-0 animate-row-in ${purgingRow === rIdx ? 'animate-exit' : ''}`}
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={`cell-${cIdx}`}
                    className={`peony-transition border-r-2 border-slate-300/30 last:border-0 p-0 relative
                      ${selectedCell?.row === rIdx && selectedCell?.col === cIdx ? "bg-white/40 z-10" : "hover:bg-white/10"}
                      ${purgingCol === cIdx ? 'animate-exit' : ''}
                    `}
                    onClick={() => !isSyncing && setSelectedCell({ row: rIdx, col: cIdx })}
                  >
                    {selectedCell?.row === rIdx && selectedCell?.col === cIdx && (
                      <div className="absolute inset-0 ring-2 ring-purple-400/50 ring-inset pointer-events-none shadow-[0_0_15px_rgba(168,85,247,0.1)]" />
                    )}

                    {cIdx === 0 ? (
                      <div className="relative h-full w-full min-h-[52px] flex items-center justify-center overflow-hidden">
                        <div className={`px-4 py-4 text-[10px] font-black font-mono tracking-wider select-none bg-white/5 transition-all duration-500 ${isSyncing ? 'opacity-0 scale-50' : 'opacity-1 text-slate-400/40'}`}>
                          {cell}
                        </div>
                        {isSyncing && (
                          <div className="absolute inset-0 flex items-center justify-center gap-1.5">
                            {[1, 2, 3].map((i) => (
                              <span
                                key={i}
                                className="animate-star text-pink-500 font-bold text-[14px]"
                                style={{ animationDelay: `${i * 0.15}s` }}
                              >
                                ✦
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        value={editingValue?.r === rIdx && editingValue?.c === cIdx ? editingValue.val : cell}
                        readOnly={isSyncing}
                        onChange={e => setEditingValue({ r: rIdx, c: cIdx, val: e.target.value })}
                        onBlur={() => { if (editingValue && editingValue.r !== -1) { handleCellChange(rIdx, cIdx, editingValue.val); setEditingValue(null); } }}
                        className={`peony-transition w-full bg-transparent px-5 py-4 outline-none text-[13px] ${selectedCell?.row === rIdx && selectedCell?.col === cIdx ? "text-purple-900 font-black" : "text-slate-700 font-semibold focus:text-purple-600"}`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. FOOTER STATS */}
      <div className={`mt-8 flex items-center px-6 animate-peony-in delay-2 transition-opacity ${isSyncing ? 'opacity-20' : 'opacity-100'}`}>
        <div className="flex gap-3">
          <div className="peony-transition flex items-center gap-3 bg-white/20 backdrop-blur-sm px-5 py-2 rounded-2xl border border-white/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Nodes: {normalizedTable.rows.length}</span>
          </div>
          <div className="peony-transition flex items-center gap-3 bg-white/20 backdrop-blur-sm px-5 py-2 rounded-2xl border border-white/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Cols: {normalizedTable.columns.length}</span>
          </div>
        </div>
      </div>

      {activeModal && (
        <ActionModal
          variant={activeModal.type === "save" ? "info" : "danger"}
          title={activeModal.title}
          description={activeModal.description}
          confirmLabel={activeModal.type === "save" ? "Sync" : "Delete"}
          onConfirm={handleConfirmAction}
          onCancel={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}