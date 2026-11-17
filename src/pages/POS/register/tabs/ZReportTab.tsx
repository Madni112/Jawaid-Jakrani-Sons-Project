import React from 'react';
import {
  LuClock,
  LuStore,
  LuChevronDown,
  LuSearch,
  LuCheck,
  LuCalendar,
  LuUser,
  LuReceipt,
  LuFileText,
} from 'react-icons/lu';
import { PosShift, PosTerminalCounter } from '../../../../service/posService';

interface ZReportTabProps {
  counterDropdownRef: React.RefObject<HTMLDivElement>;
  isCounterDropdownOpen: boolean;
  setIsCounterDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  counterSearchQuery: string;
  setCounterSearchQuery: (query: string) => void;
  selectedCounter: string;
  setSelectedCounter: (counter: string) => void;
  selectedCashierFilter: string;
  setSelectedCashierFilter: (cashier: string) => void;
  filteredTerminalsList: PosTerminalCounter[];
  dateFilter: string;
  setDateFilter: (filter: 'All' | 'Today' | 'Yesterday' | 'Last7Days' | 'Custom') => void;
  customDate: string;
  setCustomDate: (date: string) => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
  scopeTotalSales: number;
  scopeShiftsCount: number;
  cashierCards: Array<{
    cashierName: string;
    totalSales: number;
    shiftsCount: number;
    cashSales: number;
  }>;
  normCashierName: (name?: string) => string;
  dateStats: {
    count: number;
    totalVolume: number;
    cashSales: number;
    cardSales: number;
    digitalSales: number;
  };
  setIsMergedSlipOpen: (open: boolean) => void;
  filteredShifts: PosShift[];
  resolveTerminalName: (code?: string) => string;
  getShiftCashierBreakdown: (shift: PosShift) => any[];
  setSelectedZReport: (shift: PosShift) => void;
}

export const ZReportTab: React.FC<ZReportTabProps> = ({
  counterDropdownRef,
  isCounterDropdownOpen,
  setIsCounterDropdownOpen,
  counterSearchQuery,
  setCounterSearchQuery,
  selectedCounter,
  setSelectedCounter,
  selectedCashierFilter,
  setSelectedCashierFilter,
  filteredTerminalsList,
  dateFilter,
  setDateFilter,
  customDate,
  setCustomDate,
  accentColor,
  contrastText,
  isAccentWhite,
  scopeTotalSales,
  scopeShiftsCount,
  cashierCards,
  normCashierName,
  dateStats,
  setIsMergedSlipOpen,
  filteredShifts,
  resolveTerminalName,
  getShiftCashierBreakdown,
  setSelectedZReport,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] shadow-sm overflow-hidden">
      {/* Section Header with Date and Counter Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <LuClock className="text-primary" />
            <span>Shift Reconciliation & Daily Z-Report History</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Filter by date and counter to view register performance and reprint official daily close summaries.
          </p>
        </div>

        {/* Filter Controls: Searchable Counter Dropdown & Date Range */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Searchable Counter Dropdown */}
          <div className="relative" ref={counterDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsCounterDropdownOpen(prev => !prev);
                setCounterSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 transition cursor-pointer shadow-2xs"
              title="Select Counter"
            >
              <LuStore size={14} className="text-primary shrink-0" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">
                {selectedCounter === 'All' ? 'All Counters (Overall)' : selectedCounter}
              </span>
              <LuChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${isCounterDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Searchable Popover Menu */}
            {isCounterDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-64 rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl p-2 animate-fadeIn space-y-1.5"
                style={{ zIndex: 9999 }}
              >
                {/* Search Input */}
                <div className="relative">
                  <LuSearch size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    value={counterSearchQuery}
                    onChange={(e) => setCounterSearchQuery(e.target.value)}
                    placeholder="Search counter..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto space-y-0.5">
                  {/* All Counters option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCounter('All');
                      setSelectedCashierFilter('All');
                      setIsCounterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      selectedCounter === 'All'
                        ? 'bg-primary/10 text-primary font-black'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LuStore size={14} />
                      <span>All Counters (Store Overall)</span>
                    </div>
                    {selectedCounter === 'All' && <LuCheck size={14} className="text-primary shrink-0" />}
                  </button>

                  {/* Filtered Terminals */}
                  {filteredTerminalsList.map((t) => {
                    const isSelected = selectedCounter === t.name;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedCounter(t.name);
                          setSelectedCashierFilter('All');
                          setIsCounterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-black'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div>{t.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            /{t.slug} • {t.assigned_cashiers?.length || 0} cashiers
                          </div>
                        </div>
                        {isSelected && <LuCheck size={14} className="text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold">
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

          {/* Custom Date Picker */}
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
        </div>
      </div>

      {/* Cashier Performance Cards (Dynamically scoped to selected counter) */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c1017]/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <LuUser className="text-primary" size={14} />
            <span>
              {selectedCounter === 'All' ? 'All Cashiers Performance (Store-Wide)' : `Cashiers for ${selectedCounter}`}
            </span>
          </span>

          <span className="text-[10px] text-slate-400 font-medium">
            Click any cashier card to filter shifts below
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* All Staff / All Cashiers Card */}
          <button
            type="button"
            onClick={() => setSelectedCashierFilter('All')}
            className={`p-3.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
              selectedCashierFilter === 'All'
                ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary'
                : 'bg-white dark:bg-[#111622] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1">
                👥 All Cashiers
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                {selectedCounter === 'All' ? 'Overall' : 'Counter Total'}
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                Rs. {scopeTotalSales.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                {cashierCards.length} cashiers assigned • {scopeShiftsCount} {scopeShiftsCount === 1 ? 'shift' : 'shifts'}
              </div>
            </div>
          </button>

          {/* Individual Cashier Cards */}
          {cashierCards.map((c) => {
            const isSelected = normCashierName(selectedCashierFilter) === normCashierName(c.cashierName);
            const percent = scopeTotalSales > 0 ? ((c.totalSales / scopeTotalSales) * 100).toFixed(0) : '0';

            return (
              <button
                key={c.cashierName}
                type="button"
                onClick={() => setSelectedCashierFilter(c.cashierName)}
                className={`p-3.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary'
                    : 'bg-white dark:bg-[#111622] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate pr-2 capitalize">
                    👤 {c.cashierName}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                    c.totalSales > 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {percent}% Share
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                    Rs. {c.totalSales.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium flex items-center justify-between">
                    <span>{c.shiftsCount} {c.shiftsCount === 1 ? 'shift' : 'shifts'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Rs. {c.cashSales.toLocaleString()} cash
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Filter Summary KPI Strip */}
      <div className="bg-slate-50 dark:bg-[#0c1017] px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Filtered Sessions</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-sm">
              {dateStats.count} {dateStats.count === 1 ? 'Shift' : 'Shifts'}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Sales Volume</span>
            <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
              Rs. {dateStats.totalVolume.toLocaleString()}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-500 block tracking-wider">Cash Sales</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              Rs. {dateStats.cashSales.toLocaleString()}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-[10px] uppercase font-bold text-sky-500 block tracking-wider">Card / Digital</span>
            <span className="font-extrabold text-sky-600 dark:text-sky-400 font-mono text-sm">
              Rs. {(dateStats.cardSales + dateStats.digitalSales).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(dateFilter !== 'All' || selectedCounter !== 'All' || selectedCashierFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setDateFilter('All');
                setSelectedCounter('All');
                setSelectedCashierFilter('All');
              }}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMergedSlipOpen(true)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111622] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
            title="Print Merged Daily Slip (Counter & Cashier Breakdown)"
          >
            <LuReceipt size={14} className="text-primary" />
            <span>
              {selectedCashierFilter !== 'All'
                ? `Print Slip: ${selectedCashierFilter}`
                : 'Merged Daily Slip'}
            </span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Session #</th>
              <th className="py-3 px-4">Counter</th>
              <th className="py-3 px-4">Cashier</th>
              <th className="py-3 px-4">Time Span</th>
              <th className="py-3 px-4">Opening Float</th>
              <th className="py-3 px-4">Cash Sales</th>
              <th className="py-3 px-4">Total Shift Volume</th>
              <th className="py-3 px-4">Variance</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Z-Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {filteredShifts.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-slate-400">
                  <LuCalendar className="mx-auto text-2xl mb-2 opacity-40" />
                  <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No shift sessions found for this date.</p>
                  <p className="text-xs text-slate-400 mt-1">Try selecting another date or click "All Dates".</p>
                </td>
              </tr>
            ) : (
              filteredShifts.map((s) => {
                const totalVol = s.cash_sales + s.card_sales + s.digital_sales;
                const isClosed = s.status === 'Closed';

                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      #{s.session_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        <LuStore size={11} />
                        <span>{resolveTerminalName(s.terminal_code)}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {(() => {
                        const breakdown = getShiftCashierBreakdown(s);
                        if (breakdown.length <= 1) {
                          return (
                            <div>
                              <span className="capitalize">{breakdown[0]?.name || s.cashier_name}</span>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Rs. {(breakdown[0]?.total ?? totalVol).toLocaleString()}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="flex flex-col gap-1 py-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary/10">
                                {breakdown.length} Cashiers Active
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {breakdown.map((c: any) => (
                                <span
                                  key={c.name}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] border border-slate-200/80 dark:border-slate-700/60 font-medium"
                                  title={`${c.name}: Rs. ${c.total.toLocaleString()} (${c.ordersCount} sales)`}
                                >
                                  <span className="capitalize text-slate-700 dark:text-slate-200 font-bold">{c.name}:</span>
                                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    Rs. {c.total.toLocaleString()}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      <div>{new Date(s.opened_at).toLocaleDateString()}</div>
                      <div className="font-mono">
                        {new Date(s.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {s.closed_at ? new Date(s.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Open'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      Rs. {s.opening_float.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Rs. {s.cash_sales.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      Rs. {totalVol.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {s.variance !== undefined ? (
                        <span className={s.variance === 0 ? 'text-emerald-500' : s.variance > 0 ? 'text-blue-500' : 'text-rose-500'}>
                          {s.variance >= 0 ? `+${s.variance}` : s.variance}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isClosed ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isClosed ? (
                        <button
                          type="button"
                          onClick={() => setSelectedZReport(s)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <LuFileText size={13} />
                          <span>View Slip</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Active</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
