// src/hooks/useApp.ts
import { useState, useRef } from "react";
import { v4 as uuid } from "uuid";
import type { TableData } from "../lib/storage";

import { useTables } from "./useTables";
import { useHistory, HistoryActionType } from "./useHistory";
import { useClipboardPaste } from "./useClipboardPaste";

/** -------------------- UTIL -------------------- */
const clone = <T,>(v: T): T => structuredClone(v);

function normalizeTable(table: TableData): TableData {
  const hasId = table.columns.some(c => c.toLowerCase() === "id");
  const columns = hasId ? table.columns : ["ID", ...table.columns];

  const rows = table.rows.map((r, i) => {
    const row: string[] = [];
    if (!hasId) row[0] = String(i + 1);
    for (let j = 0; j < (hasId ? columns.length : columns.length - 1); j++) {
      row[hasId ? j : j + 1] = r[j] ?? "";
    }
    return row;
  });

  return { ...table, columns, rows };
}

/** -------------------- HOOK -------------------- */
export function useApp() {
  const { tables, updateTables } = useTables();
  const [currentId, setCurrentId] = useState<string | null>(null);

  const {
    history,
    historyIndex,
    pushHistory,
    undo,
    redo,
    jumpTo,
  } = useHistory();

  const [historyVisible, setHistoryVisible] = useState(false);
  const historyContainerRef = useRef<HTMLDivElement | null>(null);

  const currentTable = tables.find(t => t.id === currentId) || null;

  /**
   * POMOCNÁ FUNKCE PRO ZÁPIS ZMĚNY
   */
  const commit = (
    description: string,
    type: HistoryActionType,
    tableId: string,
    nextTables: TableData[]
  ) => {
    updateTables(nextTables);
    pushHistory({ description, type, tableId }, nextTables);
  };

  /**
   * PŘÍPRAVA DAT PRO DB / EXPORT
   */
  const prepareForDb = (table: TableData) => {
    const dbId = (table as any).originDbId || table.id.replace("tmp_", "").replace("clone:", "");

    return {
      ...table,
      id: dbId,
      name: table.name
        .replace(" (klon)", "")
        .replace("_clone_db", "")
        .trim()
    };
  };

  /** -------------------- IMPORT / EXPORT -------------------- */
  const { triggerPaste: handleImportFromClipboard } = useClipboardPaste((tableData: TableData) => {
    const normalized = normalizeTable(tableData);
    const next = [normalized, ...tables];

    commit(
      `Import dat do tabulky "${normalized.name}"`,
      "row_add",
      normalized.id,
      next
    );
    setCurrentId(normalized.id);
  });

  function handleExportTable() {
    if (!currentTable) return;

    const cleanData = prepareForDb(currentTable);
    const jsonString = JSON.stringify(cleanData, null, 2);

    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${cleanData.name.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /** -------------------- CRUD -------------------- */
  function handleCreate() {
    const base = "Nová tabulka";
    let name = base;
    let i = 2;
    while (tables.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      name = `${base} ${i++}`;
    }

    const table: TableData = {
      id: "tmp_" + uuid(),
      name,
      columns: ["ID", "Název", "Vlastnost 1", "Vlastnost 2"],
      rows: [["1", "Příklad dat", "", ""], ["2", "", "", ""]],
    };

    const next = [table, ...tables];
    commit(`Vytvoření tabulky "${name}"`, "row_add", table.id, next);
    setCurrentId(table.id);
  }

  function handleClone(table: TableData) {
    const normalized = normalizeTable(table);
    const originalDbId = table.id.replace("tmp_", "").replace("clone:", "");

    normalized.id = "clone:" + uuid();
    (normalized as any).originDbId = originalDbId;
    normalized.name = normalized.name + " (klon)";

    const next = [normalized, ...tables];
    commit(`Klonování tabulky "${table.name}"`, "row_add", normalized.id, next);
    setCurrentId(normalized.id);
  }

  function handleRename(id: string, newName: string) {
    const prev = tables.find(t => t.id === id);
    if (!prev) return;

    if (prev.name.trim() === newName.trim()) return;

    const next = tables.map(t => (t.id === id ? { ...t, name: newName.trim() } : t));
    commit(`Přejmenování "${prev.name}" na "${newName.trim()}"`, "rename", id, next);
  }

  function handleChangeTable(updated: TableData, description?: string) {
    if (!description) return;
    const next = tables.map(t => (t.id === updated.id ? updated : t));

    commit(description, "cell", updated.id, next);
    setCurrentId(updated.id);
  }

  /** -------------------- DELETE -------------------- */
  function handleDelete(id: string) {
    const prev = tables.find(t => t.id === id);
    if (!prev) return;

    const next = tables.filter(t => t.id !== id);
    commit(`Smazání tabulky "${prev.name}"`, "row_delete", id, next);

    if (currentId === id) setCurrentId(null);
  }

  function handleDeleteMultiple(ids: string[]) {
    const next = tables.filter(t => !ids.includes(t.id));
    commit(`Hromadné smazání [${ids.length}] tabulek`, "bulk_action", "multiple", next);

    if (currentId && ids.includes(currentId)) setCurrentId(null);
  }

  /** -------------------- DB SYNC -------------------- */
  const syncWithState = (syncedTables: TableData[], originalRequestIds: string[]) => {
    let next = tables.filter(t => !originalRequestIds.includes(t.id));

    syncedTables.forEach(saved => {
      const idx = next.findIndex(t => t.id === saved.id);
      if (idx > -1) next[idx] = saved;
      else next.push(saved);
    });

    commit(`Synchronizace s databází`, "sync", "sync", next);
    setCurrentId(null);
  };

  async function handleSaveTable() {
    if (!currentTable) return;
    const dataToSend = prepareForDb(currentTable);

    try {
      const res = await fetch("http://localhost:4000/tables/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: [dataToSend] }),
      });
      const result = await res.json();
      if (result.success) syncWithState(result.data, [currentTable.id]);
    } catch {
      alert("❌ Chyba při ukládání tabulky.");
    }
  }

  async function handleSaveAll(ids?: string[]) {
    const idsToSend = ids || tables.map(t => t.id);
    const payload = tables
      .filter(t => idsToSend.includes(t.id))
      .map(t => prepareForDb(t));

    try {
      const res = await fetch("http://localhost:4000/tables/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: payload }),
      });
      const result = await res.json();
      if (result.success) syncWithState(result.data, idsToSend);
    } catch {
      alert("❌ Hromadná synchronizace selhala.");
    }
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
    jumpTo: (index: number) => jumpTo(index, updateTables, setCurrentId),
    handleCreate,
    handleClone,
    handleImportFromClipboard,
    handleExportTable,
    handleRename,
    handleChangeTable,
    handleDelete,
    handleDeleteMultiple,
    handleSaveAll,
    handleSaveTable,
  };
}