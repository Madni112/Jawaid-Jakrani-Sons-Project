import React from 'react';
import { FiPrinter, FiAlertTriangle } from 'react-icons/fi';
import Spinner from '../../../../ui/Spinner';

interface ReturnSummaryFooterProps {
  values: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  formatMoney: (val: number | string | undefined | null) => string;
  grossTotal: number;
  totalDiscount: number;
  taxAmt: number;
  totalReturnNet: number;
  currentLiquidRefund: number;
  netCreditLineDebt: number;
  loading: boolean;
  isEditMode: boolean;
  navigate: (to: string) => void;
  tenantId?: string;
  hasStockExceeded: boolean;
  negativeStockBlockedItems: string[];
  setShouldPrintAfterSave: (val: boolean) => void;
  handleSubmit: () => void;
  toast: any;
  hasBillExceeded?: boolean;
  exceededBillItems?: string[];
  selectedPoNo?: string;
}

export const ReturnSummaryFooter: React.FC<ReturnSummaryFooterProps> = ({
  values,
  handleChange,
  setFieldValue,
  formatMoney,
  grossTotal,
  totalDiscount,
  taxAmt,
  totalReturnNet,
  currentLiquidRefund,
  netCreditLineDebt,
  loading,
  isEditMode,
  navigate,
  tenantId,
  hasStockExceeded,
  negativeStockBlockedItems,
  setShouldPrintAfterSave,
  handleSubmit,
  toast,
  hasBillExceeded,
  exceededBillItems,
  selectedPoNo,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-stroke dark:border-strokedark">
      {/* Settlement Mode and Notes */}
      <div className="space-y-4">
        <div>
          <label className="block text-gray-500 dark:text-gray-400 font-bold mb-1 text-xs">
            Payment Method / Settlement Mode: *
          </label>
          <select
            name="paymentMethod"
            value={values.paymentMethod}
            onChange={(e) => {
              const val = e.target.value;
              setFieldValue('paymentMethod', val);
              if (val === 'Cash') {
                setFieldValue('refundAmount', totalReturnNet);
              } else if (val === 'On Credit') {
                setFieldValue('refundAmount', 0);
              }
            }}
            className="w-full rounded border border-stroke dark:border-strokedark p-2 bg-white dark:bg-boxdark font-semibold outline-none text-black dark:text-white text-xs focus:border-primary"
          >
            <option value="On Credit">On Credit (Deduct from Vendor Payable Ledger)</option>
            <option value="Cash">Cash Refund (Instant Inward Cash Collection)</option>
            <option value="Bank">Bank Refund (Account Deposit)</option>
            <option value="Split">Split (Partial Cash Refund + Balance to Credit Line)</option>
          </select>
        </div>

        {/* Dynamic Cash/Liquid Refund Input */}
        {(values.paymentMethod === 'Cash' || values.paymentMethod === 'Bank' || values.paymentMethod === 'Split') && (
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                {values.paymentMethod === 'Bank' ? 'Bank Deposit Received:' : 'Cash Collected from Vendor:'}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                Max Allowed: Rs. {formatMoney(totalReturnNet)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rs.</span>
                <input
                  type="number"
                  name="refundAmount"
                  min="0"
                  max={totalReturnNet}
                  value={values.refundAmount === 0 ? '' : values.refundAmount}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value;
                    const numVal = val === '' ? 0 : Math.min(totalReturnNet, Math.max(0, parseFloat(val) || 0));
                    setFieldValue('refundAmount', numVal);
                  }}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded border border-stroke dark:border-strokedark bg-white dark:bg-boxdark font-bold font-mono text-sm text-emerald-700 dark:text-emerald-400 outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setFieldValue('refundAmount', totalReturnNet)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition whitespace-nowrap"
              >
                Full Refund
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-gray-500 dark:text-gray-400 font-bold mb-1 text-xs">
            Purchase Return Memo / Remarks:
          </label>
          <textarea
            name="notes"
            rows={2}
            onChange={handleChange}
            value={values.notes}
            placeholder="Describe fault metrics, batch breakage, or debit credit arrangement..."
            className="w-full rounded border border-stroke dark:border-strokedark p-2 bg-transparent font-medium outline-none text-black dark:text-white text-xs focus:border-primary resize-none"
          />
        </div>
      </div>

      {/* Numerical Summary & Submissions */}
      <div className="flex flex-col justify-between">
        <div className="space-y-2 border-b border-stroke dark:border-strokedark pb-4">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Gross Inventory Return Value:</span>
            <span className="font-mono font-bold">Rs. {formatMoney(grossTotal)}</span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between items-center text-xs text-rose-500">
              <span>Item Discounts Deducted:</span>
              <span className="font-mono font-bold">- Rs. {formatMoney(totalDiscount)}</span>
            </div>
          )}

          {taxAmt > 0 && (
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Tax / Levy:</span>
              <span className="font-mono font-bold">+ Rs. {formatMoney(taxAmt)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-bold text-black dark:text-white pt-2 border-t border-stroke dark:border-strokedark">
            <span>Total Return Value:</span>
            <span className="font-mono text-base font-black text-rose-600 dark:text-rose-400">
              Rs. {formatMoney(totalReturnNet)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm text-success">
            <span className="font-sans font-medium">Refund Collected:</span>
            <strong className="font-bold">
              - Rs. {formatMoney(currentLiquidRefund)}
            </strong>
          </div>

          <div className="flex justify-between items-center text-sm text-primary pt-2 border-t border-stroke dark:border-strokedark">
            <span className="font-sans font-bold">Remaining Debit Note Credit Line:</span>
            <strong className="font-bold text-base">
              Rs. {formatMoney(netCreditLineDebt)}
            </strong>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6">
          {hasStockExceeded && (
            <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-lg flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs font-semibold shadow-xs">
              <FiAlertTriangle className="text-red-600 dark:text-red-400 shrink-0 text-xl" />
              <div className="flex flex-col">
                <span>
                  <strong>Saving Blocked:</strong> Return quantity exceeds available warehouse stock for: <strong>{negativeStockBlockedItems.join(', ')}</strong>.
                </span>
                <span className="text-[11px] font-normal text-red-600/90 dark:text-red-400/90 mt-0.5">
                  Negative stock is strictly disabled in Settings. Please reduce the return quantity to match or stay below available warehouse stock.
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchase-Return/List`)}
              className="rounded border border-stroke py-2.5 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (hasStockExceeded) {
                  toast.error(`Cannot save return: Quantity exceeds available stock for ${negativeStockBlockedItems.join(', ')}.`);
                  return;
                }
                setShouldPrintAfterSave(true);
                handleSubmit();
              }}
              disabled={loading || hasStockExceeded || hasBillExceeded}
              className={`rounded py-2.5 px-6 font-bold text-white transition shadow-md text-xs flex items-center gap-1.5 ${hasStockExceeded
                ? 'bg-rose-300 dark:bg-rose-950/40 cursor-not-allowed opacity-60'
                : 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
              }`}
            >
              <FiPrinter size={14} />
              <span>Save & Print</span>
            </button>
            <button
              type="submit"
              onClick={() => setShouldPrintAfterSave(false)}
              disabled={loading || hasStockExceeded || hasBillExceeded}
              className={`rounded py-2.5 px-8 font-bold text-white transition shadow-md text-xs flex items-center gap-2 ${hasStockExceeded
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-primary hover:bg-opacity-90 cursor-pointer'
              }`}
            >
              {loading ? <Spinner color="border-white" size="w-4 h-4" /> : <span>{isEditMode ? 'Update Return' : 'Save & Post Return'}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
