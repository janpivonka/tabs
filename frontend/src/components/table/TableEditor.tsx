import type { Table } from "../../domain/table";
import { useTableEditor } from "../../hooks/useTableEditor";

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
  if (!table) return null;

  // Normalizace řádků: ID první, ostatní doplnit
  const normalizedTable: Table = {
    ...table,
    rows: table.rows.map((r) => {
      const row: string[] = Array(table.columns.length).fill("");
      row[0] = r[0]; // ID
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

  return (
    <div className="p-6 w-full bg-white flex-1 overflow-auto">
      {/* TOOLBAR */}
      <div className="mb-6 flex gap-3 flex-wrap items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
        <div className="flex gap-1 pr-3 border-r border-slate-200">
          <button onClick={() => addRow("above")} className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-lg text-xs font-bold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            + Row Above
          </button>
          <button onClick={() => addRow("below")} className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-lg text-xs font-bold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            + Row Below
          </button>
        </div>
        <div className="flex gap-1 pr-3 border-r border-slate-200">
          <button onClick={() => addColumn("before")} className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-lg text-xs font-bold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            + Col Left
          </button>
          <button onClick={() => addColumn("after")} className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-lg text-xs font-bold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            + Col Right
          </button>
        </div>
        <div className="flex gap-1 pr-3 border-r border-slate-200">
          <button onClick={deleteRow} className="px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-red-100">
            Del Row
          </button>
          <button onClick={deleteColumn} className="px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-red-100">
            Del Col
          </button>
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={onExport} className="px-4 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
            Export
          </button>
          <button onClick={onSave} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center gap-2">
            <span>💾</span> Save Table
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {normalizedTable.columns.map((col, i) => (
                <th key={i} className="border-r border-slate-200 last:border-0 p-0">
                  <input
                    value={col}
                    onChange={e => updateColumnName(i, e.target.value)}
                    className="w-full bg-transparent px-4 py-3 outline-none text-[11px] font-black uppercase tracking-widest text-slate-500 focus:text-indigo-600 transition-colors"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalizedTable.rows.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`border-r border-slate-100 last:border-0 p-0 transition-all ${
                      selectedCell?.row === rIdx && selectedCell?.col === cIdx ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200" : ""
                    }`}
                    onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                  >
                    {cIdx === 0 ? (
                      <div className="px-4 py-2 text-[10px] font-mono text-slate-400 select-none">{cell}</div>
                    ) : (
                      <input
                        value={cell}
                        onChange={e => updateCell(rIdx, cIdx, e.target.value)}
                        className="w-full bg-transparent px-4 py-2 outline-none text-sm text-slate-700 focus:text-indigo-700"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
