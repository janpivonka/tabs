import type { Table } from "../../domain/table";
import { TableItem } from "./TableItem";

interface TableListProps {
  tables: Table[];
  currentId: string | null;
  isDb?: boolean;
  onSelect: (t: Table) => void;
  selectedIds?: string[];
  toggleSelect?: (id: string) => void;
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
  selectedIds = [],
  toggleSelect,
  renameId,
  renameValue,
  setRenameValue,
  commitRename,
  startRename,
  setDeleteTarget,
}: TableListProps) {
  return (
    <ul className={`space-y-0.5 ${isDb ? "mb-6" : "mb-2"}`}>
      {tables.length === 0 ? (
        <div className="px-3 py-4 border-2 border-dashed border-slate-200 rounded-xl text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Žádné tabulky
          </p>
        </div>
      ) : (
        tables.map((t) => (
          <TableItem
            key={t.id}
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
          />
        ))
      )}
    </ul>
  );
}
