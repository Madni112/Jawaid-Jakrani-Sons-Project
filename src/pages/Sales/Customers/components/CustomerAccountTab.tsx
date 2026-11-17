import React from 'react';
import { MdAccountBalance, MdTag, MdCalendarToday, MdCheckCircle } from 'react-icons/md';

interface CustomerAccountTabProps {
  values: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  suggestedCode: string;
}

export const CustomerAccountTab: React.FC<CustomerAccountTabProps> = ({
  values,
  handleChange,
  setFieldValue,
  suggestedCode
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm p-6 space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center gap-2 border-b border-stroke dark:border-strokedark pb-3">
        <span className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-lg">
          <MdAccountBalance size={18} />
        </span>
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            3. Account &amp; Ledger Configuration
          </h4>
          <p className="text-[11px] text-slate-500">
            Auto-linked Chart of Accounts code, physical page number, and opening balance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Customer / Account Code */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <MdTag size={14} className="text-primary" />
              <span>Customer / Account Code</span>
            </label>
            {suggestedCode && (values.customer_code || suggestedCode) !== suggestedCode && (
              <button
                type="button"
                onClick={() => setFieldValue('customer_code', suggestedCode)}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                Use Auto ({suggestedCode})
              </button>
            )}
          </div>
          <input
            type="text"
            name="customer_code"
            onChange={handleChange}
            value={
              values.customer_code !== undefined && values.customer_code !== ''
                ? values.customer_code
                : suggestedCode || ''
            }
            placeholder={suggestedCode || 'e.g. 2020-001'}
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs font-mono font-bold outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Auto-assigned sequentially starting from 2020-001 under Chart of Accounts Customers
          </p>
        </div>

        {/* Ledger Page # (Optional) */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            Ledger Page # (Optional)
          </label>
          <input
            type="text"
            name="page_no"
            onChange={handleChange}
            value={values.page_no || ''}
            placeholder="e.g. 142 or Pg-25"
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs font-mono outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Physical ledger book reference number for traditional paper accounting cross-checks
          </p>
        </div>

        {/* Opening Balance (PKR) */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <MdAccountBalance className="text-primary text-sm" />
              <span>Opening Balance (PKR)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Optional</span>
          </label>
          <input
            type="number"
            name="openingBalance"
            onChange={handleChange}
            value={values.openingBalance || ''}
            placeholder="0.00"
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs font-mono font-bold outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Initial balance owed by customer or advance held
          </p>
        </div>

        {/* Opening Balance Date */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <MdCalendarToday className="text-primary text-sm" />
              <span>Opening Balance Date</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Effective Date</span>
          </label>
          <input
            type="date"
            name="openingBalanceDate"
            onChange={handleChange}
            value={values.openingBalanceDate || ''}
            className="w-full rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-boxdark text-slate-900 dark:text-white px-4 py-2.5 text-xs font-mono outline-none transition focus:bg-white dark:focus:bg-boxdark focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Date assigned to Opening Balance journal voucher in ledger statements
          </p>
        </div>

        {/* Balance Nature */}
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            Balance Nature:
          </label>
          <div className="flex items-center gap-3 pt-0.5">
            <button
              type="button"
              onClick={() => setFieldValue('balanceNature', 'Debit')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                (values.balanceNature || 'Debit') === 'Debit'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-stroke dark:border-strokedark hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {(values.balanceNature || 'Debit') === 'Debit' && <MdCheckCircle size={14} />}
              <span>Debit (Dr - Receivable)</span>
            </button>

            <button
              type="button"
              onClick={() => setFieldValue('balanceNature', 'Credit')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                values.balanceNature === 'Credit'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-stroke dark:border-strokedark hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {values.balanceNature === 'Credit' && <MdCheckCircle size={14} />}
              <span>Credit (Cr - Advance)</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            {(values.balanceNature || 'Debit') === 'Debit'
              ? 'Customer owes this amount (Receivable)'
              : 'Customer paid advance / excess credit (Payable)'}
          </p>
        </div>
      </div>
    </div>
  );
};
