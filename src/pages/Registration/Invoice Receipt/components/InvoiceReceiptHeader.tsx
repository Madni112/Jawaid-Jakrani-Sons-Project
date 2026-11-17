import React from 'react';
import { MdOutlinePayment, MdArrowBack } from 'react-icons/md';

interface InvoiceReceiptHeaderProps {
  isEditMode: boolean;
  onBack: () => void;
}

export const InvoiceReceiptHeader: React.FC<InvoiceReceiptHeaderProps> = ({ isEditMode, onBack }) => {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <MdOutlinePayment className="text-primary" size={24} />
          {isEditMode ? 'Edit Customer Sales Invoice Receipt' : 'Log Customer Sales Invoice Receipt'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Collect cash, bank wire, or split payments from customers with automated FIFO invoice balancing
        </p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
      >
        <MdArrowBack size={16} /> Back to Receipts Log
      </button>
    </div>
  );
};
