// src/lib/storage.ts

export interface TableData {
  id: string;
  name: string;
  columns: string[];
  rows: string[][];
}

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
export function loadTables(): TableData[] {
  const raw = localStorage.getItem(LOCAL_STORAGE_TABLES_KEY);
  return safeParse<TableData[]>(raw, []);
}

/**
 * Uloží tabulky do localStorage
 */
export function saveTables(tables: TableData[]): void {
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
 * (zatím nepoužito, ale připraveno)
 */
export function clearTables(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_TABLES_KEY);
  } catch (error) {
    console.error("Storage clear error:", error);
  }
}
