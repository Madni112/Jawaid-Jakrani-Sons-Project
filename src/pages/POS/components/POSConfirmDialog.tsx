import React from 'react';
import { LuAlertTriangle, LuTrash2 } from 'react-icons/lu';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

interface POSConfirmDialogProps {
  dialog: ConfirmDialogState;
  onClose: () => void;
}

export const POSConfirmDialog: React.FC<POSConfirmDialogProps> = ({ dialog, onClose }) => {
  if (!dialog.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center animate-scaleIn space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
            dialog.isDestructive
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              : 'bg-primary/10 text-primary border border-primary/20'
          }`}
        >
          {dialog.isDestructive ? <LuTrash2 size={26} /> : <LuAlertTriangle size={26} />}
        </div>

        <div className="space-y-1.5">
          <h3 className="font-black text-base text-slate-900 dark:text-white">
            {dialog.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {dialog.message}
          </p>
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            {dialog.cancelLabel || 'Cancel'}
          </button>

          <button
            type="button"
            onClick={dialog.onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide text-white transition shadow-md cursor-pointer ${
              dialog.isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-primary hover:opacity-90'
            }`}
          >
            {dialog.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
