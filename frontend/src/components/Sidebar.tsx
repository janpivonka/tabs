// src/components/Sidebar.tsx
import { useSidebar } from "../hooks/useSidebar";
import { TableList } from "./TableList";
import { SidebarFooter } from "./SidebarFooter";
import { DeleteModal } from "./DeleteModal";

export function Sidebar(props: any) {
  const {
    search,
    setSearch,
    renameId,
    renameValue,
    setRenameValue,
    commitRename,
    startRename,
    deleteTarget,
    setDeleteTarget,
    handlePaste,
    dbTables,
    localTables,
    handleDbClick,
  } = useSidebar(props);

  return (
    <>
      <aside className="w-64 h-screen bg-gray-100 border-r p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Tabulky</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3 p-1 border rounded"
          placeholder="Hledat..."
        />
        <button
          onClick={props.onCreate}
          className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 mb-4"
        >
          ➕ Nová tabulka
        </button>

        <h3 className="text-sm text-gray-600 mt-2 mb-1">📁 Databázové tabulky</h3>
        <TableList
          tables={dbTables}
          currentId={props.currentId}
          isDb
          onSelect={handleDbClick}
        />

        <h3 className="text-sm text-gray-600 mt-2 mb-1">💾 Lokální tabulky</h3>
        <TableList
          tables={localTables}
          currentId={props.currentId}
          onSelect={t => props.onSelect(t.id)}
          renameId={renameId}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          commitRename={commitRename}
          startRename={startRename}
          setDeleteTarget={setDeleteTarget}
        />

        <SidebarFooter onPaste={handlePaste} onSaveAll={props.onSaveAll} />
      </aside>

      {deleteTarget && (
        <DeleteModal
          table={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => { props.onDelete(deleteTarget.id); setDeleteTarget(null); }}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from {opacity: 0; transform: translateY(-10px);}
          to {opacity: 1; transform: translateY(0);}
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>
    </>
  );
}
