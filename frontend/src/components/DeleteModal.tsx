// src/components/DeleteModal.tsx
import type { Table } from "../domain/table";

interface DeleteModalProps {
  table: Table;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteModal({ table, onCancel, onConfirm }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
      <div className="bg-white p-6 rounded shadow-lg w-80 pointer-events-auto animate-fadeIn">
        <h3 className="font-semibold text-lg mb-3">Smazat tabulku?</h3>
        <p className="mb-4">Opravdu chceš smazat tabulku <strong>{table.name}</strong>?</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-3 py-1 bg-gray-300 rounded">Zrušit</button>
          <button onClick={onConfirm} className="px-3 py-1 bg-red-600 text-white rounded">Smazat</button>
        </div>
      </div>
    </div>
  );
}
