import { useState, useEffect, useRef, useCallback } from "react";
import type { TableData } from "../lib/storage";
import { v4 as uuid } from "uuid";

const API_URL = "http://localhost:4000/tables";

export interface TableAction {
  id: string;
  timestamp: number;
  tableId: string;
  type: "cell" | "row_add" | "row_delete" | "rename";
  description: string;
  snapshot: TableData;
}

export function useApp() {
  /** -------------------- STATE -------------------- */
  const [tables, setTables] = useState<TableData[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [history, setHistory] = useState<TableAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [historyVisible, setHistoryVisible] = useState(false);

  const historyRef = useRef<TableAction[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const historyContainerRef = useRef<HTMLDivElement | null>(null);

  /** -------------------- SYNC REFS -------------------- */
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

  /** -------------------- LOAD DATA -------------------- */
  useEffect(() => {
    loadTablesFromLocalAndAPI();
    loadHistoryFromLocalStorage();
  }, []);

  const loadTablesFromLocalAndAPI = async () => {
    const localRaw = localStorage.getItem("peony_tables");
    const local: TableData[] = localRaw && localRaw !== "undefined" ? JSON.parse(localRaw) : [];

    try {
      const res = await fetch(API_URL);
      const dbTablesRaw: any[] = await res.json();
      const dbTables = dbTablesRaw
        .map(d => d.data ? { ...d.data, id: d.id } : null)
        .filter(Boolean) as TableData[];

      const merged = [...local];
      dbTables.forEach(dbT => { if (!merged.find(t => t.id === dbT.id)) merged.push(dbT); });

      setTables(merged);
    } catch {
      setTables(local);
    }
  };

  const loadHistoryFromLocalStorage = () => {
    const storedRaw = localStorage.getItem("peony_history");
    const storedHistory: TableAction[] = storedRaw && storedRaw !== "undefined" ? JSON.parse(storedRaw) : [];

    setHistory(storedHistory);
    historyRef.current = storedHistory;

    const lastIndex = storedHistory.length > 0 ? storedHistory.length - 1 : -1;
    setHistoryIndex(lastIndex);
    historyIndexRef.current = lastIndex;
  };

  /** -------------------- SAVE & UPDATE -------------------- */
  const saveLocal = (tables: TableData[]) => localStorage.setItem("peony_tables", JSON.stringify(tables));
  const updateTables = (newTables: TableData[]) => {
    setTables(newTables);
    saveLocal(newTables);
  };

  /** -------------------- HISTORY -------------------- */
  const pushHistory = (table: TableData, type: TableAction["type"], description: string) => {
    const snapshot = JSON.parse(JSON.stringify(table));
    const action: TableAction = { id: uuid(), timestamp: Date.now(), tableId: table.id, type, description, snapshot };

    const currentHistory = historyRef.current;
    const currentIndex = historyIndexRef.current;

    const newHistory = [...currentHistory.slice(0, currentIndex + 1), action];
    const newIndex = newHistory.length - 1;

    setHistory(newHistory);
    historyRef.current = newHistory;
    setHistoryIndex(newIndex);
    historyIndexRef.current = newIndex;

    localStorage.setItem("peony_history", JSON.stringify(newHistory));
  };

  const applyUndoRedo = (currentTables: TableData[], action: TableAction, index: number, mode: "undo" | "redo") => {
    let newTables = [...currentTables];
    const useSnapshot = (snapshot: TableData) => {
      const idx = newTables.findIndex(t => t.id === snapshot.id);
      if (idx >= 0) newTables[idx] = snapshot;
      else newTables = [snapshot, ...newTables];
    };

    switch (action.type) {
      case "row_add":
        newTables = mode === "undo" ? newTables.filter(t => t.id !== action.tableId) : [action.snapshot, ...newTables];
        break;
      case "row_delete":
        newTables = mode === "undo" ? [action.snapshot, ...newTables] : newTables.filter(t => t.id !== action.tableId);
        break;
      case "cell":
      case "rename":
        if (mode === "redo") useSnapshot(action.snapshot);
        else {
          let snapshotToUse = action.snapshot;
          for (let i = index - 1; i >= 0; i--) {
            if (historyRef.current[i].tableId === action.tableId) {
              snapshotToUse = historyRef.current[i].snapshot;
              break;
            }
          }
          useSnapshot(snapshotToUse);
        }
        break;
    }
    return newTables;
  };

  const undo = () => {
    setHistoryIndex(prevIndex => {
      if (prevIndex < 0) return prevIndex;
      const action = historyRef.current[prevIndex];
      setTables(currentTables => applyUndoRedo(currentTables, action, prevIndex, "undo"));
      historyIndexRef.current = prevIndex - 1;
      setCurrentId(action.tableId);
      return prevIndex - 1;
    });
  };

  const redo = () => {
    setHistoryIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= historyRef.current.length) return prevIndex;
      const action = historyRef.current[nextIndex];
      setTables(currentTables => applyUndoRedo(currentTables, action, nextIndex, "redo"));
      historyIndexRef.current = nextIndex;
      setCurrentId(action.tableId);
      return nextIndex;
    });
  };

  /** -------------------- CRUD -------------------- */
  const handleCreate = () => {
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
  };

  const handlePaste = (table: TableData) => {
    pushHistory(table, "row_add", `Vložení tabulky "${table.name}" z clipboardu`);
    updateTables([table, ...tables]);
    setCurrentId(table.id);
  };

  const handleRename = (id: string, newName: string) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;
    pushHistory(table, "rename", `Přejmenování tabulky na "${newName}"`);
    updateTables(tables.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const handleChangeTable = (updated: TableData, description?: string) => {
    const original = tables.find(t => t.id === updated.id);
    if (original && description) pushHistory(updated, "cell", description);
    updateTables(tables.map(t => t.id === updated.id ? updated : t));
  };

  const handleDelete = (id: string) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;
    pushHistory(table, "row_delete", `Smazání tabulky "${table.name}"`);
    updateTables(tables.filter(t => t.id !== id));
    if (currentId === id) setCurrentId(null);
  };

  /** -------------------- CURRENT TABLE -------------------- */
  const currentTable = tables.find(t => t.id === currentId) || null;

  /** -------------------- PASTE ANY TEXT -------------------- */
  const handlePasteText = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const lines = text.trim().split(/\r?\n/);
      if (lines.length === 0) return;

      const rows = lines.map(line => line.split(/\t|,/)); // tabulátor nebo čárka
      const colCount = Math.max(...rows.map(r => r.length));

      const columns = Array.from({ length: colCount }, (_, i) => `col${i + 1}`);

      const newTable: TableData = {
        id: "tmp_" + uuid(),
        name: "Clipboard tabulka",
        columns,
        rows
      };

      handlePaste(newTable);
    } catch (err) {
      console.error("Nepodařilo se vložit obsah clipboardu:", err);
    }
  }, [handlePaste]);

  /** -------------------- PASTE SHORTCUT -------------------- */
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        handlePasteText();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handlePasteText]);

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
    undo,
    redo,
    handleCreate,
    handlePaste,
    handleRename,
    handleChangeTable,
    handleDelete
  };
}
