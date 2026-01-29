import { useState, useEffect } from "react";
import { useSidebar } from "../hooks/useSidebar";
import { TableList } from "./table/TableList";
import { SidebarFooter } from "./SidebarFooter";
import { ActionModal } from "./common/ActionModal";

export function Sidebar(props: any) {
  const [purgingIds, setPurgingIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const {
    search, setSearch,
    renameId, renameValue, setRenameValue,
    commitRename, startRename,
    activeModal, setActiveModal, confirmModal,
    handleDeleteClick, handlePaste,
    dbTables, localTables,
    handleDbClick,
    selectedIds, toggleSelect, toggleSelectAll,
    handleDeleteSelected, handleSaveSelected,
  } = useSidebar(props);

  useEffect(() => {
    if (props.syncingIds && props.syncingIds.length > 0) {
      setPurgingIds(prev => [...new Set([...prev, ...props.syncingIds])]);
    } else {
      const timer = setTimeout(() => setPurgingIds([]), 500);
      return () => clearTimeout(timer);
    }
  }, [props.syncingIds]);

  const handleCreateNew = () => {
    setIsCreating(true);
    props.onCreate();
    setTimeout(() => setIsCreating(false), 800);
  };

  const handleConfirmWithAnimation = async () => {
    if (!activeModal) return;
    if (activeModal.type === "delete") {
      setPurgingIds(activeModal.targets);
      setTimeout(() => {
        confirmModal();
        setPurgingIds([]);
      }, 600);
    } else {
      confirmModal();
    }
    setActiveModal(null);
  };

  const areAllSelected = localTables.length > 0 && localTables.every(t => selectedIds.includes(t.id));

  return (
    <>
      <aside className={`w-72 h-screen bg-white border-r border-slate-100 flex flex-col z-40 shadow-[4px_0_24px_rgba(0,0,0,0.01)] animate-peony-in ${isCreating ? 'ring-2 ring-purple-400/20' : ''}`}>

        <style>{`
          @keyframes peony-reveal {
            0% { opacity: 0; transform: translateX(-20px); filter: blur(12px); }
            100% { opacity: 1; transform: translateX(0); filter: blur(0); }
          }
          @keyframes peony-item-exit {
            0% { opacity: 1; transform: scale(1); filter: blur(0); }
            100% { opacity: 0; transform: translateX(-20px) scale(0.9); filter: blur(10px); }
          }
          @keyframes slide-in-bottom {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes premium-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .premium-loader {
            width: 14px;
            height: 14px;
            border: 2px solid #f1f5f9;
            border-top: 2px solid #ec4899;
            border-radius: 50%;
            animation: premium-spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          }
          .animate-peony-in { animation: peony-reveal 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .peony-exit-active { animation: peony-item-exit 0.6s cubic-bezier(0.4, 0, 1, 1) forwards !important; pointer-events: none; }
          .animate-slide-up { animation: slide-in-bottom 0.5s ease-out forwards; }
          @keyframes flower-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-flower { animation: flower-spin 15s linear infinite; }
          .animate-flower-reverse { animation: flower-spin 25s linear infinite reverse; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #e2e8f0; }
        `}</style>

        {/* 1. LOGO AREA */}
        <div className="px-6 pt-7 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="relative w-9 h-9 flex items-center justify-center">
               <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-flower opacity-20 fill-purple-500">
                  <path d="M50 0 C60 30 90 30 100 50 C70 60 70 90 50 100 C40 70 10 70 0 50 C30 40 30 10 50 0" />
               </svg>
               <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full fill-pink-500/30 scale-75 rotate-45 animate-flower-reverse">
                  <path d="M50 0 C60 30 90 30 100 50 C70 60 70 90 50 100 C40 70 10 70 0 50 C30 40 30 10 50 0" />
               </svg>
               <span className="relative font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-700 to-pink-600 text-[15px] tracking-tighter">P</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none">Explorer</h2>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Peony OS</span>
            </div>
          </div>

          {/* CREATE BUTTON + TOOLTIP */}
          <div className="relative flex items-center group/create">
            <span className="absolute right-full mr-3 text-[7px] font-black text-slate-400 uppercase opacity-0 group-hover/create:opacity-100 translate-x-1 group-hover/create:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
              Create Table
            </span>
            <button
              onClick={handleCreateNew}
              className="p-2.5 bg-white hover:bg-gradient-to-tr hover:from-purple-400 hover:to-pink-400 text-slate-300 hover:text-white rounded-2xl transition-all duration-500 shadow-sm border border-slate-100 hover:border-transparent active:scale-90"
            >
              <svg className={`w-4 h-4 ${isCreating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* 2. SEARCH AREA */}
        <div className="px-5 pb-4">
          <div className="relative group">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] focus:ring-4 focus:ring-purple-500/5 focus:border-purple-200 outline-none transition-all duration-500 font-bold"
              placeholder="Filter tables..."
            />
            <svg className="absolute left-3 top-3 w-4 h-4 text-slate-300 group-focus-within:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 3. SCROLLABLE LIST */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-8 custom-scrollbar">
          <section>
            <header className="px-3 flex items-center justify-between mb-3">
              <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Remote Source</h3>
              <div className="h-[1px] flex-1 bg-slate-50 ml-4" />
            </header>
            {dbTables.length > 0 ? (
              <TableList tables={dbTables} currentId={props.currentId} isDb onSelect={handleDbClick} />
            ) : (
              <div className="mx-1 p-6 bg-slate-50/40 border border-slate-100 rounded-[2rem] text-center border-dashed animate-slide-up">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No Cloud Data</span>
              </div>
            )}
          </section>

          <section>
            <header className="flex items-center justify-between px-3 mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Workspace</h3>
                {props.syncingIds && props.syncingIds.length > 0 && (
                  <div className="flex items-center gap-2 animate-slide-up">
                    <div className="premium-loader" />
                    <span className="text-[8px] font-black text-pink-500 uppercase tracking-widest animate-pulse">Syncing</span>
                  </div>
                )}
              </div>
              {localTables.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className={`text-[9px] font-black px-2 py-0.5 rounded-lg transition-all border uppercase tracking-widest ${
                    areAllSelected ? "bg-pink-50 text-pink-600 border-pink-100" : "text-slate-400 border-transparent hover:text-purple-500"
                  }`}
                >
                  {areAllSelected ? "Deselect" : "Select All"}
                </button>
              )}
            </header>

            <div className="space-y-1">
              {localTables.length > 0 ? (
                <TableList
                  tables={localTables}
                  currentId={props.currentId}
                  selectedIds={selectedIds}
                  toggleSelect={toggleSelect}
                  onSelect={t => props.onSelect(t.id)}
                  renameId={renameId}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  commitRename={commitRename}
                  startRename={startRename}
                  setDeleteTarget={handleDeleteClick}
                  purgingIds={purgingIds}
                  syncingIds={props.syncingIds}
                />
              ) : (
                <button
                  onClick={handleCreateNew}
                  className="group relative w-full p-8 bg-gradient-to-b from-purple-50/30 to-white border border-purple-100/50 rounded-[2rem] text-center border-dashed overflow-hidden transition-all duration-700 hover:border-purple-300 active:scale-[0.98] animate-slide-up"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-all duration-700">
                     <svg className="w-5 h-5 text-purple-300 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                     </svg>
                  </div>
                  <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">Workspace Empty</p>
                  <p className="text-[9px] text-slate-400 font-medium">Initialize your first data table</p>
                </button>
              )}
            </div>
          </section>
        </div>

        <div className="p-4 bg-white border-t border-slate-50">
          <SidebarFooter
            onPaste={handlePaste}
            onSaveAll={handleSaveSelected}
            onDeleteSelected={handleDeleteSelected}
            selectedCount={selectedIds.length}
            isSyncing={props.syncingIds?.length > 0}
          />
        </div>
      </aside>

      {activeModal && (
        <ActionModal
          variant={activeModal.type === "delete" ? "danger" : "info"}
          title={activeModal.type === "delete" ? "Delete Data" : "Cloud Sync"}
          description={
            activeModal.type === "delete"
              ? activeModal.singleName ? `Permanently delete "${activeModal.singleName}"?` : `Delete ${activeModal.targets.length} selected tables?`
              : `Sync ${activeModal.targets.length} tables to remote database?`
          }
          confirmLabel={activeModal.type === "delete" ? "Delete" : "Sync Now"}
          onConfirm={handleConfirmWithAnimation}
          onCancel={() => setActiveModal(null)}
        />
      )}
    </>
  );
}