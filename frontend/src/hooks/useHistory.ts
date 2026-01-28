// src/hooks/useHistory.ts
import { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import type { TableData } from "../lib/storage";

export type HistoryActionType = "cell" | "row_add" | "row_delete" | "rename" | "bulk_action" | "sync";

export interface HistoryAction {
  id: string;
  timestamp: number;
  tableId: string;
  type: HistoryActionType;
  description: string;
  snapshot: TableData[]; // Aktuální stav všech LOKÁLNÍCH tabulek
}

const STORAGE_KEY = "peony_history_v3";
const clone = <T,>(v: T): T => structuredClone(v);
const isLocal = (id: string) => id.startsWith("tmp_") || id.startsWith("clone:");

export function useHistory() {
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef<HistoryAction[]>([]);
  const indexRef = useRef(-1);

  useEffect(() => {
    historyRef.current = history;
    indexRef.current = historyIndex;
  }, [history, historyIndex]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setHistory(parsed);
        setHistoryIndex(parsed.length - 1);
      } catch (e) { console.error("History load error", e); }
    }
  }, []);

  const applyHistoryState = (
    targetIndex: number,
    updateTables: (fn: (prev: TableData[]) => TableData[]) => void,
    setCurrentId: (id: string | null) => void
  ) => {
    if (targetIndex < -1 || targetIndex >= historyRef.current.length) return;

    const nextSnapshot = targetIndex === -1 ? [] : clone(historyRef.current[targetIndex].snapshot);

    updateTables(prev => {
      const dbTables = prev.filter(t => !isLocal(t.id));
      return [...dbTables, ...nextSnapshot];
    });

    if (nextSnapshot.length > 0 && targetIndex !== -1) {
      const action = historyRef.current[targetIndex];
      setCurrentId(action.tableId.startsWith("multiple") ? nextSnapshot[0].id : action.tableId);
    }

    setHistoryIndex(targetIndex);
  };

  const pushHistory = (params: Omit<HistoryAction, "id" | "timestamp" | "snapshot">, allTables: TableData[]) => {
    const localSnapshot = allTables.filter(t => isLocal(t.id));

    const entry: HistoryAction = {
      ...params,
      id: uuid(),
      timestamp: Date.now(),
      snapshot: clone(localSnapshot)
    };

    const nextHistory = [...historyRef.current.slice(0, indexRef.current + 1), entry];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
  };

  return {
    history,
    historyIndex,
    pushHistory,
    undo: (u: any, s: any) => applyHistoryState(indexRef.current - 1, u, s),
    redo: (u: any, s: any) => applyHistoryState(indexRef.current + 1, u, s),
  };
}