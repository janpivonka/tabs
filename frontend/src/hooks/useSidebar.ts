// src/hooks/useSidebar.ts
import { useState, useMemo } from "react";
import type { Table } from "../domain/table";

interface UseSidebarProps {
  tables: Table[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onPaste: (table: Table) => void;
  onSaveAll: () => void;
}

export function useSidebar(props: UseSidebarProps) {
  const { tables, currentId, onSelect, onRename, onDelete, onPaste } = props;

  // ===== Stav =====
  const [search, setSearch] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);

  // ===== Filtrace =====
  const dbTables = useMemo(
    () =>
      tables.filter(
        t => !t.id.startsWith("tmp_") && t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [tables, search]
  );

  const localTables = useMemo(
    () =>
      tables.filter(
        t => t.id.startsWith("tmp_") && t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [tables, search]
  );

  // ===== Akce =====
  const startRename = (t: Table) => {
    setRenameId(t.id);
    setRenameValue(t.name);
  };

  const commitRename = () => {
    if (renameId && renameValue.trim()) {
      onRename(renameId, renameValue.trim());
    }
    setRenameId(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      // JSON paste
      try {
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
          parsed.id = "tmp_" + crypto.randomUUID();
          parsed.name = parsed.name || "Imported Table";
          onPaste(parsed);
          return;
        }
      } catch {}

      // CSV / TSV / pipe
      const lines = text.trim().split("\n").filter(l => l.trim());
      if (lines.length < 2) throw new Error("Neplatný formát tabulky.");

      const splitRow = (row: string) =>
        row.includes("|") ? row.split("|").map(c => c.trim()) :
        row.includes(",") ? row.split(",").map(c => c.trim()) :
        row.split("\t").map(c => c.trim());

      const columns = splitRow(lines[0]);
      const rows = lines.slice(1).map(splitRow);

      onPaste({
        id: "tmp_" + crypto.randomUUID(),
        name: "Imported Table",
        columns,
        rows,
      });
    } catch {
      alert("❌ Chyba: Nepodařilo se rozeznat obsah clipboardu");
    }
  };

  const handleDbClick = (t: Table) => {
    const existingClone = localTables.find(lt => lt.name.startsWith(`${t.name}_clone_db`));
    if (existingClone) onSelect(existingClone.id);
    else {
      const cloneTable: Table = {
        ...t,
        id: "tmp_" + crypto.randomUUID(),
        name: `${t.name}_clone_db`,
      };
      onPaste(cloneTable);
      onSelect(cloneTable.id);
    }
  };

  return {
    search,
    setSearch,
    renameId,
    renameValue,
    setRenameValue,
    commitRename,
    startRename,
    deleteTarget,
    setDeleteTarget,
    handlePaste,
    dbTables,
    localTables,
    handleDbClick,
  };
}
