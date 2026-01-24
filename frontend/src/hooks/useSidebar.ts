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

  const [search, setSearch] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);

  // DB tabulky: Nemají tmp_ a nezačínají clone:
  const dbTables = useMemo(
    () =>
      tables.filter(
        t => !t.id.startsWith("tmp_") && !t.id.startsWith("clone:") && t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [tables, search]
  );

  // Lokální tabulky: Mají tmp_ NEBO začínají clone:
  const localTables = useMemo(
    () =>
      tables.filter(
        t => (t.id.startsWith("tmp_") || t.id.startsWith("clone:")) && t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [tables, search]
  );

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
      try {
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
          parsed.id = "tmp_" + crypto.randomUUID();
          parsed.name = parsed.name || "Imported Table";
          onPaste(parsed);
          return;
        }
      } catch {}
      const lines = text.trim().split("\n").filter(l => l.trim());
      if (lines.length < 2) throw new Error("Neplatný formát");
      const splitRow = (row: string) => row.includes("|") ? row.split("|").map(c => c.trim()) : row.includes(",") ? row.split(",").map(c => c.trim()) : row.split("\t").map(c => c.trim());
      onPaste({
        id: "tmp_" + crypto.randomUUID(),
        name: "Imported Table",
        columns: splitRow(lines[0]),
        rows: lines.slice(1).map(splitRow),
      });
    } catch { alert("❌ Chyba clipboardu"); }
  };

  const handleDbClick = (t: Table) => {
    const cloneId = `clone:${t.id}`;
    const existingClone = localTables.find(lt => lt.id === cloneId);
    
    if (existingClone) {
      onSelect(existingClone.id);
    } else {
      const cloneTable: Table = {
        ...t,
        id: cloneId, // UNIKÁTNÍ ID PRO FRONTEND
        name: `${t.name}_clone_db`,
      };
      onPaste(cloneTable);
      onSelect(cloneTable.id);
    }
  };

  return { search, setSearch, renameId, renameValue, setRenameValue, commitRename, startRename, deleteTarget, setDeleteTarget, handlePaste, dbTables, localTables, handleDbClick };
}