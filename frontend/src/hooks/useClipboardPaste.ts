// src/hooks/useClipboardPaste.ts
import { useCallback } from "react";
import type { TableData } from "../lib/storage";

export function useClipboardPaste(onPaste: (table: TableData) => void) {
  const handlePasteText = useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;

      // Rozdělíme řádky a buňky
      const rawRows = text
        .split(/\r?\n/)
        .map(r => r.split("\t"))
        .filter(r => r.some(cell => cell.trim() !== ""));

      if (rawRows.length === 0) return;

      const columns = rawRows[0]; // první řádek jako názvy sloupců
      const rows = rawRows.slice(1); // zbytek jako data

      // Přidání ID sloupce
      const finalColumns = ["ID", ...columns];
      const finalRows = rows.map((r, i) => {
        const row: string[] = [];
        row[0] = String(i + 1); // ID vždy první
        for (let j = 1; j < finalColumns.length; j++) {
          row[j] = r[j - 1] ?? "";
        }
        return row;
      });

      onPaste({
        id: "tmp_" + crypto.randomUUID(),
        name: "Vložená tabulka",
        columns: finalColumns,
        rows: finalRows,
      });
    },
    [onPaste]
  );

  return { handlePasteText };
}
