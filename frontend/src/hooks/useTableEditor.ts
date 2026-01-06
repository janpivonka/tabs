// src/hooks/useTableEditor.ts
import { useRef, useState } from "react";
import type { Table } from "../domain/table";

type SelectedCell = { row: number; col: number } | null;

export function useTableEditor(
  table: Table,
  onUpdate: (updated: Table, description?: string) => void
) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const changeTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingChange = useRef<{ updated: Table; description: string } | null>(null);

  const applyAutoIds = (rows: string[][]) =>
    rows.map((r, i) => {
      const row = [...r];
      row[0] = String(i + 1);
      return row;
    });

  const scheduleUpdate = (updated: Table, description: string) => {
    pendingChange.current = { updated, description };
    if (changeTimeout.current) clearTimeout(changeTimeout.current);

    changeTimeout.current = setTimeout(() => {
      if (pendingChange.current) {
        onUpdate(pendingChange.current.updated, pendingChange.current.description);
        pendingChange.current = null;
      }
    }, 300);
  };

  const getSelectedDescription = (): [string, string] => {
    if (!selectedCell) return ["1", table.columns[1] || ""];
    return [table.rows[selectedCell.row][0], table.columns[selectedCell.col]];
  };

  const updateCell = (row: number, col: number, value: string) => {
    if (col === 0) return; // ID nelze měnit
    const updated: Table = {
      ...table,
      rows: applyAutoIds(
        table.rows.map((r, ri) => (ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r))
      ),
    };
    const [rowId, colName] = getSelectedDescription();
    scheduleUpdate(updated, `Upraveno: buňka [${rowId}, ${colName}]`);
  };

  const updateColumnName = (colIndex: number, newName: string) => {
    const updated: Table = {
      ...table,
      columns: table.columns.map((c, i) => (i === colIndex ? newName : c)),
    };
    const [rowId] = getSelectedDescription();
    scheduleUpdate(updated, `Upraveno: sloupec [${rowId}, ${newName}]`);
  };

  const addRow = (position: "above" | "below") => {
    const idx = selectedCell ? selectedCell.row : table.rows.length;
    const insertIndex = position === "above" ? idx : idx + 1;
    const emptyRow = new Array(table.columns.length).fill("");
    const updated: Table = {
      ...table,
      rows: applyAutoIds([
        ...table.rows.slice(0, insertIndex),
        emptyRow,
        ...table.rows.slice(insertIndex),
      ]),
    };
    scheduleUpdate(updated, "Přidán řádek");
    if (selectedCell && position === "above")
      setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
  };

  const deleteRow = () => {
    if (!selectedCell) return;
    const updated: Table = {
      ...table,
      rows: applyAutoIds(table.rows.filter((_, i) => i !== selectedCell.row)),
    };
    scheduleUpdate(updated, "Smazán řádek");
    setSelectedCell(null);
  };

  const addColumn = (position: "before" | "after") => {
    const idx = selectedCell ? selectedCell.col : table.columns.length - 1;
    const insertIndex = position === "before" ? idx : idx + 1;
    const updated: Table = {
      ...table,
      columns: [
        ...table.columns.slice(0, insertIndex),
        "nový sloupec",
        ...table.columns.slice(insertIndex),
      ],
      rows: applyAutoIds(
        table.rows.map(r => [...r.slice(0, insertIndex), "", ...r.slice(insertIndex)])
      ),
    };
    scheduleUpdate(updated, "Přidán sloupec");
    if (selectedCell && position === "before")
      setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 });
  };

  const deleteColumn = () => {
    if (!selectedCell || selectedCell.col === 0) return;
    const idx = selectedCell.col;
    const updated: Table = {
      ...table,
      columns: table.columns.filter((_, i) => i !== idx),
      rows: table.rows.map(r => r.filter((_, i) => i !== idx)),
    };
    scheduleUpdate(updated, "Smazán sloupec");
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
