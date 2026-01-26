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
    handleCreate,
    handleClone,              // Pro klonování DB tabulek
    handleImportFromClipboard, // Pro import ze schránky (původní handlePasteText)
    handleRename,
    handleChangeTable,
    handleDelete,
    handleDeleteMultiple,
    handleSaveAll,
    handleSaveTable
  } = useApp();

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
        onPaste={handleImportFromClipboard} // Tlačítko "Importovat data" ve footeru
        onClone={handleClone}               // Funkce pro klonování z DB tabulek
        onSaveAll={handleSaveAll}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        <div className="h-14 px-6 flex items-center justify-between bg-white border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button onClick={undo} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 active:scale-90" title="Zpět (Ctrl+Z)">
              <span className="text-xl">↩</span>
            </button>
            <button onClick={redo} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 active:scale-90" title="Vpřed (Ctrl+Y)">
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
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Režim úprav: <span className="text-slate-900">{currentTable.name}</span>
              </div>
            )}
          </div>
        </div>

        {historyVisible && (
          <HistoryPanel
            history={history}
            historyIndex={historyIndex}
            containerRef={historyContainerRef}
          />
        )}

        <div className="flex-1 overflow-auto">
          {currentTable ? (
            <TableEditor
              key={currentTable.id}
              table={currentTable}
              onUpdate={handleChangeTable}
              onSave={handleSaveTable}
              onExport={() => alert("Exportování dat...")}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="text-6xl mb-4 opacity-20">📊</div>
              <p className="text-sm font-medium tracking-tight font-bold">Vyberte tabulku ze seznamu nebo vytvořte novou</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}