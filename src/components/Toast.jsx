'use client';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-slide-up">
      {isSuccess && <CheckCircle2 className="text-emerald-400" size={20} />}
      {isError && <AlertCircle className="text-rose-400" size={20} />}
      {!isSuccess && !isError && <Info className="text-blue-400" size={20} />}

      <span className="text-sm font-medium pr-2">{toast.message}</span>

      <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
        <X size={16} />
      </button>
    </div>
  );
}
