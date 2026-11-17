import React from 'react';
import { MdOutlinePayment, MdArrowBack } from 'react-icons/md';

interface ReturnReceiptHeaderProps {
  isEditMode: boolean;
  onBack: () => void;
}

export const ReturnReceiptHeader: React.FC<ReturnReceiptHeaderProps> = ({ isEditMode, onBack }) => {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <MdOutlinePayment className="text-emerald-600" size={24} />
          {isEditMode ? 'Edit Sales Return Cash-Back Settlement Voucher' : 'Log Sales Return Refund Payout Voucher'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Disburse customer cash/bank refund payouts on sales returns with automated FIFO receivable ledger balancing
        </p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
      >
        <MdArrowBack size={16} /> Back to Return Payouts
      </button>
    </div>
  );
};
