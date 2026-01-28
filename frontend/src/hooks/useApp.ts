// src/hooks/useApp.ts
import { useState, useRef } from "react";
import { v4 as uuid } from "uuid";
import type { TableData } from "../lib/storage";

import { useTables } from "./useTables";
import { useHistory, HistoryActionType } from "./useHistory";
import { useClipboardPaste } from "./useClipboardPaste";

/** -------------------- UTIL -------------------- */
const clone = <T,>(v: T): T => structuredClone(v);

/**
 * Normalizuje data z clipboardu nebo importu:
 * Zajistí přítomnost sloupce ID a doplnění chybějících buněk.
 */
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
  } = useHistory();

  const [historyVisible, setHistoryVisible] = useState(false);
  const historyContainerRef = useRef<HTMLDivElement | null>(null);

  const currentTable = tables.find(t => t.id === currentId) || null;

  /**
   * POMOCNÁ FUNKCE PRO ZÁPIS ZMĚNY
   * Provede update lokálního stavu a zároveň vytvoří snapshot do historie.
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

  /** -------------------- IMPORT -------------------- */
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
    // Přidáme prefix pro odlišení klonu
    normalized.id = "clone:" + uuid();
    normalized.name = normalized.name + " (klon)";

    const next = [normalized, ...tables];
    commit(`Klonování tabulky "${table.name}"`, "row_add", normalized.id, next);
    setCurrentId(normalized.id);
  }

  function handleRename(id: string, newName: string) {
    const prev = tables.find(t => t.id === id);
    if (!prev) return;

    const next = tables.map(t => (t.id === id ? { ...t, name: newName } : t));
    commit(`Přejmenování "${prev.name}" na "${newName}"`, "rename", id, next);
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
    // 1. Odstraníme lokální verze
    let next = tables.filter(t => !originalRequestIds.includes(t.id));

    // 2. Přidáme synchronizované DB verze
    syncedTables.forEach(saved => {
      const idx = next.findIndex(t => t.id === saved.id);
      if (idx > -1) next[idx] = saved;
      else next.push(saved);
    });

    // 3. Uložíme do historie jako bod, kde pískoviště "prořídlo" o syncnuté věci
    commit(
      `Synchronizace [${syncedTables.length}] tabulek s DB`,
      "sync",
      syncedTables[0]?.id || "sync",
      next
    );

    if (syncedTables.length > 0) {
      setCurrentId(syncedTables[0].id);
    } else {
      setCurrentId(null);
    }
  };

  async function handleSaveTable() {
    if (!currentTable) return;
    const dataToSend = {
      ...currentTable,
      id: currentTable.id.replace("tmp_", "").replace("clone:", ""),
      name: currentTable.name.replace("_clone_db", ""),
    };
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
      .map(t => ({
        ...t,
        id: t.id.replace("tmp_", "").replace("clone:", ""),
        name: t.name.replace("_clone_db", ""),
      }));

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
    // Stav tabulek
    tables,
    currentId,
    setCurrentId,
    currentTable,

    // Historie
    history,
    historyIndex,
    historyVisible,
    setHistoryVisible,
    historyContainerRef,
    undo: () => undo(updateTables, setCurrentId),
    redo: () => redo(updateTables, setCurrentId),

    // Akce
    handleCreate,
    handleClone,
    handleImportFromClipboard,
    handleRename,
    handleChangeTable,
    handleDelete,
    handleDeleteMultiple,
    handleSaveAll,
    handleSaveTable,
  };
}