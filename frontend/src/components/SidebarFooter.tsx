interface SidebarFooterProps {
  onPaste: () => void;
  onSaveAll: () => void;
}

export function SidebarFooter({ onPaste, onSaveAll }: SidebarFooterProps) {
  return (
    <div className="flex flex-col gap-2">
      <button 
        onClick={onPaste} 
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors border border-slate-200"
      >
        <span className="text-base">📋</span> Importovat data
      </button>
      
      <button 
        onClick={onSaveAll} 
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all shadow-lg shadow-emerald-100 uppercase tracking-wider"
      >
        <span className="text-base">💾</span> Synchronizovat vše
      </button>
      
      <div className="mt-1 text-[9px] text-center text-slate-400 font-medium italic">
        Poslední synchronizace: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </div>
    </div>
  );
}