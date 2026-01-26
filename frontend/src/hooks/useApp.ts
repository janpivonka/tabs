// src/hooks/useApp.ts
import { useState, useRef } from "react";
import { v4 as uuid } from "uuid";
import type { TableData } from "../lib/storage";

import { useTables } from "./useTables";
import { useHistory } from "./useHistory";
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
    updateTableIdInHistory,
  } = useHistory();

  const [historyVisible, setHistoryVisible] = useState(false);
  const historyContainerRef = useRef<HTMLDivElement | null>(null);

  const currentTable = tables.find(t => t.id === currentId) || null;

  /** * CLIPBOARD LOGIKA
   * Zde byla chyba: vytahujeme 'triggerPaste' z hooku a přejmenováváme na 'handleImportFromClipboard'
   */
  const { triggerPaste: handleImportFromClipboard } = useClipboardPaste((tableData: TableData) => {
    const normalized = normalizeTable(tableData);

    pushHistory({
      tableId: normalized.id,
      type: "row_add",
      description: `Import dat ze schránky`,
      before: null,
      after: clone(normalized),
    });

    updateTables([normalized, ...tables]);
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
      rows: [
        ["1", "Příklad dat", "", ""],
        ["2", "", "", ""],
      ],
    };

    pushHistory({
      tableId: table.id,
      type: "row_add",
      description: `Vytvoření tabulky "${name}"`,
      before: null,
      after: clone(table),
    });

    updateTables([table, ...tables]);
    setCurrentId(table.id);
  }

  // Funkce pro přímé klonování (bez použití schránky)
  function handleClone(table: TableData) {
    const normalized = normalizeTable(table);

    pushHistory({
      tableId: normalized.id,
      type: "row_add",
      description: `Klonování tabulky "${normalized.name}"`,
      before: null,
      after: clone(normalized),
    });

    updateTables([normalized, ...tables]);
    setCurrentId(normalized.id);
  }

  function handleRename(id: string, newName: string) {
    const prev = tables.find(t => t.id === id);
    if (!prev) return;

    const next = { ...prev, name: newName };

    pushHistory({
      tableId: id,
      type: "rename",
      description: `Přejmenování na "${newName}"`,
      before: clone(prev),
      after: clone(next),
    });

    updateTables(tables.map(t => (t.id === id ? next : t)));
  }

  function handleChangeTable(updated: TableData, description?: string) {
    if (!description) return;

    const prev = tables.find(t => t.id === updated.id);
    if (!prev) return;

    pushHistory({
      tableId: updated.id,
      type: "cell",
      description,
      before: clone(prev),
      after: clone(updated),
    });

    updateTables(tables.map(t => (t.id === updated.id ? updated : t)));
    setCurrentId(updated.id);
  }

  /** -------------------- DELETE -------------------- */
  function handleDelete(id: string) {
    const prev = tables.find(t => t.id === id);
    if (!prev) return;

    pushHistory({
      tableId: id,
      type: "row_delete",
      description: `Smazání tabulky "${prev.name}"`,
      before: clone(prev),
      after: null,
    });

    updateTables(tables.filter(t => t.id !== id));
    if (currentId === id) setCurrentId(null);
  }

  function handleDeleteMultiple(ids: string[]) {
    const remaining = tables.filter(t => !ids.includes(t.id));

    ids.forEach(id => {
      const prev = tables.find(t => t.id === id);
      if (!prev) return;

      pushHistory({
        tableId: id,
        type: "row_delete",
        description: `Smazání tabulky "${prev.name}"`,
        before: clone(prev),
        after: null,
      });
    });

    updateTables(remaining);
    if (currentId && ids.includes(currentId)) setCurrentId(null);
  }

  /** -------------------- DB SYNC -------------------- */
  const syncWithState = (syncedTables: TableData[], originalRequestIds: string[]) => {
    let next = [...tables];
    syncedTables.forEach((saved, i) => {
      const reqId = originalRequestIds[i];
      if (reqId !== saved.id) updateTableIdInHistory(reqId, saved.id);
      next = next.filter(t => t.id !== reqId);
      const idx = next.findIndex(t => t.id === saved.id);
      if (idx > -1) next[idx] = saved;
      else next.push(saved);
    });
    updateTables(next);
    if (syncedTables.length === 1) setCurrentId(syncedTables[0].id);
  };

  async function handleSaveTable() {
    if (!currentTable) return;
    const dataToSend = {
      ...currentTable,
      id: currentTable.id.replace("clone:", ""),
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
        id: t.id.replace("clone:", ""),
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

  /** -------------------- RETURN -------------------- */
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
    handleClone,
    handleImportFromClipboard, // Exportujeme opravenou funkci pro App.tsx

    handleRename,
    handleChangeTable,
    handleDelete,
    handleDeleteMultiple,
    handleSaveAll,
    handleSaveTable,
  };
}