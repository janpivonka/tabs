import { useState, useEffect, useRef } from "react";
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
  const [tables, setTables] = useState<TableData[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [history, setHistory] = useState<TableAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [historyVisible, setHistoryVisible] = useState(false);

  const historyRef = useRef<TableAction[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const historyContainerRef = useRef<HTMLDivElement | null>(null);

  /** Synchronizace refů s aktuálním stavem */
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

  /** Načtení tabulek z lokálu + API */
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("peony_tables") || "[]") as TableData[];
    fetch(API_URL)
      .then(res => res.json())
      .then((dbTablesRaw: any[]) => {
        const dbTables = dbTablesRaw
          .map(d => d.data ? { ...d.data, id: d.id } : null)
          .filter(Boolean) as TableData[];
        const merged = [...local];
        dbTables.forEach(dbT => {
          if (!merged.find(t => t.id === dbT.id)) merged.push(dbT);
        });
        setTables(merged);
      })
      .catch(() => setTables(local));
  }, []);

  /** Načtení historie z localStorage */
  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("peony_history") || "[]") as TableAction[];
    setHistory(storedHistory);
    historyRef.current = storedHistory;
    const lastIndex = storedHistory.length > 0 ? storedHistory.length - 1 : -1;
    setHistoryIndex(lastIndex);
    historyIndexRef.current = lastIndex;
  }, []);

  /** Ukládání tabulek do localStorage */
  const saveLocal = (tables: TableData[]) => localStorage.setItem("peony_tables", JSON.stringify(tables));
  const updateTables = (newTables: TableData[]) => {
    setTables(newTables);
    saveLocal(newTables);
  };

  /** Přidání akce do historie */
  const pushHistory = (table: TableData, type: TableAction["type"], description: string) => {
    const snapshot = JSON.parse(JSON.stringify(table));
    const action: TableAction = {
      id: uuid(),
      timestamp: Date.now(),
      tableId: table.id,
      type,
      description,
      snapshot
    };

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

  /** Undo */
  const undo = () => {
    setHistoryIndex(prevIndex => {
      if (prevIndex < 0) return prevIndex;
      const action = historyRef.current[prevIndex];

      setTables(currentTables => {
        let newTables = [...currentTables];
        switch (action.type) {
          case "row_add":
            newTables = newTables.filter(t => t.id !== action.tableId);
            break;
          case "row_delete":
          case "cell":
          case "rename":
            let snapshotToUse = action.snapshot;
            for (let i = prevIndex - 1; i >= 0; i--) {
              if (historyRef.current[i].tableId === action.tableId) {
                snapshotToUse = historyRef.current[i].snapshot;
                break;
              }
            }
            newTables = newTables.map(t => t.id === action.tableId ? snapshotToUse : t);
            if (!newTables.find(t => t.id === action.tableId)) newTables = [snapshotToUse, ...newTables];
            break;
        }
        return newTables;
      });

      historyIndexRef.current = prevIndex - 1;
      setCurrentId(action.tableId);
      return prevIndex - 1;
    });
  };

  /** Redo */
  const redo = () => {
    setHistoryIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= historyRef.current.length) return prevIndex;
      const action = historyRef.current[nextIndex];

      setTables(currentTables => {
        let newTables = [...currentTables];
        switch (action.type) {
          case "row_add":
            if (!newTables.find(t => t.id === action.tableId)) newTables = [action.snapshot, ...newTables];
            break;
          case "row_delete":
            newTables = newTables.filter(t => t.id !== action.tableId);
            break;
          case "cell":
          case "rename":
            const idx = newTables.findIndex(t => t.id === action.tableId);
            if (idx >= 0) newTables[idx] = action.snapshot;
            else newTables = [action.snapshot, ...newTables];
            break;
        }
        return newTables;
      });

      historyIndexRef.current = nextIndex;
      setCurrentId(action.tableId);
      return nextIndex;
    });
  };

  /** CRUD a clipboard */
  const handleCreate = () => {
    const baseName = "Nová tabulka";
    let name = baseName;
    let counter = 2;
    while (tables.find(t => t.name.toLowerCase() === name.toLowerCase())) {
      name = `${baseName}_${counter}`;
      counter++;
    }
    const newTable: TableData = {
      id: "tmp_" + uuid(),
      name,
      columns: ["ID", "name", "col2", "col3"],
      rows: Array(4).fill(null).map((_, r) => ["1", "", "", ""].map((c, i) => (i === 0 ? String(r+1) : c))),
    };
    pushHistory(newTable, "row_add", `Vytvoření nové tabulky "${name}"`);
    const newTables = [newTable, ...tables];
    updateTables(newTables);
    setCurrentId(newTable.id);
  };

  const handlePaste = (table: TableData) => {
    pushHistory(table, "row_add", `Vložení tabulky "${table.name}" z clipboardu`);
    const newTables = [table, ...tables];
    updateTables(newTables);
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
    const newTables = tables.filter(t => t.id !== id);
    updateTables(newTables);
    if (currentId === id) setCurrentId(null);
  };

  const currentTable = tables.find(t => t.id === currentId) || null;

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
