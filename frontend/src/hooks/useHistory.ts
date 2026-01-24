import { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import type { TableData } from "../lib/storage";

export type HistoryActionType =
  | "cell"
  | "row_add"
  | "row_delete"
  | "rename";

export interface TableAction {
  id: string;
  timestamp: number;
  tableId: string;
  type: HistoryActionType;
  description: string;
  before: TableData | null;
  after: TableData | null;
}

const STORAGE_KEY = "peony_history_v2";

const clone = <T,>(v: T): T => structuredClone(v);

export function useHistory() {
  const [history, setHistory] = useState<TableAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const historyRef = useRef<TableAction[]>([]);
  const indexRef = useRef(-1);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    indexRef.current = historyIndex;
  }, [historyIndex]);

  /** ---------- INIT Z LOCAL STORAGE ---------- */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      setHistory(parsed);
      setHistoryIndex(parsed.length - 1);
      indexRef.current = parsed.length - 1;
    } catch (e) {
      console.warn("Historie se nepodařila načíst:", e);
    }
  }, []);

  const persist = (next: TableAction[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  /** ---------- PUSH AKCE ---------- */

  const pushHistory = (action: Omit<TableAction, "id" | "timestamp">) => {
    const entry: TableAction = {
      ...action,
      id: uuid(),
      timestamp: Date.now(),
    };

    const next = [
      ...historyRef.current.slice(0, indexRef.current + 1),
      entry,
    ];

    setHistory(next);
    setHistoryIndex(next.length - 1);
    indexRef.current = next.length - 1;

    persist(next);
  };

  /** ---------- UPDATE ID (clone → db) ---------- */

  const updateTableIdInHistory = (oldId: string, newId: string) => {
    const updated = historyRef.current.map(a => ({
      ...a,
      tableId: a.tableId === oldId ? newId : a.tableId,
      before: a.before && a.before.id === oldId
        ? { ...a.before, id: newId }
        : a.before,
      after: a.after && a.after.id === oldId
        ? { ...a.after, id: newId }
        : a.after,
    }));

    setHistory(updated);
    persist(updated);
  };

  /** ---------- UNDO ---------- */

  const undo = (
    updateTables: (fn: (p: TableData[]) => TableData[]) => void,
    setCurrentId: (id: string | null) => void
  ) => {
    const i = indexRef.current;
    if (i < 0) return;

    const action = historyRef.current[i];
    if (!action) return;

    setCurrentId(null);

    updateTables(prev => {
      if (!action.before) {
        // např. undo vytvoření tabulky
        return prev.filter(t => t.id !== action.tableId);
      }

      const exists = prev.some(t => t.id === action.tableId);
      const next = exists
        ? prev.map(t => (t.id === action.tableId ? clone(action.before!) : t))
        : [clone(action.before!), ...prev];

      return next;
    });

    const nextIdx = i - 1;
    setHistoryIndex(nextIdx);
    indexRef.current = nextIdx;

    if (action.before) {
      setTimeout(() => setCurrentId(action.before!.id), 10);
    }
  };

  /** ---------- REDO ---------- */

  const redo = (
    updateTables: (fn: (p: TableData[]) => TableData[]) => void,
    setCurrentId: (id: string | null) => void
  ) => {
    const nextIdx = indexRef.current + 1;
    if (nextIdx >= historyRef.current.length) return;

    const action = historyRef.current[nextIdx];
    if (!action) return;

    setCurrentId(null);

    updateTables(prev => {
      if (!action.after) {
        // např. redo smazání
        return prev.filter(t => t.id !== action.tableId);
      }

      const exists = prev.some(t => t.id === action.tableId);
      const next = exists
        ? prev.map(t => (t.id === action.tableId ? clone(action.after!) : t))
        : [clone(action.after!), ...prev];

      return next;
    });

    setHistoryIndex(nextIdx);
    indexRef.current = nextIdx;

    if (action.after) {
      setTimeout(() => setCurrentId(action.after!.id), 10);
    }
  };

  return {
    history,
    historyIndex,
    pushHistory,
    undo,
    redo,
    updateTableIdInHistory,
  };
}
