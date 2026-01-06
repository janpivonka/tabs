// src/App.tsx
import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { TableEditor } from "./components/TableEditor";
import type { TableData } from "./lib/storage";
import { v4 as uuid } from "uuid";

const API_URL = "http://localhost:4000/tables";

interface TableAction {
  id: string;
  timestamp: number;
  tableId: string;
  type: "cell" | "row_add" | "row_delete" | "rename";
  description: string;
  snapshot: TableData;
}

export default function App() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [history, setHistory] = useState<TableAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [historyVisible, setHistoryVisible] = useState(false);
  const historyContainerRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<TableAction[]>([]);
  const historyIndexRef = useRef<number>(-1);
  
  // Aktualizujeme refy při změně stavů
  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("peony_tables") || "[]") as TableData[];
    fetch(API_URL)
      .then(res => res.json())
      .then((dbTablesRaw: any[]) => {
        const dbTables = dbTablesRaw
          .map(d => d.data ? { ...d.data, id: d.id } : null)
          .filter(Boolean) as TableData[];
        const merged = [...local];
        dbTables.forEach(dbT => {
          if (!merged.find(t => t.id === dbT.id)) merged.push(dbT);
        });
        setTables(merged);
      })
      .catch(() => setTables(local));
  }, []);

useEffect(() => {
  const storedHistory = JSON.parse(localStorage.getItem("peony_history") || "[]") as TableAction[];
  setHistory(storedHistory);
  historyRef.current = storedHistory;
  // Nastavíme na poslední akci v historii, jako v prohlížeči
  const lastIndex = storedHistory.length > 0 ? storedHistory.length - 1 : -1;
  setHistoryIndex(lastIndex);
  historyIndexRef.current = lastIndex;
}, []);

  const saveLocal = (tables: TableData[]) => localStorage.setItem("peony_tables", JSON.stringify(tables));

  const updateTables = (newTables: TableData[]) => {
    setTables(newTables);
    saveLocal(newTables);
  };

  const pushHistory = (table: TableData, type: TableAction["type"], description: string) => {
    const snapshot = JSON.parse(JSON.stringify(table)); // deep copy
    const action: TableAction = {
      id: uuid(),
      timestamp: Date.now(),
      tableId: table.id,
      type,
      description,
      snapshot
    };
    // Použijeme aktuální hodnoty z refů (jako v Chrome - lineární historie)
    const currentHistory = historyRef.current;
    const currentIndex = historyIndexRef.current;
    // Odstraníme vše za aktuální pozicí a přidáme novou akci
    const newHistory = [...currentHistory.slice(0, currentIndex + 1), action];
    const newIndex = newHistory.length - 1;
    setHistory(newHistory);
    historyRef.current = newHistory;
    setHistoryIndex(newIndex);
    historyIndexRef.current = newIndex;
    localStorage.setItem("peony_history", JSON.stringify(newHistory));
  };

const undo = () => {
  setHistoryIndex(prevIndex => {
    if (prevIndex < 0) return prevIndex;
    // Použijeme aktuální historii z refu
    const currentHistory = historyRef.current;
    const action = currentHistory[prevIndex];
    
    setTables(currentTables => {
      let newTables = [...currentTables];

      switch (action.type) {
        case "row_add":
          newTables = newTables.filter(t => t.id !== action.tableId);
          break;
        case "row_delete":
        case "cell":
        case "rename":
          // Pro undo použijeme snapshot z poslední akce pro stejnou tabulku před aktuální akcí
          // Pokud není žádná předchozí akce pro tuto tabulku, použijeme snapshot z aktuální akce
          let snapshotToUse = action.snapshot;
          for (let i = prevIndex - 1; i >= 0; i--) {
            if (currentHistory[i].tableId === action.tableId) {
              snapshotToUse = currentHistory[i].snapshot;
              break;
            }
          }
          newTables = newTables.map(t => t.id === action.tableId ? snapshotToUse : t);
          if (!newTables.find(t => t.id === action.tableId)) {
            newTables = [snapshotToUse, ...newTables];
          }
          break;
      }

      return newTables;
    });
    setCurrentId(action.tableId);
    const newIndex = prevIndex - 1;
    historyIndexRef.current = newIndex;
    return newIndex;
  });
};

const redo = () => {
  setHistoryIndex(prevIndex => {
    // Jdeme lineárně dopředu v historii, jako v Chrome prohlížeči
    const currentHistory = historyRef.current;
    if (prevIndex + 1 >= currentHistory.length) return prevIndex;
    
    const action = currentHistory[prevIndex + 1];
    
    setTables(currentTables => {
      let newTables = [...currentTables];

      switch (action.type) {
        case "row_add":
          // Zkontrolujeme, jestli tabulka už neexistuje (aby se nezdvojila)
          if (!newTables.find(t => t.id === action.tableId)) {
            newTables = [action.snapshot, ...newTables];
          }
          break;
        case "row_delete":
          newTables = newTables.filter(t => t.id !== action.tableId);
          break;
        case "cell":
        case "rename":
          // Aplikujeme snapshot - buď aktualizujeme existující tabulku, nebo přidáme novou
          const existingIndex = newTables.findIndex(t => t.id === action.tableId);
          if (existingIndex >= 0) {
            newTables[existingIndex] = action.snapshot;
          } else {
            newTables = [action.snapshot, ...newTables];
          }
          break;
      }

      return newTables;
    });
    setCurrentId(action.tableId);
    const newIndex = prevIndex + 1;
    historyIndexRef.current = newIndex;
    return newIndex;
  });
};

  const handleCreate = () => {
    const baseName = "Nová tabulka";
    let name = baseName;
    let counter = 2;
    while (tables.find(t => t.name.toLowerCase() === name.toLowerCase())) {
      name = `${baseName}_${counter}`;
      counter++;
    }

    const newTable: TableData = {
      id: "tmp_" + uuid(),
      name,
      columns: ["ID", "name", "col2", "col3"],
      rows: Array(4)
        .fill(null)
        .map((_, r) => ["1", "", "", ""].map((c, i) => (i === 0 ? String(r + 1) : c))),
    };

    pushHistory(newTable, "row_add", `Vytvoření nové tabulky "${name}"`);
    updateTables([newTable, ...tables]);
    setCurrentId(newTable.id);
  };

  const handleChangeTable = (updated: TableData, description?: string) => {
    const original = tables.find(t => t.id === updated.id);
    if (original && description) {
      // Nejdřív aktualizujeme tabulky
      updateTables(tables.map(t => (t.id === updated.id ? updated : t)));
      // Uložíme snapshot PO úpravě do historie
      // Pro undo použijeme snapshot z předchozí akce (stav před úpravou)
      // Pro redo použijeme snapshot z aktuální akce (stav po úpravě)
      pushHistory(updated, "cell", description);
    } else {
      updateTables(tables.map(t => (t.id === updated.id ? updated : t)));
    }
  };

  const handleRename = (id: string, newNameInput: string) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;
    pushHistory(table, "rename", `Přejmenování tabulky na "${newNameInput}"`);
    updateTables(tables.map(t => t.id === id ? { ...t, name: newNameInput } : t));
  };

  const currentTable = tables.find(t => t.id === currentId) || null;

  useEffect(() => {
    if (historyVisible && historyContainerRef.current) {
      const container = historyContainerRef.current;
      const children = Array.from(container.children) as HTMLElement[];
      const idx = history.length - 1 - historyIndex;
      const el = children[idx];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [historyIndex, historyVisible, history.length]);

  return (
    <div className="flex w-full h-screen">
      <Sidebar
        tables={tables}
        currentId={currentId}
        onSelect={setCurrentId}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={(id) => {
          const tableToDelete = tables.find(t => t.id === id);
          if (!tableToDelete) return;
          pushHistory(tableToDelete, "row_delete", `Smazání tabulky "${tableToDelete.name}"`);
          updateTables(tables.filter(t => t.id !== id));
          if (currentId === id) setCurrentId(null);
        }}
        onPaste={(newTable) => {
          pushHistory(newTable, "row_add", `Vložení tabulky "${newTable.name}" z clipboardu`);
          const newTables = [newTable, ...tables];
          updateTables(newTables);
          setCurrentId(newTable.id);
        }}
      />

      <div className="flex-1 flex flex-col">
        <div className="p-2 flex gap-2 border-b">
          <button onClick={undo} className="px-3 py-1 bg-gray-200 rounded">↩ Undo</button>
          <button onClick={redo} className="px-3 py-1 bg-gray-200 rounded">↪ Redo</button>
          <button onClick={() => setHistoryVisible(!historyVisible)} className="px-3 py-1 bg-gray-300 rounded">📜 Historie</button>
        </div>

        {historyVisible && (
          <div
            ref={historyContainerRef}
            className="p-2 border-b max-h-40 overflow-y-auto text-sm flex flex-col bg-gray-50"
          >
            {[...history].reverse().map((h, idx) => {
              const realIdx = history.length - 1 - idx;
              const isCurrent = realIdx === historyIndex;
              return (
                <div
                  key={h.id}
                  className={`px-2 py-1.5 rounded transition-colors ${
                    isCurrent 
                      ? "bg-blue-50 border-l-4 border-blue-400 text-blue-900 font-medium" 
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                  ref={isCurrent ? (el) => el && el.scrollIntoView({ behavior: "smooth", block: "center" }) : null}
                >
                  <span className="text-xs text-gray-500 mr-2">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  <span>{h.description}</span>
                </div>
              );
            })}
          </div>
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
