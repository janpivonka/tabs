// src/hooks/useTableEditor.ts
import { useState } from "react";
import type { TableData } from "../../lib/storage";

type SelectedCell = { row: number; col: number } | null;

export function useTableEditor(
  table: TableData,
  onUpdate: (updated: TableData, description?: string) => void
) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);

  // Prefix pro jasnou identifikaci tabulky v historii
  const logPrefix = `[${table.name}]`;

  /** -------------------- CELL UPDATE -------------------- */
  const commitCellChange = (row: number, col: number, value: string) => {
    if (col === 0) return; // ID sloupec je read-only
    if (table.rows[row][col] === value) return;

    const rowId = table.rows[row][0];
    const colName = table.columns[col];

    const updated: TableData = {
      ...table,
      rows: table.rows.map((r, ri) =>
        ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r
      ),
    };

    // Příklad: "[Inventory] Value Updated at (ID: 102, Category)"
    onUpdate(updated, `${logPrefix} Value Updated at (ID: ${rowId}, ${colName})`);
  };

  /** -------------------- COLUMN RENAME -------------------- */
  const commitColumnRename = (colIndex: number, newName: string) => {
    if (colIndex === 0) return;
    const oldName = table.columns[colIndex];
    if (oldName === newName) return;

    const updated: TableData = {
      ...table,
      columns: table.columns.map((c, i) => (i === colIndex ? newName : c)),
    };

    // Příklad: "[Inventory] Column Refactored: "Status" -> "Availability""
    onUpdate(updated, `${logPrefix} Column Refactored: "${oldName}" -> "${newName}"`);
  };

  /** -------------------- ROW ACTIONS -------------------- */
  const addRow = (position: "above" | "below") => {
    let insertIndex: number;
    let detail: string;

    if (selectedCell) {
      insertIndex = position === "above" ? selectedCell.row : selectedCell.row + 1;
      detail = position === "above" ? `above row ${selectedCell.row + 1}` : `below row ${selectedCell.row + 1}`;
    } else {
      insertIndex = position === "above" ? 0 : table.rows.length;
      detail = position === "above" ? "at start" : "at end";
    }

    const emptyRow = new Array(table.columns.length).fill("");
    const newRows = [
      ...table.rows.slice(0, insertIndex),
      emptyRow,
      ...table.rows.slice(insertIndex),
    ].map((r, i) => {
      const copy = [...r];
      copy[0] = String(i + 1); // Přepočítání vizuálních ID
      return copy;
    });

    onUpdate({ ...table, rows: newRows }, `${logPrefix} Row Inserted (${detail})`);
  };

  const deleteRow = () => {
    if (!selectedCell) return;
    const rowId = table.rows[selectedCell.row][0];

    const rows = table.rows
      .filter((_, i) => i !== selectedCell.row)
      .map((r, i) => {
        const copy = [...r];
        copy[0] = String(i + 1);
        return copy;
      });

    onUpdate({ ...table, rows }, `${logPrefix} Row Removed (ID: ${rowId})`);
    setSelectedCell(null);
  };

  /** -------------------- COLUMN ACTIONS -------------------- */
  const addColumn = (position: "before" | "after") => {
    let insertIndex: number;
    let detail: string;

    if (selectedCell) {
      insertIndex = position === "before" ? selectedCell.col : selectedCell.col + 1;
      const colName = table.columns[selectedCell.col];
      detail = position === "before" ? `before "${colName}"` : `after "${colName}"`;
    } else {
      insertIndex = position === "before" ? 1 : table.columns.length;
      detail = position === "before" ? "at start" : "at end";
    }
    insertIndex = Math.max(1, insertIndex);

    const updated: TableData = {
      ...table,
      columns: [
        ...table.columns.slice(0, insertIndex),
        "New Column",
        ...table.columns.slice(insertIndex),
      ],
      rows: table.rows.map(r => [
        ...r.slice(0, insertIndex),
        "",
        ...r.slice(insertIndex),
      ]),
    };

    onUpdate(updated, `${logPrefix} Column Created (${detail})`);
  };

  const deleteColumn = () => {
    if (!selectedCell || selectedCell.col === 0) return;

    const idx = selectedCell.col;
    const colName = table.columns[idx];
    const updated: TableData = {
      ...table,
      columns: table.columns.filter((_, i) => i !== idx),
      rows: table.rows.map(r => r.filter((_, i) => i !== idx)),
    };

    onUpdate(updated, `${logPrefix} Column Dropped: "${colName}"`);
    setSelectedCell(null);
  };

  return {
    selectedCell,
    setSelectedCell,
    updateCell: commitCellChange,
    updateColumnName: commitColumnRename,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
  };
}