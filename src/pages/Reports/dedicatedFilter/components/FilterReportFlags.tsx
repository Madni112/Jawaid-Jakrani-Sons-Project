import React from 'react';
import { ReportConfig } from '../types/dedicatedFilterTypes';

interface FilterReportFlagsProps {
  reportId?: string;
  activeConfig: ReportConfig;
  criteria: any;
  handleInputChange: (field: string, value: any) => void;
}

export const FilterReportFlags: React.FC<FilterReportFlagsProps> = ({
  reportId,
  activeConfig,
  criteria,
  handleInputChange
}) => {
  const f = activeConfig.fields;
  const showPresentationModes =
    reportId === 'category-wise-sales' ||
    reportId === 'product-sales-history' ||
    reportId === 'trial-balance-statement' ||
    reportId === 'stock-activity-ledger';

  const showFinancialFlags =
    reportId === 'customer-ledger' ||
    reportId === 'customer-vendor-ledger' ||
    reportId === 'customer-balance-detail' ||
    reportId === 'vendor-balance-detail' ||
    reportId === 'trial-balance-statement' ||
    f.includes('customerCategory') ||
    reportId === 'vendor-balance-detail' ||
    (f.includes('supplier') && activeConfig.printType === 'account');

  return (
    <>
      {/* Presentation Modes & Zero Sales Flag */}
      {showPresentationModes && (
        <div className="md:col-span-2 flex flex-col gap-3 pt-3 pb-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Report Presentation Mode:
            </span>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleInputChange('viewMode', 'summary')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  (criteria.viewMode || 'summary') === 'summary'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                📊 Summary View{' '}
                {reportId === 'stock-activity-ledger'
                  ? '(Unified Ledger Matrix)'
                  : reportId === 'category-wise-sales'
                  ? '(Category Breakdown)'
                  : reportId === 'trial-balance-statement'
                  ? '(Main Ledger Heads)'
                  : '(1 Row / Product)'}
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('viewMode', 'detailed')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  criteria.viewMode === 'detailed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                📑 Detailed View{' '}
                {reportId === 'stock-activity-ledger'
                  ? '(Ranked Stock-In & Stock-Out)'
                  : reportId === 'trial-balance-statement'
                  ? '(Sub-Ledger Breakdown)'
                  : '(Invoice Breakdown)'}
              </button>
            </div>
          </div>
          {reportId !== 'trial-balance-statement' && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(criteria.showZeroSales)}
                onChange={(e) => handleInputChange('showZeroSales', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-stroke focus:ring-0 cursor-pointer accent-emerald-600"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {reportId === 'category-wise-sales'
                  ? 'Show Categories With Zero Sales (Display Full Category Tree)'
                  : reportId === 'stock-activity-ledger'
                  ? 'Show Products With Zero Movement / Stock (Display Full Inventory Catalog)'
                  : 'Show Products With Zero Sales (Display Full Inventory Catalog)'}
              </span>
            </label>
          )}
        </div>
      )}

      {/* Financial & Account Flags */}
      {showFinancialFlags && (
        <div className="md:col-span-2 flex flex-wrap items-center gap-6 pt-3 pb-1 border-t border-slate-100 dark:border-slate-800/80">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(criteria.showZeroValues)}
              onChange={(e) => handleInputChange('showZeroValues', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-stroke focus:ring-0 cursor-pointer accent-emerald-600"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {reportId === 'trial-balance-statement'
                ? 'Show Zero Values (Include Zero Debit / Credit Balance Heads)'
                : reportId === 'vendor-outstanding-report'
                ? 'Show Zero Values (Include Fully Paid Bills)'
                : reportId === 'vendor-balance-detail'
                ? 'Show Zero Values (Settled / Inactive Vendors)'
                : 'Show Zero Values (Settled Accounts)'}
            </span>
          </label>
          {reportId !== 'trial-balance-statement' && reportId !== 'vendor-outstanding-report' && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(criteria.showOnlyTransacted)}
                onChange={(e) => handleInputChange('showOnlyTransacted', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-stroke focus:ring-0 cursor-pointer accent-emerald-600"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {reportId === 'vendor-balance-detail' || f.includes('supplier')
                  ? 'Show Only Vendors With Transactions'
                  : 'Show Only Customers With Transactions'}
              </span>
            </label>
          )}
        </div>
      )}
    </>
  );
};

export default FilterReportFlags;
