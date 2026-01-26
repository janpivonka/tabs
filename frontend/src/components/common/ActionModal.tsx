// src/components/common/ActionModal.tsx
interface ActionModalProps {
  title: string;
  description: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActionModal({
  title,
  description,
  confirmLabel = "Potvrdit",
  cancelLabel = "Zrušit",
  variant = "danger",
  onConfirm,
  onCancel,
}: ActionModalProps) {

  const colors = {
    danger: { bg: "bg-red-50", icon: "⚠️", btn: "bg-red-500 hover:bg-red-600 shadow-red-200" },
    info: { bg: "bg-indigo-50", icon: "📤", btn: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200" }
  }[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 pb-0 flex flex-col items-center text-center">
          <div className={`w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center mb-4`}>
            <span className="text-2xl">{colors.icon}</span>
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
          <div className="mt-3 text-sm text-slate-500 leading-relaxed px-4">{description}</div>
        </div>

        <div className="p-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 ${colors.btn} text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}