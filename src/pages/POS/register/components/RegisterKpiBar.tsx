import React from 'react';
import { LuFilter, LuCalendar } from 'react-icons/lu';
import { PosOrder } from '../../../../service/posService';

interface RegisterKpiBarProps {
  dateFilter: string;
  setDateFilter: (filter: 'All' | 'Today' | 'Yesterday' | 'Last7Days' | 'Custom') => void;
  customDate: string;
  setCustomDate: (date: string) => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
  categoryStats: {
    totalRevenue: number;
    totalPieces: number;
    list: Array<{ category: string }>;
  };
  dateStats: {
    totalVolume: number;
    cashSales: number;
  };
  filteredOrders: PosOrder[];
  paymentStats: {
    cash: { total: number };
  };
}

export const RegisterKpiBar: React.FC<RegisterKpiBarProps> = ({
  dateFilter,
  setDateFilter,
  customDate,
  setCustomDate,
  accentColor,
  contrastText,
  isAccentWhite,
  categoryStats,
  dateStats,
  filteredOrders,
  paymentStats,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <LuFilter className="text-primary" size={16} />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Filter Reporting Period:
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold ml-2">
            {(['All', 'Today', 'Yesterday', 'Last7Days'] as const).map((mode) => {
              const label = mode === 'All' ? 'All Dates' : mode === 'Last7Days' ? '7 Days' : mode;
              const isSelected = dateFilter === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDateFilter(mode)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                    isSelected
                      ? 'shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: accentColor,
                          color: contrastText,
                          border: isAccentWhite ? '1px solid #cbd5e1' : undefined
                        }
                      : undefined
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Picker */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
          <LuCalendar size={14} className="text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium">Custom:</span>
          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setDateFilter('Custom');
            }}
            className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Global KPI Strip */}
      <div className="bg-slate-50 dark:bg-[#0c1017] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Gross Sales Revenue</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-base">
              Rs. {categoryStats.totalRevenue > 0 ? categoryStats.totalRevenue.toLocaleString() : dateStats.totalVolume.toLocaleString()}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Suits / Items Sold</span>
            <span className="font-extrabold text-slate-900 dark:text-white font-mono text-base">
              {categoryStats.totalPieces > 0 ? categoryStats.totalPieces : filteredOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0)} Pieces
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cash Collected</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-base">
              Rs. {paymentStats.cash.total > 0 ? paymentStats.cash.total.toLocaleString() : dateStats.cashSales.toLocaleString()}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Top Category</span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
              {categoryStats.list[0]?.category || 'Cloth Collection'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
