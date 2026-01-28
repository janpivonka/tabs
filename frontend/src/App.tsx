// src/App.tsx
import { useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { TableEditor } from "./components/table/TableEditor";
import { HistoryPanel } from "./components/history/HistoryPanel";
import { useApp } from "./hooks/useApp";

export default function App() {
  const {
    tables,
    currentId,
    setCurrentId,
    currentTable,
    history,
    historyIndex,
    historyVisible,
    setHistoryVisible,
    historyContainerRef,
    undo,
    redo,
    jumpTo,
    handleCreate,
    handleClone,
    handleImportFromClipboard,
    handleExportTable, // <--- PROPOJENO (místo alertu)
    handleRename,
    handleChangeTable,
    handleDelete,
    handleDeleteMultiple,
    handleSaveAll,
    handleSaveTable
  } = useApp();

  /**
   * KLÁVESOVÉ ZKRATKY
   * Umožňují rychlou navigaci v historii bez klikání.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z nebo Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y nebo Cmd+Y
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="flex w-full h-screen bg-white font-sans antialiased text-slate-900">
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
        onSaveAll={handleSaveAll}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        {/* HEADER */}
        <div className="h-14 px-6 flex items-center justify-between bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 active:scale-90"
              title="Zpět (Ctrl+Z)"
            >
              <span className="text-xl">↩</span>
            </button>
            <button
              onClick={redo}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 active:scale-90"
              title="Vpřed (Ctrl+Y)"
            >
              <span className="text-xl">↪</span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button
              onClick={() => setHistoryVisible(!historyVisible)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                historyVisible
                ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="mr-2">{historyVisible ? "📂" : "📁"}</span>
              Historie změn
            </button>
          </div>

          <div className="flex items-center gap-4">
            {currentTable && (
              <div className="flex items-center gap-3">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Pracovní prostor:
                </div>
                <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700 border border-slate-200">
                  {currentTable.name}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HISTORY PANEL */}
        {historyVisible && (
          <HistoryPanel
            history={history}
            historyIndex={historyIndex}
            containerRef={historyContainerRef}
            jumpTo={jumpTo}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-auto">
          {currentTable ? (
            <TableEditor
              key={currentTable.id} // Klíč zajistí reset vnitřního stavu editoru při přepnutí tabulky
              table={currentTable}
              onUpdate={handleChangeTable}
              onSave={handleSaveTable}
              onExport={handleExportTable} // <--- PROPOJENO s JSON downloadem
            />
          ) : (
            /* EMPTY STATE */
            <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-center text-4xl mb-6 shadow-slate-200/50">
                📊
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                Žádná tabulka k zobrazení
              </h3>
              <p className="text-slate-400 text-sm font-medium mb-8 max-w-[280px] text-center leading-relaxed">
                Vyberte tabulku ze seznamu vlevo nebo vytvořte úplně novou pro zahájení práce.
              </p>
              <button
                onClick={handleCreate}
                className="group flex flex-col items-center gap-3 transition-all active:scale-95"
              >
                <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm group-hover:border-indigo-300 group-hover:shadow-md group-hover:shadow-indigo-50 transition-all">
                   <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">
                    +
                   </span>
                   <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600 transition-colors">
                     Vytvořit novou tabulku
                   </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}