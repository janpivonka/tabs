// src/App.tsx
import { useEffect, useState, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { TableEditor } from "./components/table/TableEditor";
import { HistoryPanel } from "./components/history/HistoryPanel";
import { useApp } from "./hooks/useApp";

import logoSrc from "./assets/icons/logo.png";

export default function App() {
  const {
    tables, currentId, setCurrentId, currentTable,
    history, clearHistory, historyIndex, historyVisible, setHistoryVisible,
    historyContainerRef, undo, redo, jumpTo,
    handleCreate, handleClone, handleImportFromClipboard,
    handleExportTable, handleRename, handleChangeTable,
    handleDelete, handleDeleteMultiple, handleSaveAll,
    handleSaveTable: originalSaveTable
  } = useApp();

  const [syncingIds, setSyncingIds] = useState<string[]>([]);

  // GENERAVÁNÍ NÁHODNÝCH POZIC PRO HVĚZDY (aby se neměnily při každém renderu)
  const starField = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 15 + 5,
      delay: `${Math.random() * 2}s`,
      duration: `${Math.random() * 1 + 1}s`
    }));
  }, []);

  const handleEnhancedSave = async () => {
    if (!currentTable) return;
    setSyncingIds(prev => [...prev, currentTable.id]);
    await new Promise(resolve => setTimeout(resolve, 400));
    const success = await originalSaveTable();
    if (success) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    setSyncingIds(prev => prev.filter(id => id !== currentTable.id));
  };

  const handleEnhancedSaveAll = async (ids?: string[]) => {
    const idsToSync = ids && ids.length > 0
      ? ids
      : tables.filter(t => !t.isRemote).map(t => t.id);

    if (idsToSync.length === 0) return;
    setSyncingIds(idsToSync);
    await new Promise(resolve => setTimeout(resolve, 600));
    await handleSaveAll(idsToSync);
    await new Promise(resolve => setTimeout(resolve, 800));
    setSyncingIds([]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const isAnySyncing = syncingIds.length > 0;
  const isCurrentTableSyncing = currentTable && syncingIds.includes(currentTable.id);

  return (
    <div className="fixed inset-0 flex w-full h-screen bg-white font-sans antialiased text-slate-900 overflow-hidden select-none">

      <style>{`
        @keyframes peony-main-reveal {
          0% { opacity: 0; filter: blur(12px); transform: scale(1.01); }
          100% { opacity: 1; filter: blur(0); transform: scale(1); }
        }

        /* ANIMACE PRO HVĚZDNÉ POLE */
        @keyframes star-twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 0.8; transform: scale(1.2) rotate(180deg); }
        }

        .animate-star-field {
          animation: star-twinkle var(--star-duration) infinite ease-in-out;
          animation-delay: var(--star-delay);
        }

        /* ... zbytek vašich animací (db-entry, history, transfer-out, atd.) ... */
        .animate-db-entry { animation: db-entry 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes db-entry { 0% { opacity: 0; transform: translateY(8px) scale(0.98); filter: blur(4px); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
        .history-grid-container { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, transform 0.5s ease; opacity: 0; transform: translateY(-8px); }
        .history-grid-container.is-visible { grid-template-rows: 1fr; opacity: 1; transform: translateY(0); }
        .history-grid-inner { overflow: hidden; min-height: 0; }
        .animate-main-fade { animation: peony-main-reveal 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes data-transfer-out { 0% { transform: translateY(0) scale(1); filter: blur(0) brightness(1); opacity: 1; } 100% { transform: translateY(-30px) scale(0.98); filter: blur(20px) brightness(1.6); opacity: 0; } }
        .animate-transfer-out { animation: data-transfer-out 0.9s cubic-bezier(0.45, 0, 0.55, 1) forwards; }
        @keyframes flower-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-flower-slow { animation: flower-spin 20s linear infinite; }
        .animate-flower-reverse-slow { animation: flower-spin 30s linear infinite reverse; }
        @keyframes float-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-float-gentle { animation: float-gentle 12s ease-in-out infinite; }
        .header-mask { mask-image: linear-gradient(to bottom, black 80%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%); }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <Sidebar
        tables={tables}
        currentId={currentId}
        onSelect={setCurrentId}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
        onDeleteMultiple={handleDeleteMultiple}
        onPaste={handleImportFromClipboard}
        onClone={handleClone}
        onSaveAll={handleEnhancedSaveAll}
        syncingIds={syncingIds}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 relative overflow-hidden">

        {/* --- BRANDING BACKGROUND + STAR FIELD --- */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 overflow-hidden">

          {/* HVĚZDNÉ POLE - Aktivuje se při jakékoliv synchronizaci */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isAnySyncing ? 'opacity-100' : 'opacity-0'}`}>
            {starField.map(star => (
              <span
                key={star.id}
                className="absolute animate-star-field text-pink-400/40 font-bold"
                style={{
                  top: star.top,
                  left: star.left,
                  fontSize: `${star.size}px`,
                  '--star-delay': star.delay,
                  '--star-duration': star.duration
                } as any}
              >
                ✦
              </span>
            ))}
          </div>

          <div className="absolute w-[900px] h-[900px] bg-pink-500/10 rounded-full blur-[160px]" />

          <img
            src={logoSrc}
            alt="Logo background"
            className="w-[32rem] h-[32rem] object-contain animate-float-gentle opacity-[0.12] transition-all duration-1000 ease-in-out"
            style={{
                filter: 'hue-rotate(285deg) brightness(1.1) saturate(1.2)',
                transform: currentTable ? 'scale(0.8) translateY(60px)' : 'scale(1)'
            }}
          />

          <div className="mt-4 flex flex-col items-center">
            <h2 className="text-xl font-black italic tracking-[0.65em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-500 to-purple-400 opacity-60">
              Peony Production
            </h2>
            <div className="relative w-14 h-14 mt-6 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-flower-slow opacity-30 fill-purple-500">
                    <path d="M50 0 C60 30 90 30 100 50 C70 60 70 90 50 100 C40 70 10 70 0 50 C30 40 30 10 50 0" />
                </svg>
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full fill-pink-500 opacity-20 scale-75 rotate-45 animate-flower-reverse-slow">
                    <path d="M50 0 C60 30 90 30 100 50 C70 60 70 90 50 100 C40 70 10 70 0 50 C30 40 30 10 50 0" />
                </svg>
                <span className="relative font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-700 to-pink-600 text-[18px] tracking-tighter opacity-70">P</span>
            </div>
            <div className="h-[1px] w-56 bg-gradient-to-r from-transparent via-pink-500/40 to-transparent mt-6" />
          </div>
        </div>

        {/* --- HEADER --- */}
        <div className="h-20 px-6 flex items-center justify-between z-40 shrink-0 sticky top-0 bg-gradient-to-b from-white via-white/80 to-transparent backdrop-blur-sm header-mask">
          <div className="flex items-center gap-1.5 mb-2">
            <button onClick={undo} className="p-2 hover:bg-pink-50 rounded-xl transition-all text-slate-400 hover:text-pink-500 active:scale-90 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            <button onClick={redo} className="p-2 hover:bg-pink-50 rounded-xl transition-all text-slate-400 hover:text-pink-500 active:scale-90 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
            </button>
            <div className="w-px h-4 bg-slate-200/50 mx-2" />
            <button
              onClick={() => setHistoryVisible(!historyVisible)}
              className={`px-4 py-1.5 rounded-xl text-[11px] font-black tracking-widest transition-all border shadow-sm ${historyVisible ? "bg-pink-500 border-pink-400 text-white shadow-pink-200" : "bg-white border-slate-100 text-slate-500 hover:border-pink-200 hover:text-pink-500"}`}
            >
              HISTORY
            </button>
          </div>

          <div className="flex items-center gap-4 mb-2">
            {currentTable && (
              <div key={`head-${currentTable.id}`} className="flex items-center gap-3 animate-main-fade">
                {isCurrentTableSyncing && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full border border-purple-100 animate-pulse">
                    <div className="premium-loader !w-2 !h-2 !border-[1.5px] !border-t-purple-600 !border-purple-200" />
                    <span className="text-[8px] font-black text-purple-600 uppercase tracking-widest">Migrating to Cloud</span>
                  </div>
                )}
                <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase opacity-60">Actual Table:</span>
                <div className="px-4 py-1.5 bg-white/60 border border-white rounded-xl text-[12px] font-black text-slate-700 shadow-sm backdrop-blur-md">
                  {currentTable.name}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`z-30 relative history-grid-container ${historyVisible ? "is-visible" : ""}`}>
          <div className="history-grid-inner">
            <HistoryPanel onClearHistory={clearHistory} history={history} historyIndex={historyIndex} containerRef={historyContainerRef} jumpTo={jumpTo} />
          </div>
        </div>

        <div className="flex-1 relative z-10 overflow-hidden -mt-20">
          {currentTable ? (
            <div
              key={currentTable.id}
              className={`h-full w-full pt-20 bg-white/40 backdrop-blur-[1px] animate-main-fade overflow-auto relative
                ${isCurrentTableSyncing ? "animate-transfer-out pointer-events-none" : ""}`}
            >
              <TableEditor
                table={currentTable}
                onUpdate={handleChangeTable}
                onSave={handleEnhancedSave}
                onExport={handleExportTable}
                isSyncing={isCurrentTableSyncing}
              />
            </div>
          ) : (
            <div key="empty-state" className="h-full w-full flex flex-col items-center justify-center animate-main-fade overflow-hidden">
              <div className="text-center space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase opacity-90">System Standby</h3>
                  <p className="text-pink-500/50 text-[11px] font-bold tracking-[0.5em] uppercase">Awaiting Initialization</p>
                </div>
                <button onClick={handleCreate} className="group relative px-10 py-4 transition-all active:scale-95">
                  <div className="absolute inset-0 bg-pink-500 rounded-2xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative flex items-center gap-3 bg-slate-900 px-8 py-3.5 rounded-2xl shadow-2xl group-hover:bg-pink-600 transition-all duration-500">
                    <span className="text-pink-400 text-lg font-light group-hover:text-white">+</span>
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">New Instance</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}