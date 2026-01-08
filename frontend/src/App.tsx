import { Sidebar } from "./components/Sidebar";
import { TableEditor } from "./components/table";
import { HistoryPanel } from "./components/HistoryPanel";
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
    handlePaste,
    handleRename,
    handleChangeTable,
    handleDelete
  } = useApp();

  return (
    <div className="flex w-full h-screen">
      <Sidebar
        tables={tables}
        currentId={currentId}
        onSelect={setCurrentId}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
        onPaste={handlePaste}
        onSaveAll={() => {}}
      />

      <div className="flex-1 flex flex-col">
        <div className="p-2 flex gap-2 border-b">
          <button onClick={undo} className="px-3 py-1 bg-gray-200 rounded">↩ Undo</button>
          <button onClick={redo} className="px-3 py-1 bg-gray-200 rounded">↪ Redo</button>
          <button onClick={() => setHistoryVisible(!historyVisible)} className="px-3 py-1 bg-gray-300 rounded">📜 Historie</button>
        </div>

        {historyVisible && (
          <HistoryPanel
            history={history}
            historyIndex={historyIndex}
            containerRef={historyContainerRef}
          />
        )}

        {currentTable && (
          <TableEditor
            table={currentTable}
            onUpdate={handleChangeTable}
            onSave={() => alert("Ukládání zatím deaktivováno")}
            onExport={() => alert("Export zatím deaktivováno")}
          />
        )}
      </div>
    </div>
  );
}
