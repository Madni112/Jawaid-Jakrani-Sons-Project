import React from 'react';
import { LuX } from 'react-icons/lu';

interface CashInOutModalProps {
  isCashInOutModal: boolean;
  setIsCashInOutModal: (open: boolean) => void;
  cashInOutType: 'in' | 'out';
  cashInOutAmount: number;
  setCashInOutAmount: (val: number) => void;
  cashInOutReason: string;
  setCashInOutReason: (val: string) => void;
  handleRecordMovement: () => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const CashInOutModal: React.FC<CashInOutModalProps> = ({
  isCashInOutModal,
  setIsCashInOutModal,
  cashInOutType,
  cashInOutAmount,
  setCashInOutAmount,
  cashInOutReason,
  setCashInOutReason,
  handleRecordMovement,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  if (!isCashInOutModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Record Cash {cashInOutType === 'in' ? 'In (+)' : 'Out (-)'}
          </h3>
          <button
            type="button"
            onClick={() => setIsCashInOutModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Amount (Rs.):
            </label>
            <input
              type="number"
              value={cashInOutAmount || ''}
              onChange={(e) => setCashInOutAmount(Number(e.target.value) || 0)}
              placeholder="e.g. 5000"
              className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Reason / Description:
            </label>
            <input
              type="text"
              value={cashInOutReason}
              onChange={(e) => setCashInOutReason(e.target.value)}
              placeholder="e.g. Petty cash / vendor payment"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsCashInOutModal(false)}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRecordMovement}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            style={{
              backgroundColor: accentColor,
              color: contrastText,
              border: isAccentWhite ? '1px solid #cbd5e1' : undefined
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
