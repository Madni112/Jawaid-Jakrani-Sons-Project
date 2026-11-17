import React from 'react';
import {
  LuPlus,
  LuMinus,
  LuLock,
  LuAlertTriangle,
} from 'react-icons/lu';
import { PosShift, posService } from '../../../../service/posService';

interface ActiveShiftCardProps {
  activeShift: PosShift | null;
  setCashInOutType: (type: 'in' | 'out') => void;
  setIsCashInOutModal: (open: boolean) => void;
  setActualCountedCash: (amount: number) => void;
  setIsCloseShiftModal: (open: boolean) => void;
  setIsOpenShiftModal: (open: boolean) => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const ActiveShiftCard: React.FC<ActiveShiftCardProps> = ({
  activeShift,
  setCashInOutType,
  setIsCashInOutModal,
  setActualCountedCash,
  setIsCloseShiftModal,
  setIsOpenShiftModal,
  accentColor,
  contrastText,
  isAccentWhite,
}) => {
  if (!activeShift) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-2xl">
          <LuLock size={28} />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Register Shift Currently Open
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Start a shift with your initial cash drawer float to record transactions and enable cash reconciliation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpenShiftModal(true)}
          className="px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md cursor-pointer hover:opacity-90"
          style={{
            backgroundColor: accentColor,
            color: contrastText,
            border: isAccentWhite ? '1px solid #cbd5e1' : undefined
          }}
        >
          Start New Register Shift
        </button>
      </div>
    );
  }

  const stale = posService.getStaleShift();
  const isStale = Boolean(stale && stale.id === activeShift.id);

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
            #{activeShift.session_number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Current Active Shift
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                isStale ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`}>
                {isStale ? 'OVERDUE (FROM PREVIOUS DAY)' : 'OPEN'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Opened {new Date(activeShift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by <strong className="text-slate-700 dark:text-slate-300">{activeShift.cashier_name}</strong>
            </p>
          </div>
        </div>

        {/* Quick Shift Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCashInOutType('in');
              setIsCashInOutModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <LuPlus size={14} />
            <span>Cash In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCashInOutType('out');
              setIsCashInOutModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <LuMinus size={14} />
            <span>Cash Out</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActualCountedCash(activeShift.expected_cash);
              setIsCloseShiftModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <LuLock size={14} />
            <span>Close Shift (Z-Report)</span>
          </button>
        </div>
      </div>

      {isStale && stale && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LuAlertTriangle className="text-amber-500 shrink-0 text-lg" />
            <span>
              This shift belongs to a previous date (<strong>{posService.getShiftBusinessDate(stale)}</strong>) and was not closed. Please close this shift and generate the Z-Report so today's transactions remain accurate.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActualCountedCash(activeShift.expected_cash);
              setIsCloseShiftModal(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
          >
            Close Shift Now
          </button>
        </div>
      )}

      {/* Shift Financial Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-2">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Opening Float
          </span>
          <div className="text-base font-extrabold font-mono text-slate-800 dark:text-slate-200 mt-1">
            Rs. {activeShift.opening_float.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            Cash Sales
          </span>
          <div className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            Rs. {activeShift.cash_sales.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
            Card (POS) Sales
          </span>
          <div className="text-base font-extrabold font-mono text-sky-600 dark:text-sky-400 mt-1">
            Rs. {activeShift.card_sales.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
            Digital / QR Sales
          </span>
          <div className="text-base font-extrabold font-mono text-purple-600 dark:text-purple-400 mt-1">
            Rs. {activeShift.digital_sales.toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Cash Movement
          </span>
          <div className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 mt-1.5 flex items-center justify-between">
            <span className="text-emerald-500">+{activeShift.cash_in}</span>
            <span className="text-rose-500">-{activeShift.cash_out}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Expected in Drawer
          </span>
          <div className="text-base font-black font-mono text-amber-600 dark:text-amber-300 mt-1">
            Rs. {activeShift.expected_cash.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
