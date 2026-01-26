// src/hooks/useClipboardPaste.ts
import { useCallback } from "react";
import type { TableData } from "../lib/storage";

export function useClipboardPaste(onPaste: (table: TableData) => void) {
  const triggerPaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === "") return;

      let parsedData: Partial<TableData> = {};

      // 1. Zkusíme, zda jde o JSON (váš formát z databáze)
      if (text.trim().startsWith("{")) {
        try {
          const json = JSON.parse(text);
          if (json.rows && json.columns) {
            parsedData = {
              columns: json.columns,
              rows: json.rows,
              name: "Import JSON " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          }
        } catch (e) {
          console.log("Není to validní JSON, zkouším prostý text...");
        }
      }

      // 2. Pokud to nebyl JSON, zpracujeme jako TSV (Excel/Tabulátory)
      if (!parsedData.rows) {
        const rawRows = text
          .split(/\r?\n/)
          .map(r => r.split("\t"))
          .filter(r => r.some(cell => cell.trim() !== ""));

        if (rawRows.length > 0) {
          parsedData = {
            columns: rawRows[0],
            rows: rawRows.slice(1),
            name: "Import Text " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
      }

      // 3. Odeslání dat, pokud jsme něco získali
      if (parsedData.rows && parsedData.columns) {
        onPaste({
          id: "tmp_" + crypto.randomUUID(),
          name: parsedData.name || "Import",
          columns: parsedData.columns,
          rows: parsedData.rows,
        });
      }
    } catch (err) {
      console.error("Selhalo čtení ze schránky:", err);
      alert("Povolte prosím přístup ke schránce nebo zkontrolujte formát dat.");
    }
  }, [onPaste]);

  return { triggerPaste };
}