// src/components/SidebarFooter.tsx
interface SidebarFooterProps {
  onPaste: () => void;
  onSaveAll: () => void;
  onDeleteSelected: () => void;
  selectedCount?: number;
  isSyncing?: boolean; // Přidaná propa pro stav synchronizace
}

export function SidebarFooter({
  onPaste,
  onSaveAll,
  onDeleteSelected,
  selectedCount = 0,
  isSyncing = false,
}: SidebarFooterProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-col gap-2">
      {/* 1. IMPORT DATA - Disabled during sync */}
      <button
        onClick={onPaste}
        disabled={isSyncing}
        className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2.5 text-[11px] font-bold transition-all duration-300 border active:scale-95 group
          ${isSyncing
            ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
          }`}
      >
        <svg className={`w-4 h-4 ${isSyncing ? "text-slate-200" : "text-slate-500 group-hover:text-slate-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Import Data
      </button>

      {/* 2. SYNC NODES - Premium Emerald Gradient with Loader */}
      <button
        onClick={onSaveAll}
        disabled={isSyncing}
        className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2.5 text-[11px] font-black transition-all duration-300 shadow-md uppercase tracking-wider active:scale-95
          ${isSyncing
            ? "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed opacity-80"
            : "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-100/50 hover:brightness-110 hover:shadow-lg hover:shadow-emerald-200/50"
          }`}
      >
        {isSyncing ? (
          <div className="premium-loader !w-3 !h-3 !border-t-emerald-500" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        {isSyncing ? "Processing..." : `Sync ${hasSelection ? selectedCount : "All"}`}
      </button>

      {/* 3. DELETE NODES - Premium Rose/Red Gradient */}
      <button
        onClick={onDeleteSelected}
        disabled={isSyncing}
        className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2.5 text-[11px] font-black transition-all duration-300 shadow-md uppercase tracking-wider active:scale-95
          ${isSyncing
            ? "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed opacity-80"
            : "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-red-100/50 hover:brightness-110 hover:shadow-lg hover:shadow-red-200/50"
          }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete {hasSelection ? selectedCount : "All"}
      </button>

      {/* STATUS LINE */}
      <div className="mt-1 text-[9px] text-center text-slate-400 font-bold uppercase tracking-[0.15em] opacity-70">
        Last Sync: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </div>
    </div>
  );
}