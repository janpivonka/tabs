// src/components/TableItem.tsx
import type { Table } from "../domain/table";

interface TableItemProps {
  table: Table;
  isSelected: boolean;
  onSelect: () => void;
  onStartRename?: () => void;
  onDelete?: () => void;
  renameId?: string | null;
  renameValue?: string;
  setRenameValue?: (val: string) => void;
  commitRename?: () => void;
}

export function TableItem({
  table,
  isSelected,
  onSelect,
  onStartRename,
  onDelete,
  renameId,
  renameValue,
  setRenameValue,
  commitRename,
}: TableItemProps) {
  const isRenaming = renameId === table.id;

  return (
    <li
      className={`p-1 rounded ${isSelected ? "bg-blue-200" : "hover:bg-gray-200"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 cursor-pointer" onClick={onSelect}>
          {isRenaming && renameValue !== undefined && setRenameValue && commitRename ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setRenameValue("");
              }}
              className="w-full border rounded px-1"
            />
          ) : (
            <span>{table.name}</span>
          )}
        </div>
        <div className="flex gap-2 ml-2">
          {onStartRename && (
            <button onClick={onStartRename} className="text-blue-600 hover:text-blue-800">✏️</button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="text-red-600 hover:text-red-800">🗑️</button>
          )}
        </div>
      </div>
    </li>
  );
}
