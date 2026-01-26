import { useState, useMemo } from "react";
import type { Table } from "../domain/table";

interface UseSidebarProps {
  tables: Table[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void; // Musí zde být
  onPaste: (table: Table) => void;
  onSaveAll: (ids: string[]) => void;
}

export function useSidebar(props: UseSidebarProps) {
  // Přidáme onDeleteMultiple do seznamu vytažených props
  const { 
    tables, 
    currentId, 
    onSelect, 
    onRename, 
    onDelete, 
    onDeleteMultiple, // <--- PŘIDÁNO
    onPaste 
  } = props;

  const [search, setSearch] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const dbTables = useMemo(
    () =>
      tables.filter(
        t => !t.id.startsWith("tmp_") && !t.id.startsWith("clone:") && t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [tables, search]
  );

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

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      // ... (zbytek logiky clipboardu zůstává stejný)
    } catch {
      alert("❌ Chyba clipboardu");
    }
  };

  const handleDbClick = (t: Table) => {
    const cloneId = `clone:${t.id}`;
    const existingClone = localTables.find(lt => lt.id === cloneId);
    if (existingClone) {
      onSelect(existingClone.id);
    } else {
      const cloneTable: Table = { ...t, id: cloneId, name: `${t.name}_clone_db` };
      onPaste(cloneTable);
      onSelect(cloneTable.id);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    // Teď už onDeleteMultiple nebude undefined a funkce se spustí
    if (selectedIds.length > 0) {
      onDeleteMultiple(selectedIds);
    } else {
      onDeleteMultiple(localTables.map(t => t.id));
    }
    setSelectedIds([]);
  };

  const handleSaveSelected = () => {
    const idsToSave = selectedIds.length > 0 ? selectedIds : localTables.map(t => t.id);
    props.onSaveAll(idsToSave);
    setSelectedIds([]);
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
    handlePaste: handlePasteClipboard,
    dbTables,
    localTables,
    handleDbClick,
    selectedIds,
    toggleSelect,
    handleDeleteSelected,
    handleSaveSelected,
  };
}