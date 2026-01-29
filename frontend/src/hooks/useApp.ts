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
    clearHistory
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
        .replace(" (clone)", "")
        .replace("_clone_db", "")
        .trim()
    };
  };

  /** -------------------- IMPORT / EXPORT -------------------- */
  const { triggerPaste: handleImportFromClipboard } = useClipboardPaste((tableData: TableData) => {
    const normalized = normalizeTable(tableData);
    const next = [normalized, ...tables];

    commit(
      `[${normalized.name}] Data Ingested`,
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
    const base = "New Table";
    let name = base;
    let i = 2;
    while (tables.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      name = `${base} ${i++}`;
    }

    const table: TableData = {
      id: "tmp_" + uuid(),
      name,
      columns: ["ID", "Name", "Attribute 1", "Attribute 2"],
      rows: [["1", "Example data", "", ""], ["2", "", "", ""]],
    };

    const next = [table, ...tables];
    commit(`[${name}] Table Initialized`, "row_add", table.id, next);
    setCurrentId(table.id);
  }

  function handleClone(table: TableData) {
    const normalized = normalizeTable(table);
    const originalDbId = table.id.replace("tmp_", "").replace("clone:", "");

    normalized.id = "clone:" + uuid();
    (normalized as any).originDbId = originalDbId;
    normalized.name = normalized.name + " (clone)";

    const next = [normalized, ...tables];
    commit(`[${table.name}] Instance Cloned`, "row_add", normalized.id, next);
    setCurrentId(normalized.id);
  }

  function handleRename(id: string, newName: string) {
    const prev = tables.find(t => t.id === id);
    if (!prev) return;
    const oldName = prev.name;
    if (oldName.trim() === newName.trim()) return;

    const next = tables.map(t => (t.id === id ? { ...t, name: newName.trim() } : t));
    commit(`[${oldName}] Identifier Updated to "${newName.trim()}"`, "rename", id, next);
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
    commit(`[${prev.name}] Entity Deleted`, "row_delete", id, next);

    if (currentId === id) setCurrentId(null);
  }

  function handleDeleteMultiple(ids: string[]) {
    const count = ids.length;
    const next = tables.filter(t => !ids.includes(t.id));
    commit(`[System] Bulk Delete Executed (${count} entities)`, "bulk_action", "multiple", next);

    if (currentId && ids.includes(currentId)) setCurrentId(null);
  }

  /** -------------------- DB SYNC -------------------- */
  const syncWithState = (syncedTables: TableData[], originalRequestIds: string[]) => {
    // Vytvoříme pracovní kopii aktuálních tabulek
    let next = [...tables];

    // Iterujeme přes tabulky, které se vrátily ze serveru
    syncedTables.forEach((synced, index) => {
      const originalId = originalRequestIds[index];

      // Hledáme, kde v našem seznamu tato tabulka sedí
      const existingIdx = next.findIndex(t => t.id === originalId);

      if (existingIdx > -1) {
        // Pokud jsme ji našli, nahradíme ji novou verzí (už má DB ID)
        next[existingIdx] = synced;
      } else {
        // Pokud ID nesouhlasí (už se jednou syncovala), zkusíme ji najít podle DB ID
        const dbIdx = next.findIndex(t => t.id === synced.id);
        if (dbIdx > -1) {
          next[dbIdx] = synced;
        } else {
          // Pokud je úplně nová, přidáme ji na začátek
          next.unshift(synced);
        }
      }
    });

    // Tímto přístupem jsme v 'next' ponechali vše, co tam bylo (klony, jiné tabulky),
    // a pouze aktualizovali ty, které se reálně synchronizovaly.
    commit(`[System] Remote Sync Completed`, "sync", "sync", next);

    // Resetujeme currentId jen pokud už v seznamu neexistuje
    if (currentId && !next.some(t => t.id === currentId)) {
        setCurrentId(null);
    }
  };

  async function handleSaveTable(): Promise<boolean> {
    if (!currentTable) return false;
    const dataToSend = prepareForDb(currentTable);

    try {
      const res = await fetch("http://localhost:4000/tables/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: [dataToSend] }),
      });
      const result = await res.json();
      if (result.success) {
        syncWithState(result.data, [currentTable.id]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Save error:", err);
      return false;
    }
  }

  async function handleSaveAll(ids?: string[]) {
    const idsToSend = ids || tables.filter(t => t.id.startsWith("tmp_")).map(t => t.id);

    const payload = tables
      .filter(t => idsToSend.includes(t.id))
      .map(t => prepareForDb(t));

    if (payload.length === 0) return false;

    try {
      const res = await fetch("http://localhost:4000/tables/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables: payload }),
      });
      const result = await res.json();
      if (result.success) {
        syncWithState(result.data, idsToSend);
        return true;
      }
      return false;
    } catch {
      return false;
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
    clearHistory,
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