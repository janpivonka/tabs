// src/hooks/useTables.ts
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import type { TableData } from "../lib/storage";

const API_URL = "http://localhost:4000/tables";
const SOCKET_URL = "http://localhost:4000";

// Pomocná funkce, abychom se neopakovali
const isLocalOnly = (id: string | number) => {
  const sId = String(id);
  return sId.startsWith("tmp_") || sId.startsWith("clone:");
};

export function useTables() {
  const [tables, setTables] = useState<TableData[]>([]);

  // 1. Prvotní načtení dat při startu aplikace
  useEffect(() => {
    const load = async () => {
      const localRaw = localStorage.getItem("peony_tables");
      const local: TableData[] = localRaw && localRaw !== "undefined" ? JSON.parse(localRaw) : [];

      try {
        const res = await fetch(API_URL);
        const dbTables: TableData[] = await res.json();

        // FIX: Zachováváme tmp_ i clone:
        const localOnly = local.filter(t => isLocalOnly(t.id));

        const merged = [...dbTables];
        localOnly.forEach(localT => {
          if (!merged.find(t => t.id === localT.id)) {
            merged.push(localT);
          }
        });

        setTables(merged);
        localStorage.setItem("peony_tables", JSON.stringify(merged));
      } catch (err) {
        console.error("Fetch failed, using local backup", err);
        setTables(local);
      }
    };

    load();
  }, []);

  // 2. REAL-TIME SYNCHRONIZACE PŘES WEBSOCKETY
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("db_sync_needed", (payload: { operation: string; id: string }) => {
      console.log("Real-time update přijat:", payload);

      if (payload.operation === "DELETE") {
        setTables((prev) => {
          const next = prev.filter((t) => String(t.id) !== String(payload.id));
          localStorage.setItem("peony_tables", JSON.stringify(next));
          return next;
        });
      } else {
        fetch(API_URL)
          .then((res) => res.json())
          .then((dbTables) => {
            setTables((prev) => {
              // FIX: Tady byla hlavní chyba! Musíme zachovat tmp_ i clone:
              const localOnly = prev.filter(t => isLocalOnly(t.id));

              const merged = [...dbTables, ...localOnly];
              localStorage.setItem("peony_tables", JSON.stringify(merged));
              return merged;
            });
          });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateTables = (newTables: TableData[]) => {
    setTables(newTables);
    localStorage.setItem("peony_tables", JSON.stringify(newTables));
  };

  return { tables, setTables, updateTables };
}