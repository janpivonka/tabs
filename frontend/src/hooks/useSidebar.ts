// src/hooks/useSidebar.ts
import { useState, useMemo } from "react";
import type { TableData } from "../lib/storage"; // Sjednoceno na TableData

interface UseSidebarProps {
  tables: TableData[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onPaste: () => void;
  onClone: (table: TableData) => void;
  onSaveAll: (ids: string[]) => void;
}

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
  const [activeModal, setActiveModal] = useState<SidebarModalState>(null);

  // Filter for Database (Master) Tables
  const dbTables = useMemo(
    () => tables.filter(t =>
      !t.id.startsWith("tmp_") &&
      !t.id.startsWith("clone:") &&
      t.name.toLowerCase().includes(search.toLowerCase())
    ),
    [tables, search]
  );

  // Filter for Local Workspace Copies
  const localTables = useMemo(
    () => tables.filter(t =>
      (t.id.startsWith("tmp_") || t.id.startsWith("clone:")) &&
      t.name.toLowerCase().includes(search.toLowerCase())
    ),
    [tables, search]
  );

  /** --- MODAL ACTIONS --- */

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

  /** --- TRIGGER HANDLERS --- */

  const handleDeleteClick = (table: TableData) => {
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

  /** --- SELECTION LOGIC --- */

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allLocalIds = localTables.map(t => t.id);
    const areAllSelected = allLocalIds.length > 0 && allLocalIds.every(id => selectedIds.includes(id));

    if (areAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allLocalIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...allLocalIds])));
    }
  };

  /** --- CORE ACTIONS --- */

  const startRename = (t: TableData) => {
    setRenameId(t.id);
    setRenameValue(t.name);
  };

  const commitRename = () => {
    if (renameId && renameValue.trim()) onRename(renameId, renameValue.trim());
    setRenameId(null);
  };

  /**
   * FIX: DATABASE CLICK LOGIC
   * Kontroluje, zda již existuje lokální klon pro danou DB tabulku.
   */
  const handleDbClick = (t: TableData) => {
    const targetCloneName = `${t.name} (clone)`;

    // Hledáme klon, který má buď stejný název, nebo odkazuje na originální ID
    const existingClone = localTables.find(lt =>
      lt.name === targetCloneName || (lt as any).originDbId === t.id
    );

    if (existingClone) {
      // Pokud klon už v pracovním prostoru je, jen ho aktivujeme
      onSelect(existingClone.id);
    } else {
      // Jinak vytvoříme nový klon (handleClone v useApp se postará o zbytek)
      onClone(t);
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
    activeModal,
    setActiveModal,
    confirmModal,
    handleDeleteClick,
    handlePaste: onPaste,
    dbTables,
    localTables,
    handleDbClick,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    handleDeleteSelected,
    handleSaveSelected,
  };
}