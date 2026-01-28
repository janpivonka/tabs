// src/components/table/TableEditor.tsx
import { useState } from "react";
import type { Table } from "../../domain/table";
import { useTableEditor } from "../../hooks/useTableEditor";
import { ActionModal } from "../common/ActionModal";

export function TableEditor({
  table,
  onUpdate,
  onSave,
  onExport,
}: {
  table: Table;
  onUpdate: (updated: Table, description?: string) => void;
  onSave: () => void;
  onExport: () => void;
}) {
  const [activeModal, setActiveModal] = useState<{
    type: "delete_row" | "delete_col" | "save";
    title: string;
    description: string | React.ReactNode;
  } | null>(null);

  // Lokální stav pro plynulé psaní (r: -1 značí hlavičku/sloupce)
  const [editingValue, setEditingValue] = useState<{ r: number; c: number; val: string } | null>(null);

  if (!table) return null;

  const normalizedTable: Table = {
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

  /** --- POMOCNÉ FUNKCE PRO TEXTY HISTORIE --- */

  const handleAddRow = (pos: "above" | "below") => {
    const desc = selectedCell
      ? `Přidán řádek ${pos === "above" ? "nad" : "pod"} řádek č. ${selectedCell.row + 1} v tabulce "${table.name}"`
      : `Přidán řádek na ${pos === "above" ? "začátek" : "konec"} tabulky "${table.name}"`;
    addRow(pos, desc);
  };

  const handleAddCol = (pos: "before" | "after") => {
    const desc = selectedCell
      ? `Přidán sloupec ${pos === "before" ? "vlevo" : "vpravo"} od sloupce "${table.columns[selectedCell.col]}" v tabulce "${table.name}"`
      : `Přidán sloupec na ${pos === "before" ? "začátek" : "konec"} tabulky "${table.name}"`;
    addColumn(pos, desc);
  };

  const handleCellChange = (rIdx: number, cIdx: number, value: string) => {
    const colName = normalizedTable.columns[cIdx];
    const rowId = normalizedTable.rows[rIdx][0];
    const desc = `Změna dat v [řádek ${rowId}, ${colName}] v tabulce "${table.name}"`;
    updateCell(rIdx, cIdx, value, desc);
  };

  /** --- HANDLERY PRO MODÁLY --- */

  const handleConfirmAction = () => {
    if (!activeModal || !selectedCell) return;

    if (activeModal.type === "delete_row") {
      const rowId = normalizedTable.rows[selectedCell.row][0];
      deleteRow(`Smazán řádek č. ${rowId} v tabulce "${table.name}"`);
    }

    if (activeModal.type === "delete_col") {
      const colName = normalizedTable.columns[selectedCell.col];
      deleteColumn(`Smazán sloupec "${colName}" v tabulce "${table.name}"`);
    }

    if (activeModal.type === "save") onSave();
    setActiveModal(null);
  };

  return (
    <div className="p-6 w-full bg-white flex-1 overflow-auto">
      {/* TOOLBAR */}
      <div className="mb-6 flex gap-3 flex-wrap items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
        <div className="flex gap-1 pr-3 border-r border-slate-200">
          <button onClick={() => handleAddRow("above")} className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-lg text-xs font-bold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            + Row Above
          </button>
          <button onClick={() => handleAddRow("below")} className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-lg text-xs font-bold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            + Row Below
          </button>
        </div>

        <div className="flex gap-1 pr-3 border-r border-slate-200">
          <button onClick={() => handleAddCol("before")} className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-lg text-xs font-bold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            + Col Left
          </button>
          <button onClick={() => handleAddCol("after")} className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-lg text-xs font-bold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            + Col Right
          </button>
        </div>

        <div className="flex gap-1 pr-3 border-r border-slate-200">
          <button
            onClick={() => selectedCell && setActiveModal({ type: "delete_row", title: "Smazat řádek", description: "Opravdu smazat?" })}
            disabled={selectedCell === null}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-transparent ${selectedCell !== null ? 'hover:bg-red-50 text-red-600 hover:border-red-100' : 'opacity-30 text-slate-400'}`}
          >
            Del Row
          </button>
          <button
            onClick={() => selectedCell && setActiveModal({ type: "delete_col", title: "Smazat sloupec", description: "Opravdu smazat?" })}
            disabled={selectedCell === null || selectedCell.col === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-transparent ${(selectedCell !== null && selectedCell.col !== 0) ? 'hover:bg-red-50 text-red-600 hover:border-red-100' : 'opacity-30 text-slate-400'}`}
          >
            Del Col
          </button>
        </div>

        <div className="flex gap-2 ml-auto">
          <button onClick={onExport} className="px-4 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
            Export
          </button>
          <button onClick={() => setActiveModal({ type: "save", title: "Uložit", description: "Uložit změny?" })} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center gap-2">
            <span>💾</span> Save Table
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {normalizedTable.columns.map((col, i) => {
                const isEditingCol = editingValue?.r === -1 && editingValue?.c === i;
                const displayColValue = isEditingCol ? editingValue.val : col;

                return (
                  <th key={i} className="border-r border-slate-200 last:border-0 p-0">
                    <input
                      value={displayColValue}
                      readOnly={i === 0}
                      onChange={e => setEditingValue({ r: -1, c: i, val: e.target.value })}
                      onBlur={() => {
                        if (editingValue && editingValue.r === -1) {
                          updateColumnName(i, editingValue.val);
                          setEditingValue(null);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      className={`w-full bg-transparent px-4 py-3 outline-none text-[11px] font-black uppercase tracking-widest transition-colors ${i === 0 ? 'text-slate-400 cursor-default' : 'text-slate-500 focus:text-indigo-600'}`}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {normalizedTable.rows.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors">
                {row.map((cell, cIdx) => {
                  const isEditing = editingValue?.r === rIdx && editingValue?.c === cIdx;
                  const displayValue = isEditing ? editingValue.val : cell;

                  return (
                    <td
                      key={cIdx}
                      className={`border-r border-slate-100 last:border-0 p-0 transition-all ${
                        selectedCell?.row === rIdx && selectedCell?.col === cIdx ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200" : ""
                      }`}
                      onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                    >
                      {cIdx === 0 ? (
                        <div className="px-4 py-2 text-[10px] font-mono text-slate-400 select-none bg-slate-50/50">{cell}</div>
                      ) : (
                        <input
                          value={displayValue}
                          onChange={e => setEditingValue({ r: rIdx, c: cIdx, val: e.target.value })}
                          onBlur={() => {
                            if (editingValue && editingValue.r !== -1) {
                              handleCellChange(rIdx, cIdx, editingValue.val);
                              setEditingValue(null);
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          }}
                          className="w-full bg-transparent px-4 py-2 outline-none text-sm text-slate-700 focus:text-indigo-700"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeModal && (
        <ActionModal
          variant={activeModal.type === "save" ? "info" : "danger"}
          title={activeModal.title}
          description={activeModal.description}
          confirmLabel={activeModal.type === "save" ? "Odeslat" : "Smazat"}
          onConfirm={handleConfirmAction}
          onCancel={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}