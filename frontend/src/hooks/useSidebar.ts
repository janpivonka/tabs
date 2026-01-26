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
  onDeleteMultiple: (ids: string[]) => void;
  onPaste: () => void;
  onClone: (table: Table) => void;
  onSaveAll: (ids: string[]) => void;
}

export function useSidebar(props: UseSidebarProps) {
  const {
    tables,
    onSelect,
    onRename,
    onDeleteMultiple,
    onPaste,
    onClone,
    onSaveAll
  } = props;

  const [search, setSearch] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Table | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 1. Filtrování tabulek (zůstává z nové verze)
  const dbTables = useMemo(
    () => tables.filter(t =>
      !t.id.startsWith("tmp_") &&
      !t.id.startsWith("clone:") &&
      t.name.toLowerCase().includes(search.toLowerCase())
    ),
    [tables, search]
  );

  const localTables = useMemo(
    () => tables.filter(t =>
      (t.id.startsWith("tmp_") || t.id.startsWith("clone:")) &&
      t.name.toLowerCase().includes(search.toLowerCase())
    ),
    [tables, search]
  );

  /** --- CRUD AKCE --- */
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

  const handlePaste = () => {
    onPaste();
  };

  const handleDbClick = (t: Table) => {
    const cloneId = `clone:${t.id}`;
    const existingClone = localTables.find(lt => lt.id === cloneId);

    if (existingClone) {
      onSelect(existingClone.id);
    } else {
      const cloneTable: Table = { ...t, id: cloneId, name: `${t.name}_clone_db` };
      onClone(cloneTable);
      onSelect(cloneTable.id);
    }
  };

  /** --- HROMADNÉ AKCE (Sjednoceno a opraveno) --- */
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    // Pokud jsou vybrané konkrétní checkboxy, smažeme je.
    // Pokud není vybráno nic, smažeme VŠECHNY lokální tabulky (jako v původní verzi).
    const idsToDelete = selectedIds.length > 0
      ? selectedIds
      : localTables.map(t => t.id);

    if (idsToDelete.length > 0) {
      onDeleteMultiple(idsToDelete);
      setSelectedIds([]); // Vyčistit výběr po akci
    }
  };

  const handleSaveSelected = () => {
    // Stejná logika: buď vybrané, nebo všechno lokální
    const idsToSave = selectedIds.length > 0
      ? selectedIds
      : localTables.map(t => t.id);

    if (idsToSave.length > 0) {
      onSaveAll(idsToSave);
      setSelectedIds([]); // Vyčistit výběr po akci
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
    selectedIds,
    toggleSelect,
    handleDeleteSelected,
    handleSaveSelected,
  };
}