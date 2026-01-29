import type { TableData } from "../../lib/storage";

interface TableItemProps {
  table: TableData;
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
  isDb?: boolean;
  isPurging?: boolean;
  isSyncing?: boolean;
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
  isDb = false,
  isPurging = false,
  isSyncing = false
}: TableItemProps) {
  const isRenaming = renameId === table.id;

  // URČENÍ AKTIVNÍ ANIMACE
  const animationClass = isPurging
    ? 'peony-exit-active'
    : isDb
      ? 'animate-db-entry'
      : '';

  return (
    <li className={`group relative list-none px-1 peony-transition ${animationClass}`}>
      <div
        onClick={onSelect}
        className={`
          flex items-center justify-between px-3 py-2.5 rounded-2xl cursor-pointer
          peony-transition
          ${isSelected
            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200 scale-[1.02]"
            : "hover:bg-pink-50/60 text-slate-500 hover:text-pink-600"
          }
          ${isSyncing ? "pointer-events-none opacity-80" : ""}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden flex-1">

          {/* 1. STATUS ICON / CHECKBOX */}
          {showCheckbox && toggleSelect ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (!isSyncing) toggleSelect(table.id);
              }}
              className={`
                shrink-0 w-4 h-4 rounded-lg border flex items-center justify-center peony-transition
                ${isMultiSelected
                  ? "bg-white border-white shadow-sm"
                  : isSelected
                    ? "bg-white/20 border-white/40"
                    : "bg-white border-slate-200 group-hover:border-pink-300"
                }
              `}
            >
              {isMultiSelected && (
                <svg className={`w-2.5 h-2.5 peony-transition ${isSelected ? "text-purple-600" : "text-purple-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ) : (
            <div className={`shrink-0 peony-transition ${isSelected ? "text-white" : "text-slate-300 group-hover:text-pink-400"}`}>
              {isDb ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              ) : (
                <div className={`w-1.5 h-1.5 rounded-full peony-transition ${isSelected ? "bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-current"}`} />
              )}
            </div>
          )}

          {/* 2. TITLE / RENAME INPUT */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {isRenaming && renameValue !== undefined && setRenameValue && commitRename ? (
              <div className="flex-1 flex items-center gap-1 animate-in zoom-in-95 duration-300 relative">
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={(e) => {
                    // Ignorujeme blur, pokud klikáme na ovládací tlačítka
                    if (e.relatedTarget instanceof HTMLButtonElement) return;
                    commitRename();
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenameValue(table.name);
                  }}
                  className={`
                    w-full pl-2 pr-14 py-1 text-[12px] font-bold outline-none rounded-lg peony-transition
                    ${isSelected
                      ? "bg-white/20 text-white placeholder:text-white/50 ring-1 ring-white/30"
                      : "bg-white text-purple-700 ring-2 ring-purple-100 shadow-inner"
                    }
                  `}
                />

                {/* ACTION BUTTONS (Confirm / Cancel) */}
                <div className="absolute right-1 flex items-center gap-0.5">
                  <button
                    onMouseDown={(e) => { e.preventDefault(); commitRename(); }}
                    className={`p-1 rounded-md peony-transition ${
                      isSelected ? "hover:bg-white/20 text-white" : "hover:bg-green-50 text-green-600"
                    }`}
                    title="Confirm (Enter)"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setRenameValue(table.name); // Reset hodnoty
                      // Aby se zavřel input, musíme vyvolat commit s původní hodnotou
                      setTimeout(commitRename, 0);
                    }}
                    className={`p-1 rounded-md peony-transition ${
                      isSelected ? "hover:bg-white/20 text-white" : "hover:bg-red-50 text-red-500"
                    }`}
                    title="Cancel (Esc)"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className={`block text-[12px] truncate tracking-tight peony-transition ${
                  isSelected ? "font-bold" : "font-semibold"
                }`}>
                  {table.name}
                </span>
                {isSyncing && (
                  <div className={`premium-loader !w-2.5 !h-2.5 !border-[1.5px] ${isSelected ? '!border-t-white !border-white/20' : '!border-t-pink-500 !border-slate-200'}`} />
                )}
              </>
            )}
          </div>
        </div>

        {/* 3. QUICK ACTIONS */}
        {!isRenaming && !isSyncing && (
          <div className={`flex gap-0.5 peony-transition ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            {onStartRename && (
              <button
                onClick={(e) => { e.stopPropagation(); onStartRename(); }}
                className={`p-1.5 rounded-xl peony-transition ${
                  isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-white text-slate-400 hover:text-purple-500 hover:shadow-sm'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className={`p-1.5 rounded-xl peony-transition ${
                  isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-white text-slate-400 hover:text-pink-500 hover:shadow-sm'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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