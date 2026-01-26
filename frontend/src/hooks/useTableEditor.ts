// src/hooks/useTableEditor.ts
import { useState } from "react";
import type { Table } from "../domain/table";

type SelectedCell = { row: number; col: number } | null;

export function useTableEditor(
  table: Table,
  onUpdate: (updated: Table, description?: string) => void
) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);

  const updateCell = (row: number, col: number, value: string) => {
    if (col === 0) return; // ID sloupec je read-only

    const updated: Table = {
      ...table,
      rows: table.rows.map((r, ri) =>
        ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r
      ),
    };

    const rowId = table.rows[row]?.[0] ?? String(row + 1);
    const colName = table.columns[col] ?? "";

    onUpdate(updated, `Upraveno: buňka [${rowId}, ${colName}]`);
  };

  const updateColumnName = (colIndex: number, newName: string) => {
    if (colIndex === 0) return; // ID sloupec nelze přejmenovat

    const updated: Table = {
      ...table,
      columns: table.columns.map((c, i) => (i === colIndex ? newName : c)),
    };

    onUpdate(updated, `Přejmenován sloupec na "${newName}"`);
  };

  const addRow = (position: "above" | "below") => {
    const baseIndex = selectedCell ? selectedCell.row : table.rows.length - 1;
    const insertIndex = position === "above" ? baseIndex : baseIndex + 1;

    const emptyRow = new Array(table.columns.length).fill("");
    emptyRow[0] = String(insertIndex + 1); // ID první

    const rows = [
      ...table.rows.slice(0, insertIndex),
      emptyRow,
      ...table.rows.slice(insertIndex),
    ].map((r, i) => {
      const copy = [...r];
      copy[0] = String(i + 1); // ID vždy správně
      return copy;
    });

    onUpdate({ ...table, rows }, "Přidán řádek");
  };

  const deleteRow = () => {
    if (!selectedCell) return;

    const rows = table.rows
      .filter((_, i) => i !== selectedCell.row)
      .map((r, i) => {
        const copy = [...r];
        copy[0] = String(i + 1); // ID přepočítáno
        return copy;
      });

    onUpdate({ ...table, rows }, "Smazán řádek");
    setSelectedCell(null);
  };

  const addColumn = (position: "before" | "after") => {
    // ID sloupec je vždy index 0
    const baseIndex = selectedCell ? selectedCell.col : table.columns.length - 1;
    const insertIndex =
      position === "before" ? Math.max(1, baseIndex) : Math.max(1, baseIndex + 1);

    const updated: Table = {
      ...table,
      columns: [
        ...table.columns.slice(0, insertIndex),
        "Nový sloupec",
        ...table.columns.slice(insertIndex),
      ],
      rows: table.rows.map(r => [
        ...r.slice(0, insertIndex),
        "",
        ...r.slice(insertIndex),
      ]),
    };

    onUpdate(updated, "Přidán sloupec");
  };

  const deleteColumn = () => {
    if (!selectedCell || selectedCell.col === 0) return; // ID nesmažeme

    const idx = selectedCell.col;

    const updated: Table = {
      ...table,
      columns: table.columns.filter((_, i) => i !== idx),
      rows: table.rows.map(r => r.filter((_, i) => i !== idx)),
    };

    onUpdate(updated, "Smazán sloupec");
    setSelectedCell(null);
  };

  return {
    selectedCell,
    setSelectedCell,
    updateCell,
    updateColumnName,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
  };
}
