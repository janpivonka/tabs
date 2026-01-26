// src/components/Sidebar.tsx
import { useSidebar } from "../hooks/useSidebar";
import { TableList } from "./table/TableList";
import { SidebarFooter } from "./SidebarFooter";
import { ActionModal } from "./common/ActionModal"; // Tady už importujeme tvůj nový modal

export function Sidebar(props: any) {
  const {
    search,
    setSearch,
    renameId,
    renameValue,
    setRenameValue,
    commitRename,
    startRename,
    // --- ZMĚNA: Používáme nové funkce z useSidebar ---
    activeModal,
    setActiveModal,
    confirmModal,
    handleDeleteClick,
    // ------------------------------------------------
    handlePaste,
    dbTables,
    localTables,
    handleDbClick,
    selectedIds,
    toggleSelect,
    handleDeleteSelected,
    handleSaveSelected,
  } = useSidebar(props);

  return (
    <>
      <aside className="w-72 h-screen bg-slate-50 border-r border-slate-200 flex flex-col shadow-[1px_0_5px_rgba(0,0,0,0.02)]">
        {/* HEADER */}
        <div className="p-6 pb-2">
          <h2 className="text-lg font-black text-slate-800 tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            Tabulky
          </h2>
          <div className="relative group mb-4">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="Rychlé hledání..."
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>

          <button
            onClick={props.onCreate}
            className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="text-lg">+</span> Nová tabulka
          </button>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-slate-200">
          {/* DB TABLES */}
          <div className="mb-6">
            <h3 className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 flex items-center justify-between">
              Databázové
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>
            <TableList
              tables={dbTables}
              currentId={props.currentId}
              isDb
              onSelect={handleDbClick}
            />
          </div>

          {/* LOCAL TABLES */}
          <div className="mb-6">
            <h3 className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 flex items-center justify-between">
              Lokální pracovní kopie
            </h3>
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
              // --- ZMĚNA: Používáme handleDeleteClick pro modál ---
              setDeleteTarget={handleDeleteClick}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t border-slate-200">
          <SidebarFooter
            onPaste={handlePaste}
            onSaveAll={handleSaveSelected}
            onDeleteSelected={handleDeleteSelected}
            selectedCount={selectedIds.length}
          />
        </div>
      </aside>

      {/* JEDNOTNÝ MODÁL PRO VŠECHNY AKCE V SIDEBARU */}
      {activeModal && (
        <ActionModal
          variant={activeModal.type === "delete" ? "danger" : "info"}
          title={activeModal.type === "delete" ? "Smazat data" : "Synchronizace"}
          description={
            activeModal.type === "delete"
              ? activeModal.singleName 
                ? `Opravdu chcete smazat tabulku "${activeModal.singleName}"?` 
                : `Opravdu chcete smazat ${activeModal.targets.length} vybraných kopií?`
              : `Chcete odeslat ${activeModal.targets.length} vybraných tabulek do databáze?`
          }
          confirmLabel={activeModal.type === "delete" ? "Smazat" : "Odeslat"}
          onConfirm={confirmModal}
          onCancel={() => setActiveModal(null)}
        />
      )}
    </>
  );
}