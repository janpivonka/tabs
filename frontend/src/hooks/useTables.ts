import { useState, useEffect } from "react";
import type { TableData } from "../lib/storage";

const API_URL = "http://localhost:4000/tables";

export function useTables() {
  const [tables, setTables] = useState<TableData[]>([]);

  useEffect(() => {
    const load = async () => {
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

    load();
  }, []);

  const saveLocal = (tables: TableData[]) => localStorage.setItem("peony_tables", JSON.stringify(tables));

  const updateTables = (newTables: TableData[]) => {
    setTables(newTables);
    saveLocal(newTables);
  };

  return { tables, setTables, updateTables };
}
