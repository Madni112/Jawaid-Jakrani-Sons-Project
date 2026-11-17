import React from 'react';
import { LuStore, LuUsers, LuShieldCheck } from 'react-icons/lu';
import { PosTerminalCounter } from '../../../../service/posService';

interface TerminalSummaryStatsProps {
  terminals: PosTerminalCounter[];
  totalCashiers: number;
  onChangePasswordClick: () => void;
}

export const TerminalSummaryStats: React.FC<TerminalSummaryStatsProps> = ({
  terminals,
  totalCashiers,
  onChangePasswordClick
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
          <LuStore />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active POS Counters
          </span>
          <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
            {terminals.filter((t) => t.active).length} Counters
          </span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
          <LuUsers />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Assigned Cashiers
          </span>
          <span className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
            {totalCashiers} Staff Members
          </span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
            <LuShieldCheck />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Store Manager Override
            </span>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              Unified Across All Counters
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangePasswordClick}
          className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
        >
          Change
        </button>
      </div>
    </div>
  );
};
