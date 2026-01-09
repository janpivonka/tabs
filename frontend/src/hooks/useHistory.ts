import { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import type { TableData } from "../lib/storage";

export interface TableAction {
  id: string;
  timestamp: number;
  tableId: string;
  type: "cell" | "row_add" | "row_delete" | "rename";
  description: string;
  snapshot: TableData;
}

export function useHistory() {
  const [history, setHistory] = useState<TableAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const historyRef = useRef<TableAction[]>([]);
  const historyIndexRef = useRef<number>(-1);

  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

  useEffect(() => {
    const storedRaw = localStorage.getItem("peony_history");
    const storedHistory: TableAction[] = storedRaw && storedRaw !== "undefined" ? JSON.parse(storedRaw) : [];
    setHistory(storedHistory);
    historyRef.current = storedHistory;
    const lastIndex = storedHistory.length - 1;
    setHistoryIndex(lastIndex);
    historyIndexRef.current = lastIndex;
  }, []);

  const pushHistory = (table: TableData, type: TableAction["type"], description: string) => {
    const snapshot = JSON.parse(JSON.stringify(table));
    const action: TableAction = { id: uuid(), timestamp: Date.now(), tableId: table.id, type, description, snapshot };

    const newHistory = [...historyRef.current.slice(0, historyIndexRef.current + 1), action];
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
        if (mode === "redo") {
          // tady musíme použít snapshot přímo z akce, ne hledat předchozí
          useSnapshot(action.snapshot);
        } else {
          // undo: najdeme předchozí snapshot tabulky
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

  const undo = (setTables: (tables: TableData[]) => void, setCurrentId: (id: string | null) => void) => {
    setHistoryIndex(prevIndex => {
      if (prevIndex < 0) return prevIndex;
      const action = historyRef.current[prevIndex];
      setTables(currentTables => applyUndoRedo(currentTables, action, prevIndex, "undo"));
      historyIndexRef.current = prevIndex - 1;
      setCurrentId(action.tableId);
      return prevIndex - 1;
    });
  };

  const redo = (setTables: (tables: TableData[]) => void, setCurrentId: (id: string | null) => void) => {
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

  return { history, historyIndex, pushHistory, undo, redo };
}
