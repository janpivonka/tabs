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

// Definice typu pro stav modálu
export type SidebarModalState = {
  type: "delete" | "sync";
  targets: string[];
  singleName?: string;
} | null;

export function useSidebar(props: UseSidebarProps) {
  const {
    tables,
    onSelect,
    onRename,
    onDelete,
    onDeleteMultiple,
    onPaste,
    onClone,
    onSaveAll
  } = props;

  const [search, setSearch] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // NOVÉ: Náhrada za deleteTarget
  const [activeModal, setActiveModal] = useState<SidebarModalState>(null);

  const dbTables = useMemo(
    () => tables.filter(t => !t.id.startsWith("tmp_") && !t.id.startsWith("clone:") && t.name.toLowerCase().includes(search.toLowerCase())),
    [tables, search]
  );

  const localTables = useMemo(
    () => tables.filter(t => (t.id.startsWith("tmp_") || t.id.startsWith("clone:")) && t.name.toLowerCase().includes(search.toLowerCase())),
    [tables, search]
  );

  /** --- AKCE PRO MODÁLY --- */

  // Potvrzení akce v modálu
  const confirmModal = () => {
    if (!activeModal) return;

    if (activeModal.type === "delete") {
      if (activeModal.targets.length === 1) {
        onDelete(activeModal.targets[0]);
      } else {
        onDeleteMultiple(activeModal.targets);
      }
    } else if (activeModal.type === "sync") {
      onSaveAll(activeModal.targets);
    }

    setSelectedIds([]);
    setActiveModal(null);
  };

  /** --- TRIGGERY MODÁLŮ --- */

  // Mazání jedné tabulky (voláno z TableList)
  const handleDeleteClick = (table: Table) => {
    setActiveModal({
      type: "delete",
      targets: [table.id],
      singleName: table.name
    });
  };

  const handleDeleteSelected = () => {
    const idsToDelete = selectedIds.length > 0 ? selectedIds : localTables.map(t => t.id);
    if (idsToDelete.length > 0) {
      setActiveModal({ type: "delete", targets: idsToDelete });
    }
  };

  const handleSaveSelected = () => {
    const idsToSave = selectedIds.length > 0 ? selectedIds : localTables.map(t => t.id);
    if (idsToSave.length > 0) {
      setActiveModal({ type: "sync", targets: idsToSave });
    }
  };

  /** --- OSTATNÍ AKCE --- */

  const startRename = (t: Table) => {
    setRenameId(t.id);
    setRenameValue(t.name);
  };

  const commitRename = () => {
    if (renameId && renameValue.trim()) onRename(renameId, renameValue.trim());
    setRenameId(null);
  };

  const handleDbClick = (t: Table) => {
    const cloneId = `clone:${t.id}`;
    const existingClone = localTables.find(lt => lt.id === cloneId);
    if (existingClone) onSelect(existingClone.id);
    else onClone({ ...t, id: cloneId, name: `${t.name}_clone_db` });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return {
    search,
    setSearch,
    renameId,
    renameValue,
    setRenameValue,
    commitRename,
    startRename,
    activeModal,    // NOVÉ
    setActiveModal, // NOVÉ
    confirmModal,   // NOVÉ
    handleDeleteClick, // NOVÉ
    handlePaste: onPaste,
    dbTables,
    localTables,
    handleDbClick,
    selectedIds,
    toggleSelect,
    handleDeleteSelected,
    handleSaveSelected,
  };
}