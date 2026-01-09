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
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ref jen pro synchronní přístup v undo/redo
  const historyRef = useRef<TableAction[]>([]);
  const indexRef = useRef(-1);

  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { indexRef.current = historyIndex; }, [historyIndex]);

  /** ---------- init z localStorage ---------- */
  useEffect(() => {
    const raw = localStorage.getItem("peony_history");
    const stored: TableAction[] =
      raw && raw !== "undefined" ? JSON.parse(raw) : [];

    setHistory(stored);
    historyRef.current = stored;

    const last = stored.length - 1;
    setHistoryIndex(last);
    indexRef.current = last;
  }, []);

  /** ---------- helpers ---------- */
  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

  const findPreviousSnapshot = (tableId: string, fromIndex: number): TableData | null => {
    for (let i = fromIndex - 1; i >= 0; i--) {
      if (historyRef.current[i].tableId === tableId) {
        return historyRef.current[i].snapshot;
      }
    }
    return null;
  };

  const applySnapshot = (tables: TableData[], snapshot: TableData) => {
    const idx = tables.findIndex(t => t.id === snapshot.id);
    if (idx >= 0) {
      const copy = [...tables];
      copy[idx] = snapshot;
      return copy;
    }
    return [snapshot, ...tables];
  };

  /** ---------- public API ---------- */
  const pushHistory = (
    table: TableData,
    type: TableAction["type"],
    description: string
  ) => {
    const action: TableAction = {
      id: uuid(),
      timestamp: Date.now(),
      tableId: table.id,
      type,
      description,
      snapshot: clone(table),
    };

    const next = [
      ...historyRef.current.slice(0, indexRef.current + 1),
      action,
    ];

    const nextIndex = next.length - 1;

    setHistory(next);
    setHistoryIndex(nextIndex);
    historyRef.current = next;
    indexRef.current = nextIndex;

    localStorage.setItem("peony_history", JSON.stringify(next));
  };

  const applyAction = (
    tables: TableData[],
    action: TableAction,
    index: number,
    mode: "undo" | "redo"
  ): TableData[] => {
    switch (action.type) {
      case "row_add":
        return mode === "undo"
          ? tables.filter(t => t.id !== action.tableId)
          : [action.snapshot, ...tables];

      case "row_delete":
        return mode === "undo"
          ? [action.snapshot, ...tables]
          : tables.filter(t => t.id !== action.tableId);

      case "cell":
      case "rename": {
        if (mode === "redo") {
          return applySnapshot(tables, action.snapshot);
        }
        const prev = findPreviousSnapshot(action.tableId, index);
        return prev ? applySnapshot(tables, prev) : tables;
      }
    }
  };

  const undo = (
    setTables: (t: TableData[]) => void,
    setCurrentId: (id: string | null) => void
  ) => {
    setHistoryIndex(i => {
      if (i < 0) return i;

      const action = historyRef.current[i];
      setTables(t => applyAction(t, action, i, "undo"));

      indexRef.current = i - 1;
      setCurrentId(action.tableId);
      return i - 1;
    });
  };

  const redo = (
    setTables: (t: TableData[]) => void,
    setCurrentId: (id: string | null) => void
  ) => {
    setHistoryIndex(i => {
      const next = i + 1;
      if (next >= historyRef.current.length) return i;

      const action = historyRef.current[next];
      setTables(t => applyAction(t, action, next, "redo"));

      indexRef.current = next;
      setCurrentId(action.tableId);
      return next;
    });
  };

  return { history, historyIndex, pushHistory, undo, redo };
}
