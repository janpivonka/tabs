// src/lib/storage.ts
import type { Table } from "../domain/table";

const LOCAL_STORAGE_TABLES_KEY = "peony_tables";

/**
 * Bezpečné parsování JSON dat z localStorage
 */
function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Storage parse error:", error);
    return fallback;
  }
}

/**
 * Načte tabulky z localStorage
 */
export function loadTables(): Table[] {
  const raw = localStorage.getItem(LOCAL_STORAGE_TABLES_KEY);
  return safeParse<Table[]>(raw, []);
}

/**
 * Uloží tabulky do localStorage
 */
export function saveTables(tables: Table[]): void {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_TABLES_KEY,
      JSON.stringify(tables)
    );
  } catch (error) {
    console.error("Storage save error:", error);
  }
}

/**
 * Smaže tabulky z localStorage
 */
export function clearTables(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_TABLES_KEY);
  } catch (error) {
    console.error("Storage clear error:", error);
  }
}
