import React from 'react';
import { MdArrowBack, MdPeople } from 'react-icons/md';

interface CustomerHeaderBannerProps {
  isEditMode: boolean;
  customerName?: string;
  onNavigateToList: () => void;
}

export const CustomerHeaderBanner: React.FC<CustomerHeaderBannerProps> = ({
  isEditMode,
  customerName,
  onNavigateToList
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-sm">
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onNavigateToList}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer"
          title="Back to Customer List"
        >
          <MdArrowBack size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {isEditMode ? `Edit Profile: ${customerName || 'Customer'}` : 'Add New Customer'}
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isEditMode
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}
            >
              {isEditMode ? 'EDIT MODE' : 'NEW REGISTRATION'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enter customer commercial profile, contact information, and accounting ledger credentials
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={onNavigateToList}
          className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer"
        >
          <MdPeople size={16} />
          <span>Customer Directory</span>
        </button>
      </div>
    </div>
  );
};
