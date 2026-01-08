// src/components/TableEditor.tsx
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

  const {
    selectedCell,
    setSelectedCell,
    updateCell,
    updateColumnName,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
  } = useTableEditor(table, onUpdate);

  return (
    <div className="p-4 w-full">
      <div className="mb-4 flex gap-2 flex-wrap">
        <button onClick={() => addRow("above")} className="px-3 py-1 bg-gray-200 rounded">+ řádek nad</button>
        <button onClick={() => addRow("below")} className="px-3 py-1 bg-gray-200 rounded">+ řádek pod</button>
        <button onClick={() => addColumn("before")} className="px-3 py-1 bg-gray-200 rounded">+ sloupec před</button>
        <button onClick={() => addColumn("after")} className="px-3 py-1 bg-gray-200 rounded">+ sloupec za</button>
        <button onClick={deleteRow} className="px-3 py-1 bg-red-300 rounded">Smazat řádek</button>
        <button onClick={deleteColumn} className="px-3 py-1 bg-red-300 rounded">Smazat sloupec</button>
        <button onClick={onSave} className="px-3 py-1 bg-green-500 text-white rounded">💾 Uložit tabulku</button>
        <button onClick={onExport} className="px-3 py-1 bg-blue-500 text-white rounded">📤 Export tabulky</button>
      </div>

      <table className="border-collapse">
        <thead>
          <tr>
            {table.columns.map((col, i) => (
              <th key={i} className="border px-3 py-2 bg-gray-100">
                <input
                  value={col}
                  onChange={e => updateColumnName(i, e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={`border px-2 py-1 ${selectedCell?.row === rIdx && selectedCell?.col === cIdx ? "bg-yellow-200" : ""}`}
                  onClick={() => setSelectedCell({ row: rIdx, col: cIdx })}
                >
                  {cIdx === 0 ? (
                    <span className="text-gray-600">{cell}</span>
                  ) : (
                    <input
                      value={cell}
                      onChange={e => updateCell(rIdx, cIdx, e.target.value)}
                      className="w-full bg-transparent outline-none"
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
