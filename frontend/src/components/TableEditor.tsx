// src/components/TableEditor.tsx
import { useState, useRef } from "react";
import type { TableData } from "../lib/storage";

export function TableEditor({
  table,
  onUpdate,
  onSave,
  onExport,
}: {
  table: TableData;
  onUpdate: (updated: TableData, description?: string) => void;
  onSave: () => void;
  onExport: () => void;
}) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const changeTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingChange = useRef<{ updated: TableData; description: string } | null>(null);

  if (!table) return null;

  // Přidá ID do prvního sloupce
  const applyAutoIds = (rows: string[][]) =>
    rows.map((r, i) => {
      const row = [...r];
      row[0] = String(i + 1);
      return row;
    });

  // Odložené volání onUpdate pro debounce
  const scheduleUpdate = (updated: TableData, description: string) => {
    pendingChange.current = { updated, description };
    if (changeTimeout.current) clearTimeout(changeTimeout.current);
    changeTimeout.current = setTimeout(() => {
      if (pendingChange.current) {
        onUpdate(pendingChange.current.updated, pendingChange.current.description);
        pendingChange.current = null;
      }
    }, 300);
  };

  const getSelectedDescription = () => {
    if (!selectedCell) return ["1", table.columns[1]]; // default ID a první datový sloupec
    const rowId = table.rows[selectedCell.row][0];
    const colName = table.columns[selectedCell.col];
    return [rowId, colName];
  };

  const updateCell = (row: number, col: number, value: string) => {
    if (col === 0) return; // ID nelze měnit
    const updated = {
      ...table,
      rows: applyAutoIds(
        table.rows.map((r, ri) => (ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r))
      ),
    };
    const [rowId, colName] = getSelectedDescription();
    const desc = `Upraveno: buňka [${rowId}, ${colName}]`;
    scheduleUpdate(updated, desc);
  };

  const updateColumnName = (colIndex: number, newName: string) => {
    const updated = { ...table, columns: table.columns.map((c, i) => (i === colIndex ? newName : c)) };
    const [rowId, _] = getSelectedDescription();
    const desc = `Upraveno: sloupec [${rowId}, ${newName}]`;
    scheduleUpdate(updated, desc);
  };

  const addRow = (position: "above" | "below") => {
    const idx = selectedCell ? selectedCell.row : table.rows.length;
    const insertIndex = position === "above" ? idx : idx + 1;
    const emptyRow = new Array(table.columns.length).fill("");
    const updated = {
      ...table,
      rows: applyAutoIds([...table.rows.slice(0, insertIndex), emptyRow, ...table.rows.slice(insertIndex)]),
    };
    const [rowId, colName] = getSelectedDescription();
    const desc = selectedCell
      ? `Přidán řádek ${position} [${rowId}, ${colName}]`
      : `Přidán řádek na ${position === "above" ? "začátek" : "konec"}`;
    scheduleUpdate(updated, desc);

    if (selectedCell && position === "above")
      setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
  };

  const deleteRow = () => {
    if (!selectedCell) return;
    if (!confirm("Opravdu chcete data smazat?")) return;
    const updated = { ...table, rows: applyAutoIds(table.rows.filter((_, i) => i !== selectedCell.row)) };
    const [rowId, colName] = getSelectedDescription();
    const desc = `Smazán řádek [${rowId}, ${colName}]`;
    scheduleUpdate(updated, desc);
    setSelectedCell(null);
  };

  const addColumn = (position: "before" | "after") => {
    const idx = selectedCell ? selectedCell.col : table.columns.length - 1;
    const insertIndex = position === "before" ? idx : idx + 1;
    const newColumns = [...table.columns.slice(0, insertIndex), "nový sloupec", ...table.columns.slice(insertIndex)];
    const newRows = table.rows.map(r => [...r.slice(0, insertIndex), "", ...r.slice(insertIndex)]);
    const updated = { ...table, columns: newColumns, rows: applyAutoIds(newRows) };
    const [rowId, colName] = getSelectedDescription();
    const desc = selectedCell
      ? `Přidán sloupec ${position} [${rowId}, ${colName}]`
      : `Přidán sloupec na ${position === "before" ? "začátek" : "konec"}`;
    scheduleUpdate(updated, desc);

    if (selectedCell && position === "before")
      setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 });
  };

  const deleteColumn = () => {
    if (!selectedCell || selectedCell.col === 0) return alert("Sloupec ID nelze odstranit.");
    if (!confirm("Opravdu chcete data smazat?")) return;
    const idx = selectedCell.col;
    const updated = {
      ...table,
      columns: table.columns.filter((_, i) => i !== idx),
      rows: table.rows.map(r => r.filter((_, i) => i !== idx)),
    };
    const [rowId, colName] = getSelectedDescription();
    const desc = `Smazán sloupec [${rowId}, ${colName}]`;
    scheduleUpdate(updated, desc);
    setSelectedCell(null);
  };

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
                  className={`border px-2 py-1 ${
                    selectedCell?.row === rIdx && selectedCell?.col === cIdx ? "bg-yellow-200" : ""
                  }`}
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