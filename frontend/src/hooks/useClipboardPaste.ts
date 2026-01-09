import { useCallback, useEffect } from "react";
import { v4 as uuid } from "uuid";
import type { TableData } from "../lib/storage";

export function useClipboardPaste(handlePaste: (table: TableData) => void) {
  const handlePasteText = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const lines = text.trim().split(/\r?\n/);
      if (!lines.length) return;

      const rows = lines.map(line => line.split(/\t|,/));
      const colCount = Math.max(...rows.map(r => r.length));
      const columns = Array.from({ length: colCount }, (_, i) => `col${i + 1}`);

      const newTable: TableData = {
        id: "tmp_" + uuid(),
        name: "Clipboard tabulka",
        columns,
        rows
      };

      handlePaste(newTable);
    } catch (err) {
      console.error("Nepodařilo se vložit obsah clipboardu:", err);
    }
  }, [handlePaste]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        handlePasteText();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handlePasteText]);

  return { handlePasteText };
}
