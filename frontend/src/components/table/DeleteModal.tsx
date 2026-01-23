import type { Table } from "../../domain/table";

interface DeleteModalProps {
  table: Table;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteModal({ table, onCancel, onConfirm }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* VAROVNÝ HEADER */}
        <div className="p-6 pb-0 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            Smazat tabulku?
          </h3>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed px-4">
            Opravdu si přejete odstranit tabulku <br />
            <span className="font-bold text-slate-700 underline decoration-red-200 decoration-2 underline-offset-4">
              {table.name}
            </span>? 
            <br />Tuto akci nelze vzít zpět.
          </p>
        </div>

        {/* TLAČÍTKA */}
        <div className="p-6 flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            Ponechat
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-200 active:scale-95"
          >
            Ano, smazat
          </button>
        </div>

        {/* SPODNÍ DEKORACE */}
        <div className="h-1 w-full bg-red-500/10"></div>
      </div>
    </div>
  );
}