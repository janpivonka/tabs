// src/components/TableList.tsx
import type { Table } from "../domain/table";
import { TableItem } from "./TableItem";

interface TableListProps {
  tables: Table[];
  currentId: string | null;
  isDb?: boolean;
  onSelect: (t: Table) => void;
  renameId?: string | null;
  renameValue?: string;
  setRenameValue?: (val: string) => void;
  commitRename?: () => void;
  startRename?: (t: Table) => void;
  setDeleteTarget?: (t: Table) => void;
}

export function TableList({
  tables,
  currentId,
  isDb = false,
  onSelect,
  renameId,
  renameValue,
  setRenameValue,
  commitRename,
  startRename,
  setDeleteTarget,
}: TableListProps) {
  return (
    <ul className={isDb ? "mb-4" : "flex-1 overflow-y-auto"}>
      {tables.map(t => (
        <TableItem
          key={t.id}
          table={t}
          isSelected={currentId === t.id}
          onSelect={() => onSelect(t)}
          renameId={renameId}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          commitRename={commitRename}
          onStartRename={startRename && !isDb ? () => startRename(t) : undefined}
          onDelete={setDeleteTarget && !isDb ? () => setDeleteTarget(t) : undefined}
        />
      ))}
    </ul>
  );
}
