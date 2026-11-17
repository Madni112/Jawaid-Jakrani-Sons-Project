import React from 'react';
import { LuSearch, LuCalendar } from 'react-icons/lu';
import { DateFilterMode } from '../types/posOrdersTypes';

interface POSOrdersFilterProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  dateFilter: DateFilterMode;
  setDateFilter: (mode: DateFilterMode) => void;
  customDate: string;
  setCustomDate: (date: string) => void;
  methodFilter: string;
  setMethodFilter: (method: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  isReturnsOnly?: boolean;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
}

export const POSOrdersFilter: React.FC<POSOrdersFilterProps> = ({
  searchQuery,
  setSearchQuery,
  dateFilter,
  setDateFilter,
  customDate,
  setCustomDate,
  methodFilter,
  setMethodFilter,
  statusFilter,
  setStatusFilter,
  isReturnsOnly,
  accentColor,
  contrastText,
  isAccentWhite
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="relative w-full md:w-80">
        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ticket #, customer, cashier..."
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        {/* Date Presets */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold">
          {(['All', 'Today', 'Yesterday', 'Last7Days'] as const).map((mode) => {
            const label = mode === 'All' ? 'All Dates' : mode === 'Last7Days' ? '7 Days' : mode;
            const isSelected = dateFilter === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setDateFilter(mode)}
                className={`px-2 py-1 rounded-lg transition cursor-pointer text-[11px] ${
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

        {/* Custom Date Input */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
          <LuCalendar size={13} className="text-slate-400 shrink-0" />
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

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="All">All Tender Types</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Digital">Digital / QR</option>
          <option value="Split">Split</option>
        </select>

        {isReturnsOnly ? (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Return Types</option>
            <option value="Refunded">Fully Refunded</option>
            <option value="Partially Refunded">Partially Refunded</option>
          </select>
        ) : (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Refunded">Refunded</option>
            <option value="Partially Refunded">Partially Refunded</option>
          </select>
        )}
      </div>
    </div>
  );
};
