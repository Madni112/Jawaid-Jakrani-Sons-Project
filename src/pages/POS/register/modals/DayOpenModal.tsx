import React from 'react';
import { LuUnlock, LuX } from 'react-icons/lu';

interface DayOpenModalProps {
  isOpenShiftModal: boolean;
  setIsOpenShiftModal: (open: boolean) => void;
  dayOpenDate: string;
  handleDayOpenDateChange: (date: string) => void;
  dayOpenPettyCash: number;
  setDayOpenPettyCash: (amount: number) => void;
  pettyCashSource: string;
  dayOpenCashIn: number;
  setDayOpenCashIn: (amount: number) => void;
  dayOpenCashOut: number;
  setDayOpenCashOut: (amount: number) => void;
  handleOpenShift: () => void;
}

export const DayOpenModal: React.FC<DayOpenModalProps> = ({
  isOpenShiftModal,
  setIsOpenShiftModal,
  dayOpenDate,
  handleDayOpenDateChange,
  dayOpenPettyCash,
  setDayOpenPettyCash,
  pettyCashSource,
  dayOpenCashIn,
  setDayOpenCashIn,
  dayOpenCashOut,
  setDayOpenCashOut,
  handleOpenShift,
}) => {
  if (!isOpenShiftModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <LuUnlock className="text-emerald-500" size={18} />
            <span>Day Open (Petty Cash & Initial Change)</span>
          </h3>
          <button
            type="button"
            onClick={() => setIsOpenShiftModal(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Date Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Business Date:</span>
              <span className="text-[10px] text-slate-400 font-normal">Select Operating Day</span>
            </label>
            <input
              type="date"
              value={dayOpenDate}
              onChange={(e) => handleDayOpenDateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Opening Petty Cash */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Opening Petty Cash (Rs.):</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {pettyCashSource}
              </span>
            </label>
            <input
              type="number"
              value={dayOpenPettyCash || ''}
              onChange={(e) => setDayOpenPettyCash(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Cash In */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Cash In (Rs.):</span>
              <span className="text-[10px] text-slate-400 font-normal">Drawer change / extra cash</span>
            </label>
            <input
              type="number"
              value={dayOpenCashIn || ''}
              onChange={(e) => setDayOpenCashIn(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Cash Out (Optional) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Cash Out (Optional) (Rs.):</span>
              <span className="text-[10px] text-slate-400 font-normal">Initial withdrawal if any</span>
            </label>
            <input
              type="number"
              value={dayOpenCashOut || ''}
              onChange={(e) => setDayOpenCashOut(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Calculated Starting Balance Card */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Calculated Starting Drawer Float
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
              Rs. {((Number(dayOpenPettyCash) || 0) + (Number(dayOpenCashIn) || 0) - (Number(dayOpenCashOut) || 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Petty Cash (Rs. {Number(dayOpenPettyCash).toLocaleString()}) + Cash In (Rs. {Number(dayOpenCashIn).toLocaleString()}) - Cash Out (Rs. {Number(dayOpenCashOut).toLocaleString()})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsOpenShiftModal(false)}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleOpenShift}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm cursor-pointer hover:opacity-90 bg-emerald-600 hover:bg-emerald-700"
          >
            Open Day Register
          </button>
        </div>
      </div>
    </div>
  );
};
