import React from 'react';
import { MdSearch, MdClear, MdTune } from 'react-icons/md';
import SearchableDropdown from '../../../../../components/SearchableDropdown';
import { calculateDatePreset, DatePreset } from '../utils/holdingHelpers';

interface HoldingFiltersSectionProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedSalesman: string;
  setSelectedSalesman: (s: string) => void;
  salesmenList: string[];
  selectedCustomer: string;
  setSelectedCustomer: (c: string) => void;
  customersList: string[];
  selectedGatepass: string;
  setSelectedGatepass: (gp: string) => void;
  gatepassesList: string[];
  selectedInvoice: string;
  setSelectedInvoice: (inv: string) => void;
  invoicesList: string[];
  holdingStatusFilter: 'holding_only' | 'all' | 'zero_holding';
  setHoldingStatusFilter: (status: 'holding_only' | 'all' | 'zero_holding') => void;
  minAmount: number | string;
  setMinAmount: (amt: number | string) => void;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'qty_desc';
  setSortBy: (sort: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'qty_desc') => void;
  dateFrom: string;
  setDateFrom: (d: string) => void;
  dateTo: string;
  setDateTo: (d: string) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean | ((prev: boolean) => boolean)) => void;
  activeFilterCount: number;
  onResetFilters: () => void;
}

export const HoldingFiltersSection: React.FC<HoldingFiltersSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedSalesman,
  setSelectedSalesman,
  salesmenList,
  selectedCustomer,
  setSelectedCustomer,
  customersList,
  selectedGatepass,
  setSelectedGatepass,
  gatepassesList,
  selectedInvoice,
  setSelectedInvoice,
  invoicesList,
  holdingStatusFilter,
  setHoldingStatusFilter,
  minAmount,
  setMinAmount,
  sortBy,
  setSortBy,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  showAdvancedFilters,
  setShowAdvancedFilters,
  activeFilterCount,
  onResetFilters
}) => {
  const handleQuickPreset = (preset: DatePreset) => {
    const range = calculateDatePreset(preset);
    setDateFrom(range.from);
    setDateTo(range.to);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm p-4 space-y-3">
      {/* ROW 1: PROMINENT SEARCH + PRIMARY SEARCHABLE DROPDOWNS + ADVANCED TOGGLE */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Main Search Input */}
        <div className="relative flex-1 w-full">
          <MdSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product item, SKU, customer name, salesman, GP #, or Invoice #..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 font-medium text-xs outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <MdClear size={16} />
            </button>
          )}
        </div>

        {/* Searchable Salesman Filter */}
        <SearchableDropdown
          className="w-full sm:w-48"
          placeholder="Salesman"
          options={salesmenList}
          value={selectedSalesman}
          onChange={setSelectedSalesman}
        />

        {/* Searchable Customer Filter */}
        <SearchableDropdown
          className="w-full sm:w-48"
          placeholder="Customer"
          options={customersList}
          value={selectedCustomer}
          onChange={setSelectedCustomer}
        />

        {/* Advanced Filters Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvancedFilters((prev) => !prev)}
          className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
            showAdvancedFilters || activeFilterCount > 0
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <MdTune size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Reset Filters Link */}
        {(activeFilterCount > 0 || searchQuery) && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-rose-500 hover:underline font-bold text-xs cursor-pointer shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      {/* EXPANDABLE ADVANCED FILTERS DRAWER */}
      {showAdvancedFilters && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/60 dark:bg-slate-800/30 p-3.5 rounded-xl">
          {/* Searchable Gatepass Filter */}
          <SearchableDropdown
            label="Gatepass / DC #:"
            placeholder="Gatepass"
            options={gatepassesList}
            value={selectedGatepass}
            onChange={setSelectedGatepass}
          />

          {/* Searchable Invoice Filter */}
          <SearchableDropdown
            label="Invoice No. Wise:"
            placeholder="Invoice"
            options={invoicesList}
            value={selectedInvoice}
            onChange={setSelectedInvoice}
          />

          {/* Holding Status Filter */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              Holding Status Filter:
            </label>
            <select
              value={holdingStatusFilter}
              onChange={(e: any) => setHoldingStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-bold text-xs text-amber-600 dark:text-amber-400 outline-none"
            >
              <option value="holding_only">Holding Only (Hold Qty &gt; 0)</option>
              <option value="all">All Rows (Including Dispatched)</option>
              <option value="zero_holding">Fully Dispatched (Zero Hold)</option>
            </select>
          </div>

          {/* Min Held Amount */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              Min Held Amount (Rs.):
            </label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-xs text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>

          {/* Date From */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              Date Bracket From:
            </label>
            <input
              type="date"
              max={todayStr}
              value={dateFrom}
              onChange={(e) => {
                if (e.target.value > todayStr) setDateFrom(todayStr);
                else setDateFrom(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-xs text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              Date Bracket To:
            </label>
            <input
              type="date"
              max={todayStr}
              value={dateTo}
              onChange={(e) => {
                if (e.target.value > todayStr) setDateTo(todayStr);
                else setDateTo(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-xs text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              Sort By Metric:
            </label>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-medium text-xs text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="amount_desc">Highest Holding Value (Rs.)</option>
              <option value="amount_asc">Lowest Holding Value (Rs.)</option>
              <option value="qty_desc">Highest Held Quantity</option>
              <option value="date_desc">Latest Date First</option>
              <option value="date_asc">Oldest Date First</option>
            </select>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-col justify-end">
            <label className="block font-bold text-slate-500 dark:text-slate-400 text-[11px] mb-1">
              Quick Date Presets:
            </label>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => handleQuickPreset('today')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 hover:border-emerald-500"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('yesterday')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 hover:border-emerald-500"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('this_week')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 hover:border-emerald-500"
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('this_month')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 hover:border-emerald-500"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('all_time')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 hover:border-emerald-500"
              >
                All Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
