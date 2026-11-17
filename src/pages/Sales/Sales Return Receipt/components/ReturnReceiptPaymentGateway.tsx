import React from 'react';
import { FiPrinter } from 'react-icons/fi';
import Spinner from '../../../../ui/Spinner';

interface ReturnReceiptPaymentGatewayProps {
  values: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  errors: any;
  touched: any;
  bankAccounts: any[];
  effectiveDueForThisReceipt: number;
  blockInvalidChar: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  formatMoney: (val: number | string | undefined | null) => string;
  loading: boolean;
  isEditMode: boolean;
  selectedCustomer: string;
  setShouldPrintAfterSave: (val: boolean) => void;
  handleSubmit: () => void;
  onCancel: () => void;
}

export const ReturnReceiptPaymentGateway: React.FC<ReturnReceiptPaymentGatewayProps> = ({
  values,
  handleChange,
  setFieldValue,
  errors,
  touched,
  bankAccounts,
  effectiveDueForThisReceipt,
  blockInvalidChar,
  formatMoney,
  loading,
  isEditMode,
  selectedCustomer,
  setShouldPrintAfterSave,
  handleSubmit,
  onCancel,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
            Disbursement Gateway: *
          </label>
          <select
            name="paymentMethod"
            onChange={(e) => {
              const val = e.target.value;
              setFieldValue('paymentMethod', val);
              if (val === 'Split') {
                setFieldValue('cashAmount', '');
                setFieldValue('bankAmount', '');
              } else if (val === 'Adjust Ledger') {
                setFieldValue('amount', 0);
              }
            }}
            value={values.paymentMethod}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs focus:border-emerald-600 cursor-pointer"
          >
            <option value="By Cash">💵 Cash Drawer / Vault</option>
            <option value="By Bank">🏦 Bank Wire / Online Transfer</option>
            <option value="Split">💳 Split Payment (Cash + Bank)</option>
            <option value="Adjust Ledger">📄 Adjust with Customer Ledger (Credit Khata)</option>
          </select>
        </div>

        {values.paymentMethod === 'Adjust Ledger' && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] font-medium text-purple-800 dark:text-purple-300">
            <span>📄 Customer Ledger Adjustment:</span>
            <span className="font-bold">Approved amount will credit customer ledger without cash/bank payout.</span>
          </div>
        )}

        {(values.paymentMethod === 'By Bank' || values.paymentMethod === 'Split') && (
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
              Disbursing Bank Account: *
            </label>
            <select
              name="selectedBankId"
              onChange={handleChange}
              value={values.selectedBankId}
              className={`w-full border rounded-xl p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none text-xs cursor-pointer ${
                touched.selectedBankId && errors.selectedBankId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600'
              }`}
            >
              <option value="">-- Choose Disbursing Bank --</option>
              {bankAccounts.map(b => (
                <option key={b.id} value={b.bankName}>
                  {b.bankName} - {b.accountTitle} ({b.accountNumber || '-'})
                </option>
              ))}
            </select>
            {values.selectedBankId && (
              <div className="mt-1 flex items-center justify-between text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 font-mono font-semibold">
                <span>🏦 Disbursing Bank Account:</span>
                <span>{values.selectedBankId}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cash Disbursing Account Indicator */}
      {(values.paymentMethod === 'By Cash' || values.paymentMethod === 'Split') && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
          <span>💵 Cash Disbursing Account:</span>
          <span className="font-mono font-bold">1010-001 - Cash in Hand</span>
        </div>
      )}

      {/* Amount Inputs (Single or Split) */}
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
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">
                Cash Portion (PKR):
              </label>
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
              <label className="block text-slate-500 font-bold text-[10px] uppercase mb-1">
                Bank Portion (PKR):
              </label>
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
            <span className="font-bold text-slate-600 dark:text-slate-400">Total Disbursed in this Voucher:</span>
            <strong className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
              Rs. {formatMoney(Number(values.cashAmount || 0) + Number(values.bankAmount || 0))}
            </strong>
          </div>

          {effectiveDueForThisReceipt > 0 && (
            <div className="flex flex-wrap items-center justify-between text-[11px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                💳 Paid to Customer: Rs. {formatMoney(Number(values.cashAmount || 0) + Number(values.bankAmount || 0))}
              </span>
              <span className="text-purple-700 dark:text-purple-300 font-bold">
                📄 Remainder to Ledger Debt: Rs. {formatMoney(Math.max(0, effectiveDueForThisReceipt - (Number(values.cashAmount || 0) + Number(values.bankAmount || 0))))}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
            <label className="block text-emerald-700 dark:text-emerald-400 font-black uppercase text-[11px]">
              {values.paymentMethod === 'Adjust Ledger' ? 'Customer Ledger Credit Amount (PKR): *' : 'Refund Payout Amount (PKR): *'}
            </label>
            {effectiveDueForThisReceipt > 0 && values.paymentMethod !== 'Adjust Ledger' && (
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setFieldValue('amount', effectiveDueForThisReceipt)}
                  className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-pointer transition"
                >
                  ⚡ Full Cash (Rs. {formatMoney(effectiveDueForThisReceipt)})
                </button>
                <button
                  type="button"
                  onClick={() => setFieldValue('amount', Math.round(effectiveDueForThisReceipt / 2))}
                  className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 cursor-pointer transition"
                >
                  ⚖️ 50% Cash (Rs. {formatMoney(Math.round(effectiveDueForThisReceipt / 2))})
                </button>
                <button
                  type="button"
                  onClick={() => setFieldValue('amount', 0)}
                  className="px-2 py-0.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 cursor-pointer transition"
                >
                  📄 100% Ledger (Rs. 0)
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
              Rs.
            </span>
            <input
              type="number"
              name="amount"
              placeholder="0"
              onKeyDown={blockInvalidChar}
              onChange={handleChange}
              value={values.amount}
              className={`w-full border rounded-xl py-3 pl-10 pr-4 bg-white dark:bg-slate-800 font-mono font-black text-slate-950 dark:text-white text-base outline-none ${
                touched.amount && errors.amount ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          {effectiveDueForThisReceipt > 0 && values.paymentMethod !== 'Adjust Ledger' && (
            <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                💵 Handing to Customer: Rs. {formatMoney(Number(values.amount) || 0)}
              </span>
              <span className="text-purple-700 dark:text-purple-300 font-bold">
                📄 Remainder to Ledger Debt: Rs. {formatMoney(Math.max(0, effectiveDueForThisReceipt - (Number(values.amount) || 0)))}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Transaction Remarks */}
      <div>
        <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
          Transaction Remarks / Payout Notes:
        </label>
        <textarea
          name="notes"
          rows={2}
          onChange={handleChange}
          value={values.notes}
          placeholder="Enter cheque #, online transaction reference, or customer refund clearing notes..."
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 outline-none text-slate-900 dark:text-white text-xs focus:border-emerald-600"
        />
      </div>

      {/* Submit / Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition text-xs cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => {
            setShouldPrintAfterSave(true);
            handleSubmit();
          }}
          disabled={loading || !selectedCustomer}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-6 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-1.5"
        >
          <FiPrinter size={15} />
          <span>Save & Print Voucher</span>
        </button>

        <button
          type="submit"
          onClick={() => setShouldPrintAfterSave(false)}
          disabled={loading || !selectedCustomer}
          className="rounded-xl bg-primary hover:bg-opacity-90 py-3 px-8 font-black text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
        >
          {loading ? <Spinner color="border-white" size="w-4 h-4" /> : <span>{isEditMode ? 'Update Voucher' : 'Post & Disburse Refund'}</span>}
        </button>
      </div>
    </div>
  );
};
