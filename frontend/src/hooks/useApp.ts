import { useState, useRef } from "react";
import { useTables } from "./useTables";
import { useHistory } from "./useHistory";
import { useClipboardPaste } from "./useClipboardPaste";
import { v4 as uuid } from "uuid";
import type { TableData } from "../lib/storage";

export function useApp() {
  const { tables, updateTables } = useTables();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const { history, historyIndex, pushHistory, undo, redo } = useHistory();
  const { handlePasteText } = useClipboardPaste(handlePaste);

  const [historyVisible, setHistoryVisible] = useState(false);
  const historyContainerRef = useRef<HTMLDivElement | null>(null);

  const currentTable = tables.find(t => t.id === currentId) || null;

  /** -------------------- CRUD -------------------- */
  function handleCreate() {
    const baseName = "Nová tabulka";
    let name = baseName;
    let counter = 2;
    while (tables.find(t => t.name.toLowerCase() === name.toLowerCase())) name = `${baseName}_${counter++}`;

    const newTable: TableData = {
      id: "tmp_" + uuid(),
      name,
      columns: ["ID", "name", "col2", "col3"],
      rows: Array(4).fill(null).map((_, r) => ["1", "", "", ""].map((c, i) => i === 0 ? String(r + 1) : c)),
    };

    pushHistory(newTable, "row_add", `Vytvoření nové tabulky "${name}"`);
    updateTables([newTable, ...tables]);
    setCurrentId(newTable.id);
  }

  function handlePaste(table: TableData) {
    pushHistory(table, "row_add", `Vložení tabulky "${table.name}"`);
    updateTables([table, ...tables]);
    setCurrentId(table.id);
  }

  function handleRename(id: string, newName: string) {
    const table = tables.find(t => t.id === id);
    if (!table) return;

    // vytvoříme snapshot s novým názvem
    const updatedTable = { ...table, name: newName };

    // pushujeme snapshot již s novým názvem
    pushHistory(updatedTable, "rename", `Přejmenování tabulky na "${newName}"`);

    // aktualizujeme tabulky
    updateTables(tables.map(t => t.id === id ? updatedTable : t));
  }

  function handleChangeTable(updated: TableData, description?: string) {
    const original = tables.find(t => t.id === updated.id);
    if (original && description) pushHistory(updated, "cell", description);
    updateTables(tables.map(t => t.id === updated.id ? updated : t));
  }

  function handleDelete(id: string) {
    const table = tables.find(t => t.id === id);
    if (!table) return;
    pushHistory(table, "row_delete", `Smazání tabulky "${table.name}"`);
    updateTables(tables.filter(t => t.id !== id));
    if (currentId === id) setCurrentId(null);
  }

  return {
    tables,
    currentId,
    setCurrentId,
    currentTable,
    history,
    historyIndex,
    historyVisible,
    setHistoryVisible,
    historyContainerRef,
    undo: () => undo(updateTables, setCurrentId),
    redo: () => redo(updateTables, setCurrentId),
    handleCreate,
    handlePaste,
    handleRename,
    handleChangeTable,
    handleDelete,
    handlePasteText
  };
}
