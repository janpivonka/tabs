// src/components/SidebarFooter.tsx
interface SidebarFooterProps {
  onPaste: () => void;
  onSaveAll: () => void;
}

export function SidebarFooter({ onPaste, onSaveAll }: SidebarFooterProps) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      <button onClick={onPaste} className="bg-gray-300 py-1 px-3 rounded flex items-center justify-center gap-1">
        📋 Vložit z clipboardu
      </button>
      <button onClick={onSaveAll} className="bg-green-400 py-1 px-3 rounded flex items-center justify-center gap-1">
        💾 Uložit vše
      </button>
    </div>
  );
}
