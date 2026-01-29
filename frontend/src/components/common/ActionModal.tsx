// src/components/common/ActionModal.tsx
import { useState } from "react";

interface ActionModalProps {
  title: string;
  description: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "info"; // Info varianta pro Sync/Save
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActionModal({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ActionModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = (callback: () => void) => {
    setIsClosing(true);
    setTimeout(callback, 400);
  };

  // Konfigurace barev podle varianty
  const config = {
    danger: {
      bg: "bg-red-50",
      accent: "border-red-100",
      text: "text-red-500",
      btn: "bg-gradient-to-r from-red-600 to-orange-500 shadow-red-200/50",
      icon: "!",
      bar: "from-red-500/50 to-orange-500/50"
    },
    info: {
      bg: "bg-purple-50",
      accent: "border-purple-100",
      text: "text-purple-500",
      btn: "bg-gradient-to-r from-purple-600 to-pink-500 shadow-purple-200/50",
      icon: "✦",
      bar: "from-purple-500/50 to-pink-500/50"
    }
  }[variant];

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-500 ${isClosing ? 'opacity-0' : 'opacity-100 bg-slate-900/40'}`}>
      <style>{`
        @keyframes modal-pop-in {
          0% { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes modal-pop-out {
          0% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
          100% { opacity: 0; transform: scale(0.9) translateY(-20px); filter: blur(10px); }
        }
        .animate-modal-in { animation: modal-pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-modal-out { animation: modal-pop-out 0.4s cubic-bezier(0.4, 0, 1, 1) forwards; }
      `}</style>

      <div className={`
        bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] border border-white/60 w-full max-w-[340px] overflow-hidden
        ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}
      `}>
        <div className="p-10 pb-6 flex flex-col items-center text-center">
          <div className={`w-16 h-16 ${config.bg} ${config.accent} border-2 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner transition-transform duration-700 hover:rotate-12`}>
             <span className={`text-2xl font-black ${config.text}`}>{config.icon}</span>
          </div>

          <h3 className="text-[20px] font-black text-slate-800 tracking-tight leading-tight mb-3 italic uppercase">
            {title}
          </h3>

          <div className="text-[12px] text-slate-500 leading-relaxed font-bold opacity-80 px-4 uppercase tracking-[0.1em]">
            {description}
          </div>
        </div>

        <div className="p-8 pt-2 flex gap-3">
          <button
            onClick={() => handleClose(onCancel)}
            className="flex-1 px-4 py-3.5 bg-white/50 hover:bg-white text-slate-400 border border-white/60 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => handleClose(onConfirm)}
            className={`flex-1 px-4 py-3.5 ${config.btn} text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95`}
          >
            {confirmLabel}
          </button>
        </div>

        {/* Spodní designová linka ladící s variantou */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${config.bar}`} />
      </div>
    </div>
  );
}