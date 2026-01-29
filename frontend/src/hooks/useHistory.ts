// src/hooks/useHistory.ts
import { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import type { TableData } from "../lib/storage";

export type HistoryActionType =
  | "cell"
  | "row_add"
  | "row_delete"
  | "rename"
  | "bulk_action"
  | "sync";

export interface HistoryAction {
  id: string;
  timestamp: number;
  tableId: string;
  type: HistoryActionType;
  description: string;
  snapshot: TableData[]; // Aktuální stav všech LOKÁLNÍCH tabulek v daný moment
}

const STORAGE_KEY = "peony_history_v3";
const clone = <T,>(v: T): T => structuredClone(v);
const isLocal = (id: string) => id.startsWith("tmp_") || id.startsWith("clone:");

export function useHistory() {
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const historyRef = useRef<HistoryAction[]>([]);
  const indexRef = useRef(-1);

  // Synchronizace refů pro přístup k aktuálnímu stavu v callbacku updateTables
  useEffect(() => {
    historyRef.current = history;
    indexRef.current = historyIndex;
  }, [history, historyIndex]);

  // Načtení historie z LocalStorage při startu
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setHistory(parsed);
        const lastIdx = parsed.length - 1;
        setHistoryIndex(lastIdx);
        indexRef.current = lastIdx;
      } catch (e) {
        console.error("Chyba při načítání historie:", e);
      }
    }
  }, []);

  /**
   * SMAZÁNÍ HISTORIE
   * Kompletně vyčistí auditní log a zresetuje indexy.
   */
  const clearHistory = () => {
    setHistory([]);
    setHistoryIndex(-1);
    localStorage.removeItem(STORAGE_KEY);
  };

  /** * JEDINÝ ZDROJ PRAVDY PRO CESTOVÁNÍ ČASEM
   * Aplikuje snapshot na konkrétním indexu na aktuální tabulky.
   */
  const applyHistoryState = (
    targetIndex: number,
    updateTables: (fn: (prev: TableData[]) => TableData[]) => void,
    setCurrentId: (id: string | null) => void
  ) => {
    // Validace rozsahu
    if (targetIndex < -1 || targetIndex >= historyRef.current.length) return;

    // Pokud index je -1, znamená to prázdný stav lokálních tabulek
    const nextSnapshot = targetIndex === -1
      ? []
      : clone(historyRef.current[targetIndex].snapshot);

    updateTables(prev => {
      // Ponecháme databázové tabulky (nemají prefix tmp_ nebo clone:)
      const dbTables = prev.filter(t => !isLocal(t.id));
      // Vrátíme kombinaci DB tabulek a vybraného snapshotu
      return [...dbTables, ...nextSnapshot];
    });

    // Focus na tabulku, která byla předmětem akce (pokud existuje)
    if (targetIndex !== -1) {
      const action = historyRef.current[targetIndex];
      // Pokud šlo o hromadnou akci, focusneme první tabulku ze snapshotu
      const focusId = action.tableId === "multiple"
        ? nextSnapshot[0]?.id
        : action.tableId;

      if (focusId) setCurrentId(focusId);
    }

    setHistoryIndex(targetIndex);
  };

  /** * ULOŽENÍ NOVÉHO STAVU
   * Vytvoří nový záznam a odřízne případnou "přepsanou" budoucnost (po Undo).
   */
  const pushHistory = (
    params: Omit<HistoryAction, "id" | "timestamp" | "snapshot">,
    allTables: TableData[]
  ) => {
    const localSnapshot = allTables.filter(t => isLocal(t.id));

    const entry: HistoryAction = {
      ...params,
      id: uuid(),
      timestamp: Date.now(),
      snapshot: clone(localSnapshot)
    };

    // Odřízneme kroky před aktuálním indexem (pokud jsme byli v minulosti)
    const nextHistory = [...historyRef.current.slice(0, indexRef.current + 1), entry];

    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
  };

  return {
    history,
    historyIndex,
    pushHistory,
    clearHistory, // <-- Export nové funkce
    // Veřejné API pro Time-Travel
    jumpTo: (index: number, updateTables: any, setCurrentId: any) =>
      applyHistoryState(index, updateTables, setCurrentId),
    undo: (u: any, s: any) =>
      applyHistoryState(indexRef.current - 1, u, s),
    redo: (u: any, s: any) =>
      applyHistoryState(indexRef.current + 1, u, s),
  };
}