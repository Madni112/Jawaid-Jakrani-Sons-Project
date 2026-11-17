import React from 'react';
import { LuReceipt, LuRotateCcw, LuArrowLeft, LuFileSpreadsheet } from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';

interface POSOrdersHeaderProps {
  isReturnsOnly?: boolean;
  embedded?: boolean;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
  onBackClick: () => void;
  onExportExcel: () => void;
}

export const POSOrdersHeader: React.FC<POSOrdersHeaderProps> = ({
  isReturnsOnly,
  embedded,
  accentColor,
  contrastText,
  isAccentWhite,
  onBackClick,
  onExportExcel
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onBackClick}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          title="Return to POS Terminal"
        >
          <LuArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {isReturnsOnly ? <LuRotateCcw className="text-rose-500" /> : <LuReceipt className="text-sky-500" />}
            <span>{isReturnsOnly ? 'Returns & Refund Ledger' : 'POS Transactions & Thermal Receipts'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isReturnsOnly
              ? 'Audit history of refunded orders, returned items, and customer cash/card refunds.'
              : 'Review transaction logs, reprint thermal receipts, and process customer returns.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onExportExcel}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <LuFileSpreadsheet size={15} />
          <span>Export Excel</span>
        </button>

        <button
          type="button"
          onClick={onBackClick}
          className="px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90"
          style={{
            backgroundColor: accentColor,
            color: contrastText,
            border: isAccentWhite ? '1px solid #cbd5e1' : undefined
          }}
        >
          <MdPointOfSale size={16} />
          <span>{embedded ? 'Back to Cashier Register' : 'Launch POS Terminal'}</span>
        </button>
      </div>
    </div>
  );
};
