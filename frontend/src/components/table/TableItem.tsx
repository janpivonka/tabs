import type { Table } from "../../domain/table";

interface TableItemProps {
  table: Table;
  isSelected: boolean;
  onSelect: () => void;
  isMultiSelected?: boolean;
  toggleSelect?: (id: string) => void;
  showCheckbox?: boolean;
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
  isMultiSelected = false,
  toggleSelect,
  showCheckbox = false,
  onStartRename,
  onDelete,
  renameId,
  renameValue,
  setRenameValue,
  commitRename,
}: TableItemProps) {
  const isRenaming = renameId === table.id;

  return (
    <li className="group relative list-none mb-1">
      <div
        className={`
          flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer
          ${isSelected
            ? "bg-indigo-100/80 text-indigo-900 shadow-sm ring-1 ring-indigo-200"
            : "hover:bg-white hover:shadow-md hover:shadow-slate-200/50 text-slate-600 hover:text-slate-900"
          }
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden" onClick={onSelect}>
          {showCheckbox && toggleSelect && (
            <input
              type="checkbox"
              checked={isMultiSelected}
              onChange={(e) => { e.stopPropagation(); toggleSelect(table.id); }}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
            />
          )}

          {!isRenaming && !showCheckbox && (
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-indigo-500" : "bg-slate-300 group-hover:bg-slate-400"}`} />
          )}

          {isRenaming && renameValue !== undefined && setRenameValue && commitRename ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setRenameValue(table.name);
              }}
              className="w-full bg-white border border-indigo-300 rounded-md px-2 py-0.5 text-sm outline-none shadow-[0_0_8px_rgba(79,70,229,0.1)]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm font-medium truncate tracking-tight">{table.name}</span>
          )}
        </div>

        {!isRenaming && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            {onStartRename && (
              <button
                onClick={(e) => { e.stopPropagation(); onStartRename(); }}
                className="p-1.5 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                title="Přejmenovat"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                title="Smazat"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
