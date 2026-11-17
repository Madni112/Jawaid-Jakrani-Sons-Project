import React from 'react';
import { formatMoney, blockInvalidChar } from '../utils/purchaseReturnReceiptHelpers';

interface ReturnPaymentMethodSectionProps {
  values: any;
  touched: any;
  errors: any;
  handleChange: any;
  setFieldValue: any;
  bankAccounts: any[];
  effectiveDueForThisReceipt: number;
}

export const ReturnPaymentMethodSection: React.FC<ReturnPaymentMethodSectionProps> = ({
  values,
  touched,
  errors,
  handleChange,
  setFieldValue,
  bankAccounts,
  effectiveDueForThisReceipt,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
            Collection Gateway: *
          </label>
          <select
            name="paymentMethod"
            onChange={(e) => {
              const val = e.target.value;
              setFieldValue('paymentMethod', val);
              if (val === 'Split') {
                setFieldValue('cashAmount', '');
                setFieldValue('bankAmount', '');
              }
            }}
            value={values.paymentMethod}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs focus:border-emerald-600 cursor-pointer"
          >
            <option value="By Cash">💵 Cash Drawer / Vault</option>
            <option value="By Bank">🏦 Bank Wire / Online Transfer</option>
            <option value="Split">💳 Split Payment (Cash + Bank)</option>
          </select>
        </div>

        {(values.paymentMethod === 'By Bank' || values.paymentMethod === 'Split') && (
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
              Receiving Bank Account: *
            </label>
            <select
              name="selectedBankId"
              onChange={handleChange}
              value={values.selectedBankId}
              className={`w-full border rounded-xl p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs cursor-pointer ${
                touched.selectedBankId && errors.selectedBankId
                  ? 'border-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600'
              }`}
            >
              <option value="">-- Choose Receiving Bank --</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.bankName}>
                  {b.bankName} - {b.accountTitle} ({b.accountNumber || '-'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Row: Amount Inputs (Single or Split) */}
      {values.paymentMethod === 'Split' ? (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-emerald-700 dark:text-emerald-400 font-black uppercase text-[11px]">
              Split Refund Breakdown (Cash + Bank): *
            </label>
            {effectiveDueForThisReceipt > 0 && (
              <button
                type="button"
                onClick={() => {
                  const half = Math.floor(effectiveDueForThisReceipt / 2);
                  setFieldValue('cashAmount', half);
                  setFieldValue('bankAmount', effectiveDueForThisReceipt - half);
                }}
                className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                ⚡ Split Full Due (50/50)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Cash Portion (PKR):</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Rs.</span>
                <input
                  type="number"
                  name="cashAmount"
                  placeholder="0"
                  onKeyDown={blockInvalidChar}
                  onChange={handleChange}
                  value={values.cashAmount}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-3 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">Bank Portion (PKR):</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Rs.</span>
                <input
                  type="number"
                  name="bankAmount"
                  placeholder="0"
                  onKeyDown={blockInvalidChar}
                  onChange={handleChange}
                  value={values.bankAmount}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-3 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-400">Total Collected in this Voucher:</span>
            <strong className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
              Rs. {formatMoney(Number(values.cashAmount || 0) + Number(values.bankAmount || 0))}
            </strong>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-emerald-700 dark:text-emerald-400 font-black uppercase text-[11px]">
              Collected Amount (PKR): *
            </label>
            {effectiveDueForThisReceipt > 0 && (
              <button
                type="button"
                onClick={() => setFieldValue('amount', effectiveDueForThisReceipt)}
                className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                ⚡ Collect Full Due (Rs. {formatMoney(effectiveDueForThisReceipt)})
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rs.</span>
            <input
              type="number"
              name="amount"
              placeholder="0"
              onKeyDown={blockInvalidChar}
              onChange={handleChange}
              value={values.amount}
              className={`w-full border rounded-xl py-3 pl-10 pr-4 bg-white dark:bg-slate-800 font-mono font-black text-slate-950 dark:text-white text-base outline-none ${
                touched.amount && errors.amount
                  ? 'border-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
