import React from 'react';
import { ReportConfig } from '../types/dedicatedFilterTypes';

interface FilterDateSortSectionProps {
  activeConfig: ReportConfig;
  criteria: any;
  handleInputChange: (field: string, value: any) => void;
}

export const FilterDateSortSection: React.FC<FilterDateSortSectionProps> = ({
  activeConfig,
  criteria,
  handleInputChange
}) => {
  const isInventory = activeConfig.categoryName === 'Inventory & Warehouses';
  const isAccounts = activeConfig.categoryName === 'Accounts & Financials' || activeConfig.printType === 'loyalty' || activeConfig.hideDateFilter;

  return (
    <>
      {/* Sorting Selector & Optional Date Inputs */}
      <div
        className={`md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 ${
          activeConfig.hideDateFilter || activeConfig.singleDateFilter ? 'md:grid-cols-2' : 'md:grid-cols-3'
        } gap-4`}
      >
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
            Sort By:
          </label>
          <select
            value={criteria.sortBy}
            onChange={(e) => handleInputChange('sortBy', e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {isInventory ? (
              <>
                <option value="name_asc">Product Name (A to Z)</option>
                <option value="name_desc">Product Name (Z to A)</option>
                <option value="qty_desc">Stock Quantity (Highest First)</option>
                <option value="qty_asc">Stock Quantity (Lowest First)</option>
                <option value="amount_desc">Valuation Amount (Highest First)</option>
                <option value="amount_asc">Valuation Amount (Lowest First)</option>
              </>
            ) : isAccounts ? (
              <>
                <option value="amount_desc">Total Outstanding (Highest First)</option>
                <option value="amount_asc">Total Outstanding (Lowest First)</option>
                <option value="name_asc">Customer / Account Name (A to Z)</option>
                <option value="name_desc">Customer / Account Name (Z to A)</option>
              </>
            ) : activeConfig.singleDateFilter ? (
              <>
                <option value="date_asc">Entry Order / Time (Chronological)</option>
                <option value="amount_desc">Transaction Value (Highest First)</option>
                <option value="amount_asc">Transaction Value (Lowest First)</option>
                <option value="invoice_asc">Invoice No (Ascending A-Z)</option>
              </>
            ) : (
              <>
                <option value="date_desc">Date (Newest First)</option>
                <option value="date_asc">Date (Oldest First)</option>
                <option value="amount_desc">Gross Value (Highest First)</option>
                <option value="amount_asc">Gross Value (Lowest First)</option>
                <option value="invoice_asc">Invoice No (Ascending A-Z)</option>
              </>
            )}
          </select>
        </div>

        {/* Single Date Picker Mode (e.g. As Of Date or Daily Daybook) */}
        {activeConfig.singleDateFilter && (
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              {activeConfig.categoryName === 'Inventory & Warehouses'
                ? 'As Of / Cutoff Date:'
                : activeConfig.id === 'daybook-activity-report'
                  ? 'Daybook Audit Date:'
                  : 'As Of Date:'}
            </label>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={criteria.dateTo || criteria.dateFrom || new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                handleInputChange('dateFrom', e.target.value);
                handleInputChange('dateTo', e.target.value);
              }}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        )}

        {/* Range Date Picker Mode */}
        {!activeConfig.hideDateFilter && !activeConfig.singleDateFilter && (
          <>
            {/* Date From */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                From Date:
              </label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={criteria.dateFrom}
                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                To Date:
              </label>
              <input
                type="date"
                min={criteria.dateFrom}
                value={criteria.dateTo}
                onChange={(e) => handleInputChange('dateTo', e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
              />
            </div>
          </>
        )}
      </div>

      {/* Quick Date Presets for Single Date Mode */}
      {activeConfig.singleDateFilter && (
        <div className="md:col-span-2 flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Quick Daybook Select:</span>
          <button
            type="button"
            onClick={() => {
              const t = new Date().toISOString().split('T')[0];
              handleInputChange('dateFrom', t);
              handleInputChange('dateTo', t);
            }}
            className="py-1 px-2.5 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              const y = new Date();
              y.setDate(y.getDate() - 1);
              const ys = y.toISOString().split('T')[0];
              handleInputChange('dateFrom', ys);
              handleInputChange('dateTo', ys);
            }}
            className="py-1 px-2.5 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
          >
            Yesterday
          </button>
        </div>
      )}

      {/* Quick Date Presets for Range Mode */}
      {!activeConfig.hideDateFilter && !activeConfig.singleDateFilter && (
        <div className="md:col-span-2 flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Quick Date Window:</span>
          <button
            type="button"
            onClick={() => {
              const t = new Date().toISOString().split('T')[0];
              handleInputChange('dateFrom', t);
              handleInputChange('dateTo', t);
            }}
            className="py-1 px-2.5 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              const y = new Date();
              y.setDate(y.getDate() - 1);
              const ys = y.toISOString().split('T')[0];
              handleInputChange('dateFrom', ys);
              handleInputChange('dateTo', ys);
            }}
            className="py-1 px-2.5 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              const day = d.getDay();
              const diff = d.getDate() - day + (day === 0 ? -6 : 1);
              const s = new Date(d.setDate(diff)).toISOString().split('T')[0];
              handleInputChange('dateFrom', s);
              handleInputChange('dateTo', new Date().toISOString().split('T')[0]);
            }}
            className="py-1 px-2.5 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              const s = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
              handleInputChange('dateFrom', s);
              handleInputChange('dateTo', new Date().toISOString().split('T')[0]);
            }}
            className="py-1 px-2.5 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              const s = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0];
              const e = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0];
              handleInputChange('dateFrom', s);
              handleInputChange('dateTo', e);
            }}
            className="py-1 px-2.5 bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
          >
            Last Month
          </button>
        </div>
      )}
    </>
  );
};

export default FilterDateSortSection;
