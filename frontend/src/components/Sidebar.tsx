import { useState } from "react";
import type { TableData } from "../lib/storage";
import { v4 as uuid } from "uuid";

interface SidebarProps {
  tables: TableData[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onSelectDb: (table: TableData) => void;
  onCreate: () => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onPaste: (table: TableData) => void;
  onSaveAll: () => void;
}

export function Sidebar({
  tables,
  currentId,
  onSelect,
  onSelectDb,
  onCreate,
  onRename,
  onDelete,
  onPaste,
  onSaveAll
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TableData | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      try {
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
          parsed.id = "tmp_" + uuid();
          parsed.name = parsed.name || "Imported Table";
          return onPaste(parsed);
        }
      } catch (_) {}

      const lines = text.trim().split("\n").filter(l => l.trim().length > 0);
      if (lines.length < 2) throw new Error("Neplatný formát tabulky.");

      const splitRow = (row: string) =>
        row.includes("|") ? row.split("|").map(c => c.trim()) :
        row.includes(",") ? row.split(",").map(c => c.trim()) :
        row.split("\t").map(c => c.trim());

      const columns = splitRow(lines[0]);
      const rows = lines.slice(1).map(splitRow);

      onPaste({
        id: "tmp_" + uuid(),
        name: "Imported Table",
        columns,
        rows
      });

    } catch (e) {
      alert("❌ Chyba: Nepodařilo se rozeznat obsah clipboardu");
    }
  };

  const dbTables = tables.filter(
    t => !t.id.startsWith("tmp_") && t.name.toLowerCase().includes(search.toLowerCase())
  );

  const localTables = tables.filter(
    t => t.id.startsWith("tmp_") && t.name.toLowerCase().includes(search.toLowerCase())
  );

  const startRename = (t: TableData) => {
    setRenameId(t.id);
    setRenameValue(t.name);
  };

  const commitRename = () => {
    if (renameId && renameValue.trim().length > 0) {
      onRename(renameId, renameValue.trim());
    }
    setRenameId(null);
  };

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
          onClick={onCreate}
          className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 mb-4"
        >
          ➕ Nová tabulka
        </button>

        {/* ===================== DB TABLES ===================== */}
        <h3 className="text-sm text-gray-600 mt-2 mb-1">📁 Databázové tabulky</h3>
        <ul className="mb-4">
          {dbTables.map(t => {
            // Hledáme existující lokální klon s _clone_db
            const existingClone = localTables.find(
              lt => lt.name.startsWith(`${t.name}_clone_db`)
            );

            return (
              <li
                key={t.id}
                onClick={() => {
                  if (existingClone) {
                    // Pokud klon existuje, přepneme se na něj
                    onSelect(existingClone.id);
                  } else {
                    // Jinak vytvoříme novou lokální kopii
                    const cloneTable: TableData = {
                      ...t,
                      id: "tmp_" + uuid(),
                      name: `${t.name}_clone_db`
                    };
                    onPaste(cloneTable);
                    onSelect(cloneTable.id);
                  }
                }}
                className="cursor-pointer hover:bg-gray-200 p-1 rounded"
              >
                {t.name}
              </li>
            );
          })}
        </ul>

        {/* ===================== LOCAL TABLES ===================== */}
        <h3 className="text-sm text-gray-600 mt-2 mb-1">💾 Lokální tabulky</h3>
        <ul className="flex-1 overflow-y-auto">
          {localTables.map(t => (
            <li
              key={t.id}
              className={`p-1 rounded ${currentId === t.id ? "bg-blue-200" : "hover:bg-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                {/* Název / input */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => renameId !== t.id && onSelect(t.id)}
                >
                  {renameId === t.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={e => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setRenameId(null);
                      }}
                      className="w-full border rounded px-1"
                    />
                  ) : (
                    <span>{t.name}</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 ml-2">
                  {/* Edit SVG */}
                  <button onClick={() => startRename(t)} className="text-blue-600 hover:text-blue-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5m-7-7l7 7" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => setDeleteTarget(t)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Footer buttons */}
        <div className="mt-4 flex flex-col gap-2">
          <button onClick={handlePaste} className="bg-gray-300 py-1 px-3 rounded flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8m-6-8h6a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
            </svg>
            Vložit z clipboardu
          </button>

          <button onClick={onSaveAll} className="bg-green-400 py-1 px-3 rounded flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Uložit vše
          </button>
        </div>
      </aside>

      {/* ===================== DELETE CONFIRM MODAL ===================== */}
      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white p-6 rounded shadow-lg w-80 pointer-events-auto animate-fadeIn">
            <h3 className="font-semibold text-lg mb-3">Smazat tabulku?</h3>
            <p className="mb-4">
              Opravdu chceš smazat tabulku <strong>{deleteTarget.name}</strong>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                Zrušit
              </button>

              <button
                onClick={() => {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Smazat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL ANIMATION ===================== */}
      <style>{`
        @keyframes fadeIn {
          from {opacity: 0; transform: translateY(-10px);}
          to {opacity: 1; transform: translateY(0);}
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
}
