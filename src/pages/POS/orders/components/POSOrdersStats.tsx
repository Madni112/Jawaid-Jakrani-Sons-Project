import React from 'react';
import { POSOrderStats } from '../types/posOrdersTypes';

interface POSOrdersStatsProps {
  stats: POSOrderStats;
  isReturnsOnly?: boolean;
}

export const POSOrdersStats: React.FC<POSOrdersStatsProps> = ({ stats, isReturnsOnly }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
          {isReturnsOnly ? 'Total Refunded Value' : 'Total POS Revenue'}
        </span>
        <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
          Rs. {stats.totalRev.toLocaleString()}
        </div>
        <span className="text-[11px] text-slate-400 mt-1 block">
          {stats.count} {isReturnsOnly ? 'refunded orders' : 'tickets completed'}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
          {isReturnsOnly ? 'Cash Refunded' : 'Cash Tenders'}
        </span>
        <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
          Rs. {stats.cashTotal.toLocaleString()}
        </div>
        <span className="text-[11px] text-slate-400 mt-1 block">
          {isReturnsOnly ? 'Drawer cash outflow' : 'Physical drawer cash'}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
          {isReturnsOnly ? 'Card / Digital Reversals' : 'Card (POS) Sales'}
        </span>
        <div className="text-xl font-black font-mono text-sky-600 dark:text-sky-400 mt-1">
          Rs. {stats.cardTotal.toLocaleString()}
        </div>
        <span className="text-[11px] text-slate-400 mt-1 block">
          {isReturnsOnly ? 'Electronic reversals' : 'Credit/Debit machine'}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
          {isReturnsOnly ? 'Average Refund Size' : 'Average Ticket Size'}
        </span>
        <div className="text-xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1">
          Rs. {stats.avgTicket.toLocaleString()}
        </div>
        <span className="text-[11px] text-slate-400 mt-1 block">
          {isReturnsOnly ? 'Per return claim' : 'Per counter receipt'}
        </span>
      </div>
    </div>
  );
};
