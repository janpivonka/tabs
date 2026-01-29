// src/components/table/TableList.tsx
import type { TableData } from "../../lib/storage";
import { TableItem } from "./TableItem";

interface TableListProps {
  tables: TableData[];
  currentId: string | null;
  isDb?: boolean;
  onSelect: (t: TableData) => void;
  selectedIds?: string[];
  toggleSelect?: (id: string) => void;
  renameId?: string | null;
  renameValue?: string;
  setRenameValue?: (val: string) => void;
  commitRename?: () => void;
  startRename?: (t: TableData) => void;
  setDeleteTarget?: (t: TableData) => void;
  purgingIds?: string[];
  syncingIds?: string[];
}

export function TableList({
  tables,
  currentId,
  isDb = false,
  onSelect,
  selectedIds = [],
  toggleSelect,
  renameId,
  renameValue,
  setRenameValue,
  commitRename,
  startRename,
  setDeleteTarget,
  purgingIds = [],
  syncingIds = [],
}: TableListProps) {
  if (tables.length === 0) return null;

  return (
    <ul className="space-y-1 list-none p-0 m-0">
      {tables.map((t, index) => (
        <div
          key={t.id}
          // PŘIDÁNO: Dynamické zpoždění animace.
          // Každý další prvek v seznamu se začne animovat o 60ms později.
          style={{
            animationDelay: `${index * 60}ms`,
            // Zajišťujeme, aby se styly animace (db-entry) aplikovaly na tento wrapper
            fillMode: 'forwards'
          }}
          className={isDb ? "animate-db-entry opacity-0" : ""}
        >
          <TableItem
            table={t}
            isSelected={currentId === t.id}
            onSelect={() => onSelect(t)}
            isMultiSelected={selectedIds.includes(t.id)}
            toggleSelect={toggleSelect}
            renameId={renameId}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            commitRename={commitRename}
            onStartRename={startRename && !isDb ? () => startRename(t) : undefined}
            onDelete={setDeleteTarget && !isDb ? () => setDeleteTarget(t) : undefined}
            showCheckbox={!isDb && toggleSelect !== undefined}
            isDb={isDb}
            isPurging={purgingIds.includes(t.id)}
            isSyncing={syncingIds.includes(t.id)}
          />
        </div>
      ))}
    </ul>
  );
}