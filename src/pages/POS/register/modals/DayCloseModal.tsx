import React from 'react';
import { LuLock, LuX } from 'react-icons/lu';
import { PosShift } from '../../../../service/posService';

interface DayCloseModalProps {
  isCloseShiftModal: boolean;
  setIsCloseShiftModal: (open: boolean) => void;
  activeShift: PosShift | null;
  dayCloseDate: string;
  setDayCloseDate: (date: string) => void;
  dayCloseCashOut: number;
  setDayCloseCashOut: (val: number) => void;
  dayCloseCashIn: number;
  setDayCloseCashIn: (val: number) => void;
  dayCloseNotes: string;
  setDayCloseNotes: (notes: string) => void;
  handleCloseShift: () => void;
}

export const DayCloseModal: React.FC<DayCloseModalProps> = ({
  isCloseShiftModal,
  setIsCloseShiftModal,
  activeShift,
  dayCloseDate,
  setDayCloseDate,
  dayCloseCashOut,
  setDayCloseCashOut,
  dayCloseCashIn,
  setDayCloseCashIn,
  dayCloseNotes,
  setDayCloseNotes,
  handleCloseShift,
}) => {
  if (!isCloseShiftModal || !activeShift) return null;

  const sales = activeShift.cash_sales || 0;
  const openPetty = activeShift.opening_petty_cash ?? activeShift.opening_float ?? 0;
  const remainingPetty = Math.max(0, sales - (Number(dayCloseCashOut) || 0) + (Number(dayCloseCashIn) || 0) + openPetty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <LuLock className="text-rose-500" size={18} />
            <span>Day Close & Petty Cash Carry Forward</span>
          </h3>
          <button
            type="button"
            onClick={() => setIsCloseShiftModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Closing Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Closing Date:</span>
              <span className="text-[10px] text-slate-400 font-normal">Day being closed</span>
            </label>
            <input
              type="date"
              value={dayCloseDate}
              onChange={(e) => setDayCloseDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Day Figures Summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Today's Cash Sales
              </span>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                Rs. {(activeShift.cash_sales || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Opening Petty Cash
              </span>
              <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                Rs. {(activeShift.opening_petty_cash ?? activeShift.opening_float ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Cash Out Input (Sales Collection / Bank Deposit) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Cash Out (Owner Payout / Bank Deposit) (Rs.):</span>
              <span className="text-[10px] text-rose-500 font-bold">Subtracted (-)</span>
            </label>
            <input
              type="number"
              value={dayCloseCashOut || ''}
              onChange={(e) => setDayCloseCashOut(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Cash In Input (Optional) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Cash In (Optional) (Rs.):</span>
              <span className="text-[10px] text-emerald-500 font-bold">Added (+)</span>
            </label>
            <input
              type="number"
              value={dayCloseCashIn || ''}
              onChange={(e) => setDayCloseCashIn(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Formula & Remaining Petty Cash Card */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Calculated Closing Petty Cash (Carried to Next Day)
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              Rs. {remainingPetty.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Sale (Rs. {sales.toLocaleString()}) - Cash Out (Rs. {Number(dayCloseCashOut).toLocaleString()}) + Cash In (Rs. {Number(dayCloseCashIn).toLocaleString()}) + Opening Petty (Rs. {openPetty.toLocaleString()})
            </div>
          </div>

          {/* Closing Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Closing Notes (Optional):
            </label>
            <input
              type="text"
              value={dayCloseNotes}
              onChange={(e) => setDayCloseNotes(e.target.value)}
              placeholder="e.g. End of day reconciliation by Alex"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsCloseShiftModal(false)}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCloseShift}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer hover:opacity-90 bg-rose-600 hover:bg-rose-700"
          >
            Confirm & Close Day
          </button>
        </div>
      </div>
    </div>
  );
};
