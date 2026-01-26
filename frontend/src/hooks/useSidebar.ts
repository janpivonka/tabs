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

  // Stav pro ActionModal
  const [activeModal, setActiveModal] = useState<SidebarModalState>(null);

  // Filtrované tabulky z DB
  const dbTables = useMemo(
    () => tables.filter(t =>
      !t.id.startsWith("tmp_") &&
      !t.id.startsWith("clone:") &&
      t.name.toLowerCase().includes(search.toLowerCase())
    ),
    [tables, search]
  );

  // Filtrované lokální pracovní kopie
  const localTables = useMemo(
    () => tables.filter(t =>
      (t.id.startsWith("tmp_") || t.id.startsWith("clone:")) &&
      t.name.toLowerCase().includes(search.toLowerCase())
    ),
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

  /** --- SELEKCE --- */

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // NOVÉ: Funkce pro hromadné označení/odoznačení viditelných lokálních tabulek
  const toggleSelectAll = () => {
    const allLocalIds = localTables.map(t => t.id);
    const areAllSelected = allLocalIds.length > 0 && allLocalIds.every(id => selectedIds.includes(id));

    if (areAllSelected) {
      // Pokud jsou všechny vybrané, odoznačíme ty, které jsou aktuálně v localTables
      setSelectedIds(prev => prev.filter(id => !allLocalIds.includes(id)));
    } else {
      // Jinak přidáme všechny z localTables (pomocí Set zajistíme unikátnost)
      setSelectedIds(prev => Array.from(new Set([...prev, ...allLocalIds])));
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
    toggleSelectAll, // Exportováno pro Sidebar
    handleDeleteSelected,
    handleSaveSelected,
  };
}