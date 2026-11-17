import React from 'react';

interface SalesHistoryHeaderProps {
  onAddNew: () => void;
}

export const SalesHistoryHeader: React.FC<SalesHistoryHeaderProps> = ({ onAddNew }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Sales Invoices History</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage customer billing records, print commercial vouchers & process returns
        </p>
      </div>
      <button
        onClick={onAddNew}
        className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm hover:shadow-md cursor-pointer"
      >
        <span>+ Add New Invoice</span>
      </button>
    </div>
  );
};
