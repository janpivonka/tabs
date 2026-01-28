// src/hooks/useTableEditor.ts
import { useState } from "react";
import type { Table } from "../domain/table";

type SelectedCell = { row: number; col: number } | null;

export function useTableEditor(
  table: Table,
  onUpdate: (updated: Table, description?: string) => void
) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);

  /**
   * Zápis změny buňky do historie.
   * Volat pouze při dokončení editace (onBlur, Enter), ne při každém úhozu.
   */
  const commitCellChange = (row: number, col: number, value: string, description?: string) => {
    if (col === 0) return;

    // Ochrana proti spamu: Pokud se hodnota nezměnila, neprovádíme update ani zápis do historie
    if (table.rows[row][col] === value) return;

    const updated: Table = {
      ...table,
      rows: table.rows.map((r, ri) =>
        ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r
      ),
    };

    onUpdate(updated, description || `Změna v tabulce "${table.name}"`);
  };

  /**
   * Zápis změny názvu sloupce do historie.
   * Stejně jako u buněk, voláme až po onBlur.
   */
  const commitColumnRename = (colIndex: number, newName: string) => {
    if (colIndex === 0) return;

    // Ochrana proti spamu: Pokud je název stejný, ignorujeme
    if (table.columns[colIndex] === newName) return;

    const updated: Table = {
      ...table,
      columns: table.columns.map((c, i) => (i === colIndex ? newName : c)),
    };

    onUpdate(updated, `Přejmenován sloupec na "${newName}" v tabulce "${table.name}"`);
  };

  const addRow = (position: "above" | "below", description?: string) => {
    let insertIndex: number;
    if (selectedCell) {
      insertIndex = position === "above" ? selectedCell.row : selectedCell.row + 1;
    } else {
      insertIndex = position === "above" ? 0 : table.rows.length;
    }

    const emptyRow = new Array(table.columns.length).fill("");

    const newRows = [
      ...table.rows.slice(0, insertIndex),
      emptyRow,
      ...table.rows.slice(insertIndex),
    ].map((r, i) => {
      const copy = [...r];
      copy[0] = String(i + 1); // Přepočet ID řádku
      return copy;
    });

    onUpdate({ ...table, rows: newRows }, description || `Přidán řádek do tabulky "${table.name}"`);
  };

  const deleteRow = (description?: string) => {
    if (!selectedCell) return;

    const rows = table.rows
      .filter((_, i) => i !== selectedCell.row)
      .map((r, i) => {
        const copy = [...r];
        copy[0] = String(i + 1); // Přepočet ID zbývajících řádků
        return copy;
      });

    onUpdate({ ...table, rows }, description || `Smazán řádek v tabulce "${table.name}"`);
    setSelectedCell(null);
  };

  const addColumn = (position: "before" | "after", description?: string) => {
    let insertIndex: number;

    if (selectedCell) {
      insertIndex = position === "before" ? selectedCell.col : selectedCell.col + 1;
    } else {
      insertIndex = position === "before" ? 1 : table.columns.length;
    }

    insertIndex = Math.max(1, insertIndex); // Ochrana proti vložení před ID sloupec

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

    onUpdate(updated, description || `Přidán sloupec do tabulky "${table.name}"`);
  };

  const deleteColumn = (description?: string) => {
    if (!selectedCell || selectedCell.col === 0) return;

    const idx = selectedCell.col;
    const updated: Table = {
      ...table,
      columns: table.columns.filter((_, i) => i !== idx),
      rows: table.rows.map(r => r.filter((_, i) => i !== idx)),
    };

    onUpdate(updated, description || `Smazán sloupec v tabulce "${table.name}"`);
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