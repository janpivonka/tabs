import { useState, useEffect } from "react";
import type { TableData } from "../lib/storage";

const API_URL = "http://localhost:4000/tables";

export function useTables() {
  const [tables, setTables] = useState<TableData[]>([]);

  useEffect(() => {
    const load = async () => {
      // 1. Načtení z localStorage (tady jsou i ty smazané, které tam zbyly)
      const localRaw = localStorage.getItem("peony_tables");
      const local: TableData[] = localRaw && localRaw !== "undefined" ? JSON.parse(localRaw) : [];

      try {
        // 2. Načtení z DB (ZDE JE PRAVDA - co tu není, neexistuje)
        const res = await fetch(API_URL);
        const dbTables: TableData[] = await res.json();

        // 3. NOVÉ MERGOVÁNÍ
        // Začneme čistě s tím, co je v DB
        const merged = [...dbTables];

        // Z localStorage přidáme POUZE tabulky, které jsou dočasné (tmp_)
        // Tyto tabulky v DB ještě nejsou, takže je chceme zachovat.
        const localTmpTables = local.filter(t => String(t.id).startsWith("tmp_"));

        localTmpTables.forEach(tmpT => {
          // Pro jistotu zkontrolujeme, zda už tam není (neměla by být)
          if (!merged.find(t => t.id === tmpT.id)) {
            merged.push(tmpT);
          }
        });

        setTables(merged);
        saveLocal(merged); // Tímto přepíšeme localStorage a "duchové" zmizí
      } catch (err) {
        console.error("Fetch failed, using local backup", err);
        setTables(local);
      }
    };

    load();
  }, []);

  const saveLocal = (ts: TableData[]) => localStorage.setItem("peony_tables", JSON.stringify(ts));

  const updateTables = (newTables: TableData[]) => {
    setTables(newTables);
    saveLocal(newTables);
  };

  return { tables, setTables, updateTables };
}