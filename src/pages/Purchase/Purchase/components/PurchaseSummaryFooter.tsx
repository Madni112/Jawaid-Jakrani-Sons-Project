import React from 'react';
import { FiPrinter, FiCheckCircle } from 'react-icons/fi';
import Spinner from '../../../../ui/Spinner';

interface PurchaseSummaryFooterProps {
  values: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  errors: any;
  hasAttempted: boolean;
  bankAccountsList: any[];
  totalBillAmount: number;
  tileTotalSum: number;
  totalPaid: number;
  remainingBalance: number;
  loading: boolean;
  isEditMode: boolean;
  navigate: (to: string) => void;
  tenantId?: string;
  setSubmitAction: (val: 'save' | 'print') => void;
  setHasAttempted: (val: boolean) => void;
  submitForm: () => Promise<any>;
  blockInvalidChar: (e: React.KeyboardEvent) => void;
}

export const PurchaseSummaryFooter: React.FC<PurchaseSummaryFooterProps> = ({
  values,
  handleChange,
  setFieldValue,
  errors,
  hasAttempted,
  bankAccountsList,
  totalBillAmount,
  tileTotalSum,
  totalPaid,
  remainingBalance,
  loading,
  isEditMode,
  navigate,
  tenantId,
  setSubmitAction,
  setHasAttempted,
  submitForm,
  blockInvalidChar,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start gap-6 border border-stroke dark:border-strokedark p-5 rounded-sm bg-slate-50/40 dark:bg-meta-4/5 mt-6">
      {/* Left: Payment Method Controls */}
      <div className="w-full md:w-1/2 space-y-4">
        <div>
          <span className="font-bold text-gray-500 block mb-1">Payment Method / Settlement Mode: *</span>
          <select
            name="settlementMode"
            value={values.settlementMode}
            onChange={(e) => {
              handleChange(e);
              if (e.target.value === 'Cash') {
                setFieldValue('selectedBankTitle', '');
                setFieldValue('bankAmountPaid', 0);
              } else if (e.target.value === 'Bank') {
                setFieldValue('cashAmountPaid', 0);
              }
            }}
            className="w-full border rounded border-stroke dark:border-strokedark p-2 text-xs bg-white dark:bg-boxdark font-black outline-none text-black dark:text-white focus:border-primary"
          >
            <option value="Cash">Cash Only</option>
            <option value="Bank">Bank Transfer Only</option>
            <option value="Split">Cash & Bank Combined (Split)</option>
          </select>
        </div>

        {/* Bank Selection Profile */}
        {(values.settlementMode === 'Bank' || values.settlementMode === 'Split') && (
          <div>
            <span className="font-bold text-gray-500 block mb-1">Corporate Source Vault Bank: *</span>
            <select
              name="selectedBankTitle"
              value={values.selectedBankTitle}
              onChange={handleChange}
              className={`w-full border rounded p-2 text-xs bg-white dark:bg-boxdark font-bold outline-none text-black dark:text-white ${
                hasAttempted && errors.selectedBankTitle
                  ? 'border-red-500 bg-red-50/10'
                  : 'border-stroke dark:border-strokedark focus:border-primary'
              }`}
            >
              <option value="">-- Choose Corporate Bank --</option>
              {bankAccountsList.map((b) => (
                <option key={b.id} value={b.bankName}>
                  {b.bankName} - {b.accountTitle} ({b.accountNumber || '-'})
                </option>
              ))}
            </select>
            {hasAttempted && errors.selectedBankTitle && (
              <p className="text-red-500 text-[10px] font-bold mt-1">{String(errors.selectedBankTitle)}</p>
            )}
          </div>
        )}

        {/* Amount Inputs */}
        <div className={values.settlementMode === 'Split' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'w-full'}>
          {(values.settlementMode === 'Cash' || values.settlementMode === 'Split') && (
            <div>
              <span className="font-bold text-rose-600 block mb-1">Cash Payment Amount (PKR):</span>
              <input
                type="number"
                min="0"
                onKeyDown={blockInvalidChar}
                name="cashAmountPaid"
                value={values.cashAmountPaid === 0 ? '' : values.cashAmountPaid}
                onChange={(e) => {
                  const val = e.target.value;
                  setFieldValue('cashAmountPaid', val === '' ? 0 : Math.max(0, Number(val) || 0));
                }}
                placeholder="0"
                className="w-full rounded border border-stroke dark:border-strokedark p-2 bg-white dark:bg-boxdark text-right font-black font-mono text-rose-600 text-sm outline-none focus:border-primary"
              />
            </div>
          )}

          {(values.settlementMode === 'Bank' || values.settlementMode === 'Split') && (
            <div>
              <span className="font-bold text-primary block mb-1">Bank Payment Amount (PKR):</span>
              <input
                type="number"
                min="0"
                onKeyDown={blockInvalidChar}
                name="bankAmountPaid"
                value={values.bankAmountPaid === 0 ? '' : values.bankAmountPaid}
                onChange={(e) => {
                  const val = e.target.value;
                  setFieldValue('bankAmountPaid', val === '' ? 0 : Math.max(0, Number(val) || 0));
                }}
                placeholder="0"
                className="w-full rounded border border-stroke dark:border-strokedark p-2 bg-white dark:bg-boxdark text-right font-black font-mono text-primary text-sm outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        <div>
          <span className="font-bold text-gray-500 block mb-1">Remarks:</span>
          <input
            type="text"
            name="remarks"
            value={values.remarks}
            onChange={handleChange}
            placeholder="e.g. Factory restock shipment, consignment bill #889"
            className="w-full border border-stroke dark:border-strokedark rounded p-2 text-xs bg-white dark:bg-boxdark outline-none focus:border-primary font-medium"
          />
        </div>
      </div>

      {/* Right: Net Summary & Action Buttons */}
      <div className="w-full md:w-1/2 flex flex-col justify-between self-stretch bg-white dark:bg-boxdark p-5 rounded-xl border border-stroke dark:border-strokedark shadow-xs">
        <div className="space-y-3 font-mono">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-sans font-bold">Total Bill Value:</span>
            <strong className="text-black dark:text-white font-black text-base">
              Rs. {totalBillAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>
          </div>

          {values.showTileSection && tileTotalSum > 0 && (
            <div className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-300">
              <span className="font-sans font-bold">Tile Purchases Total:</span>
              <strong className="font-mono font-bold">
                Rs. {tileTotalSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>
          )}

          {values.showAdditionalCharges && (
            <div className="flex justify-between items-center text-sm text-blue-600 dark:text-blue-400">
              <span className="font-sans font-bold text-xs">Freight Charges:</span>
              <input
                type="number"
                min="0"
                name="additionalCharges"
                value={values.additionalCharges}
                onChange={handleChange}
                placeholder="0.00"
                className="w-28 text-right font-black bg-blue-50/40 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-700 rounded p-1 text-xs outline-none focus:border-blue-500 text-blue-700 dark:text-blue-300"
              />
            </div>
          )}

          <div className="flex justify-between items-center text-sm text-emerald-600">
            <span className="font-sans font-bold">Paid Upfront:</span>
            <strong className="font-black text-base">
              Rs. {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>
          </div>

          <div className="flex justify-between items-center text-sm text-rose-600 pt-2 border-t border-stroke dark:border-strokedark">
            <span className="font-sans font-bold">Remaining Vendor Payable:</span>
            <strong className="font-black text-base">
              Rs. {remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>
          </div>

          {totalPaid > totalBillAmount + 0.01 && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700">
              <span className="text-[11px] font-black text-red-600 dark:text-red-400">
                ⚠ Overpayment of Rs. {(totalPaid - totalBillAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} — Cannot save!
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-4 border-t border-stroke dark:border-strokedark">
          <button
            type="button"
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Purchase/Purchases/List`)}
            className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition shadow-sm text-xs cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              setSubmitAction('print');
              setHasAttempted(true);
              submitForm();
            }}
            disabled={loading}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 py-3 px-6 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
          >
            <FiPrinter size={15} /> <span>Save & Print</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubmitAction('save');
              setHasAttempted(true);
              submitForm();
            }}
            disabled={loading}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-8 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
          >
            {loading ? (
              <Spinner color="border-white" size="w-4 h-4" />
            ) : (
              <>
                <FiCheckCircle size={15} /> <span>{isEditMode ? 'Update Purchase' : 'Save & Restock'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSummaryFooter;
