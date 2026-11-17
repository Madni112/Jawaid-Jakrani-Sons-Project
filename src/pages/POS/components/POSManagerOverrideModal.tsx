import React from 'react';
import { LuShieldCheck } from 'react-icons/lu';

interface POSManagerOverrideModalProps {
  isOpen: boolean;
  managerOverrideReason: 'discount' | 'refund';
  pendingDiscountValue: number;
  managerOverridePasswordInput: string;
  setManagerOverridePasswordInput: (val: string) => void;
  handleVerifyManagerOverride: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const POSManagerOverrideModal: React.FC<POSManagerOverrideModalProps> = ({
  isOpen,
  managerOverrideReason,
  pendingDiscountValue,
  managerOverridePasswordInput,
  setManagerOverridePasswordInput,
  handleVerifyManagerOverride,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111622] border border-amber-500/40 p-5 shadow-2xl space-y-4 animate-scaleUp">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
            <LuShieldCheck />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Manager Approval Required
            </h3>
            <p className="text-[11px] text-slate-400">
              {managerOverrideReason === 'discount'
                ? `Authorize ${pendingDiscountValue}% discount on this order`
                : 'Authorize customer refund from cash drawer'}
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyManagerOverride} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Enter POS Admin / Manager Password:
            </label>
            <input
              type="password"
              autoFocus
              required
              value={managerOverridePasswordInput}
              onChange={(e) => setManagerOverridePasswordInput(e.target.value)}
              placeholder="Manager password / PIN..."
              className="w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-amber-500/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Authorize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
