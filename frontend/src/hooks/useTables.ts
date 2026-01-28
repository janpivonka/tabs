// src/hooks/useTables.ts
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import type { TableData } from "../lib/storage";

const API_URL = "http://localhost:4000/tables";
const SOCKET_URL = "http://localhost:4000";

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

        const merged = [...dbTables];
        const localTmpTables = local.filter(t => String(t.id).startsWith("tmp_"));

        localTmpTables.forEach(tmpT => {
          if (!merged.find(t => t.id === tmpT.id)) {
            merged.push(tmpT);
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
        // Okamžitě odstraníme smazanou tabulku ze stavu
        setTables((prev) => {
          const next = prev.filter((t) => String(t.id) !== String(payload.id));
          localStorage.setItem("peony_tables", JSON.stringify(next));
          return next;
        });
      } else {
        // Pro INSERT nebo UPDATE (např. změna názvu v DB)
        // je nejjednodušší data znovu přenačíst z API
        fetch(API_URL)
          .then((res) => res.json())
          .then((dbTables) => {
            setTables((prev) => {
              // Zachováme lokální dočasné tabulky (tmp_)
              const tmpOnes = prev.filter(t => String(t.id).startsWith("tmp_"));
              const merged = [...dbTables, ...tmpOnes];
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