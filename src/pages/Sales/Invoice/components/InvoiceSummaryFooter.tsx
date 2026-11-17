import React from 'react';
import { toast } from 'react-hot-toast';
import { FiPrinter, FiCheck } from 'react-icons/fi';
import Spinner from '../../../../ui/Spinner';
import { SearchableDropdown } from '../../../../components/SearchableDropdown';

interface InvoiceSummaryFooterProps {
  values: any;
  errors: any;
  hasAttempted: boolean;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  netPayableBeforeFloor: number;
  grossSubtotalValue: number;
  currentSubtotalValue: number;
  returnTotalValue: number;
  tileReturnTotalValue: number;
  banksList: any[];
  blockInvalidChar: (e: React.KeyboardEvent<any>) => void;
  loading: boolean;
  isModalLoading: boolean;
  submitAction: string;
  setSubmitAction: (action: string) => void;
  setIsOpeningCustomerModal: (val: boolean) => void;
  submitForm: () => Promise<any>;
  navigate: (path: string) => void;
  tenantId: string;
  editData: any;
}

export const InvoiceSummaryFooter: React.FC<InvoiceSummaryFooterProps> = ({
  values,
  errors,
  hasAttempted,
  handleChange,
  setFieldValue,
  netPayableBeforeFloor,
  grossSubtotalValue,
  currentSubtotalValue,
  returnTotalValue,
  tileReturnTotalValue,
  banksList,
  blockInvalidChar,
  loading,
  isModalLoading,
  submitAction,
  setSubmitAction,
  setIsOpeningCustomerModal,
  submitForm,
  navigate,
  tenantId,
  editData,
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 border border-stroke p-4 rounded-sm bg-slate-50/10 mt-6 relative z-0">
        <div className="w-full md:w-1/2 space-y-4">
          {netPayableBeforeFloor < 0 ? (
            <div className="w-full p-4 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/30 dark:bg-teal-950/20 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-teal-200/60 dark:border-teal-800/60">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-2">
                    <span>🔄</span> Excess Return Balance
                  </span>
                  <p className="text-[11px] text-teal-700/80 dark:text-teal-400 font-medium mt-0.5">
                    Returns exceed the bill total. Amount owed to customer: 
                    <b className="font-mono font-black ml-1 text-teal-900 dark:text-teal-200">
                      Rs. {Math.abs(netPayableBeforeFloor).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </b>
                  </p>
                </div>
              </div>

              {/* Action Selector: Credit vs Refund */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-gray-600 dark:text-gray-300 block">
                  How would you like to settle this balance? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFieldValue('excessCreditAction', 'credit');
                      setFieldValue('excessRefundAmount', 0);
                    }}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer ${
                      values.excessCreditAction === 'credit'
                        ? 'border-teal-600 bg-white dark:bg-boxdark ring-2 ring-teal-500/30 shadow-sm'
                        : 'border-stroke dark:border-strokedark bg-white/50 dark:bg-boxdark/50 hover:border-teal-300 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-black text-black dark:text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${values.excessCreditAction === 'credit' ? 'bg-teal-600' : 'bg-gray-300'}`}></span>
                        Customer Credit
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                        Ledger / Balance
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                      Credit to customer's ledger account or adjust against previous debit balance.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFieldValue('excessCreditAction', 'refund');
                      setFieldValue('excessRefundAmount', Math.abs(netPayableBeforeFloor));
                    }}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer ${
                      values.excessCreditAction === 'refund'
                        ? 'border-amber-600 bg-white dark:bg-boxdark ring-2 ring-amber-500/30 shadow-sm'
                        : 'border-stroke dark:border-strokedark bg-white/50 dark:bg-boxdark/50 hover:border-amber-300 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-black text-black dark:text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${values.excessCreditAction === 'refund' ? 'bg-amber-600' : 'bg-gray-300'}`}></span>
                        Pay Cash / Bank Refund
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                        Immediate Payout
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                      Pay out refund amount to customer immediately in Cash or via Bank transfer.
                    </p>
                  </button>
                </div>
              </div>

              {/* If Refund selected, show Refund Method, Amount, and Bank if Bank */}
              {values.excessCreditAction === 'refund' && (
                <div className="p-3 rounded-lg bg-white dark:bg-boxdark border border-amber-200 dark:border-amber-800/60 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-black text-gray-600 dark:text-gray-300 block mb-1">
                        Refund Payment Method: *
                      </label>
                      <select
                        name="excessRefundMethod"
                        value={values.excessRefundMethod || 'Cash'}
                        onChange={handleChange}
                        className="w-full border border-stroke dark:border-strokedark rounded p-2 text-xs bg-transparent font-black outline-none text-black dark:text-white focus:border-amber-500"
                      >
                        <option value="Cash">Cash Payout</option>
                        <option value="Bank">Bank Wire Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-gray-600 dark:text-gray-300 block mb-1">
                        Refund Amount (PKR): *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={Math.abs(netPayableBeforeFloor)}
                        onKeyDown={blockInvalidChar}
                        name="excessRefundAmount"
                        value={values.excessRefundAmount === 0 ? '' : values.excessRefundAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          const num = val === '' ? 0 : Math.max(0, Number(val) || 0);
                          setFieldValue('excessRefundAmount', Math.min(Math.abs(netPayableBeforeFloor), num));
                        }}
                        placeholder={String(Math.abs(netPayableBeforeFloor))}
                        className="w-full border border-stroke dark:border-strokedark rounded p-2 text-xs bg-transparent font-mono font-black text-right outline-none text-amber-600 dark:text-amber-400 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {values.excessRefundMethod === 'Bank' && (
                    <div>
                      <label className="text-[11px] font-black text-gray-600 dark:text-gray-300 block mb-1">
                        Paying Bank Ledger Account: *
                      </label>
                      <SearchableDropdown
                        options={banksList.map(b => `${b.bankName} - ${b.accountTitle}`)}
                        value={
                          banksList.find(b => b.accountTitle === values.excessRefundBank)
                            ? `${banksList.find(b => b.accountTitle === values.excessRefundBank)!.bankName} - ${values.excessRefundBank}`
                            : (values.excessRefundBank || '')
                        }
                        onChange={(val) => {
                          const match = banksList.find(b => `${b.bankName} - ${b.accountTitle}` === val);
                          setFieldValue('excessRefundBank', match ? match.accountTitle : val);
                        }}
                        placeholder="-- Select Corporate Bank Account --"
                        className="border-stroke dark:border-strokedark focus:border-amber-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 text-gray-500 font-mono">
                    <span>Max Refund Limit:</span>
                    <span>Rs. {Math.abs(netPayableBeforeFloor).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
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
                    }
                  }}
                  className={`w-full border rounded p-2 text-xs bg-white dark:bg-boxdark font-black outline-none text-black dark:text-white ${hasAttempted && errors.settlementMode ? 'border-red-500 bg-red-50/10' : 'border-stroke dark:border-strokedark focus:border-primary'}`}
                >
                  <option value="Cash">Cash Only</option>
                  <option value="Bank">Bank Transfer Only</option>
                  <option value="Split">Cash & Bank Combined</option>
                </select>
                {hasAttempted && errors.settlementMode && <p className="text-red-500 text-[10px] font-bold mt-1">{String(errors.settlementMode)}</p>}
              </div>

              {/* Chart of Accounts Receiving Preview Notice */}
              {(values.settlementMode === 'Cash' || values.settlementMode === 'Split') && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                  <span>💵 Cash Receiving Account:</span>
                  <span className="font-mono font-bold">1010-001 - Cash in Hand</span>
                </div>
              )}

              {(values.settlementMode === 'Bank' || values.settlementMode === 'Split') && (
                <div>
                  <span className="font-bold text-gray-500 block mb-1">Receiving Corporate Bank Account: *</span>
                  <SearchableDropdown
                    options={banksList.map(b => `${b.bankName} - ${b.accountTitle}`)}
                    value={
                      banksList.find(b => b.accountTitle === values.selectedBankTitle)
                        ? `${banksList.find(b => b.accountTitle === values.selectedBankTitle)!.bankName} - ${values.selectedBankTitle}`
                        : values.selectedBankTitle
                    }
                    onChange={(val) => {
                      const match = banksList.find(b => `${b.bankName} - ${b.accountTitle}` === val);
                      handleChange({ target: { name: 'selectedBankTitle', value: match ? match.accountTitle : val } });
                    }}
                    placeholder="-- Select Receiving Bank Account --"
                    className={hasAttempted && errors.selectedBankTitle ? 'border-red-500 bg-red-50/10' : 'border-stroke dark:border-strokedark focus:border-primary'}
                  />
                  {hasAttempted && errors.selectedBankTitle && <p className="text-red-500 text-[10px] font-bold mt-1">{String(errors.selectedBankTitle)}</p>}
                  {values.selectedBankTitle && (
                    <div className="mt-1 flex items-center justify-between text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 font-mono font-semibold">
                      <span>🏦 Bank Chart of Account:</span>
                      <span>{values.selectedBankTitle}</span>
                    </div>
                  )}
                </div>
              )}

              {(() => {
                const totalPaidNow = values.settlementMode === 'Cash'
                  ? Number(values.cashAmountPaid || 0)
                  : (values.settlementMode === 'Bank' ? Number(values.bankAmountPaid || 0) : (Number(values.cashAmountPaid || 0) + Number(values.bankAmountPaid || 0)));
                const isOverpaid = netPayableBeforeFloor >= 0 && totalPaidNow > currentSubtotalValue + 0.01;

                return (
                  <div className="w-full space-y-2">
                    <div className={values.settlementMode === 'Split' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'w-full'}>
                      {(values.settlementMode === 'Cash' || values.settlementMode === 'Split') && (
                        <div>
                          <span className={`font-bold block mb-1 ${isOverpaid ? 'text-red-600 dark:text-red-400' : 'text-danger'}`}>
                            Cash Payment Amount (PKR): *
                          </span>
                          <input
                            type="number"
                            min="0"
                            onKeyDown={blockInvalidChar}
                            onWheel={(e: any) => e.target.blur()}
                            name="cashAmountPaid"
                            value={values.cashAmountPaid === 0 ? '' : values.cashAmountPaid}
                            onChange={(e) => {
                              const val = e.target.value;
                              const num = val === '' ? 0 : Math.max(0, Number(val) || 0);
                              setFieldValue('cashAmountPaid', num);
                            }}
                            placeholder="0"
                            className={`w-full rounded border p-2 bg-transparent text-right font-black text-sm outline-none ${
                              isOverpaid 
                                ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 ring-2 ring-red-400' 
                                : (hasAttempted && errors.cashAmountPaid ? 'border-red-500 bg-red-50/10 text-danger' : 'border-stroke dark:border-strokedark focus:border-primary text-black dark:text-white')
                            }`}
                          />
                          {hasAttempted && errors.cashAmountPaid && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.cashAmountPaid}</p>}
                        </div>
                      )}

                      {(values.settlementMode === 'Bank' || values.settlementMode === 'Split') && (
                        <div>
                          <span className={`font-bold block mb-1 ${isOverpaid ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>
                            Bank Payment Amount (PKR): *
                          </span>
                          <input
                            type="number"
                            min="0"
                            onKeyDown={blockInvalidChar}
                            onWheel={(e: any) => e.target.blur()}
                            name="bankAmountPaid"
                            value={values.bankAmountPaid === 0 ? '' : values.bankAmountPaid}
                            onChange={(e) => {
                              const val = e.target.value;
                              const num = val === '' ? 0 : Math.max(0, Number(val) || 0);
                              setFieldValue('bankAmountPaid', num);
                            }}
                            placeholder="0"
                            className={`w-full rounded border p-2 bg-transparent text-right font-black text-sm outline-none ${
                              isOverpaid 
                                ? 'border-2 border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 ring-2 ring-red-400' 
                                : (hasAttempted && errors.bankAmountPaid ? 'border-red-500 bg-red-50/10 text-primary' : 'border-stroke dark:border-strokedark focus:border-primary text-black dark:text-white')
                            }`}
                          />
                          {hasAttempted && errors.bankAmountPaid && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.bankAmountPaid}</p>}
                        </div>
                      )}
                    </div>

                    {isOverpaid && (
                      <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2 animate-pulse">
                        <span className="text-base">⚠️</span>
                        <span>
                          <strong>Payment Exceeds Total Bill:</strong> Entered Rs. {totalPaidNow.toLocaleString(undefined, { minimumFractionDigits: 2 })} on a bill of Rs. {currentSubtotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Please correct the amount before logging.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* FINANCIAL AUDIT SUMMARY CARD */}
        <div className="w-full md:w-1/3 space-y-2 font-mono font-bold text-xs text-black dark:text-white">
          <div className="flex justify-between border-b pb-1 dark:border-strokedark">
            <span>Net Invoice Value Total:</span>
            <span>Rs. {grossSubtotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {values.showOverallDiscount && (
            <div className="flex justify-between items-center border-b pb-1 dark:border-strokedark text-amber-600 dark:text-amber-400">
              <span className="text-xs">Overall Discount (PKR):</span>
              <input
                type="number"
                min="0"
                onKeyDown={blockInvalidChar}
                name="overallDiscount"
                value={values.overallDiscount === 0 ? '' : values.overallDiscount}
                onChange={(e) => {
                  const val = e.target.value;
                  setFieldValue('overallDiscount', val === '' ? 0 : Math.max(0, Number(val) || 0));
                }}
                placeholder="0.00"
                className="w-28 text-right font-black bg-amber-50/40 dark:bg-amber-900/10 border border-amber-300 dark:border-amber-700 rounded p-1 text-xs outline-none focus:border-amber-500 text-amber-700 dark:text-amber-300"
              />
            </div>
          )}

          {values.showOverallDiscount && (
            <div className="flex justify-between border-b pb-1 dark:border-strokedark text-green-600 dark:text-green-400 font-black">
              <span>Net Invoice Total (After Discount):</span>
              <span>Rs. {currentSubtotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {values.showAdditionalCharges && (
            <div className="flex justify-between items-center border-b pb-1 dark:border-strokedark text-blue-600 dark:text-blue-400">
              <span className="text-xs">Freight Charges:</span>
              <input
                type="number"
                min="0"
                onKeyDown={blockInvalidChar}
                name="additionalCharges"
                value={values.additionalCharges === 0 ? '' : values.additionalCharges}
                onChange={(e) => {
                  const val = e.target.value;
                  setFieldValue('additionalCharges', val === '' ? 0 : Math.max(0, Number(val) || 0));
                }}
                placeholder="0.00"
                className="w-28 text-right font-black bg-blue-50/40 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-700 rounded p-1 text-xs outline-none focus:border-blue-500 text-blue-700 dark:text-blue-300"
              />
            </div>
          )}

          {(values.showReturnSection || returnTotalValue > 0) && (
            <div className="flex justify-between border-b pb-1 dark:border-strokedark text-rose-600 dark:text-rose-400 font-bold">
              <span>Less Return Credit:</span>
              <span>- Rs. {returnTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {(values.showTileReturnSection || tileReturnTotalValue > 0) && (
            <div className="flex justify-between border-b pb-1 dark:border-strokedark text-amber-600 dark:text-amber-400 font-bold">
              <span>Less Tile Return Credit:</span>
              <span>- Rs. {tileReturnTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className={`flex justify-between border-b pb-1 dark:border-strokedark font-black ${netPayableBeforeFloor < 0 ? 'text-teal-600 dark:text-teal-400' : 'text-slate-900 dark:text-white'}`}>
            <span>{netPayableBeforeFloor < 0 ? 'Excess Customer Credit:' : 'Net Bill Payable:'}</span>
            <span>Rs. {Math.abs(netPayableBeforeFloor).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {(values.settlementMode === 'Cash' || values.settlementMode === 'Split') && (
            <div className="flex justify-between border-b pb-1 dark:border-strokedark text-emerald-600">
              <span>Received Cash Flow:</span>
              <span>Rs. {Number(values.cashAmountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {(values.settlementMode === 'Bank' || values.settlementMode === 'Split') && (
            <div className="flex justify-between border-b pb-1 dark:border-strokedark text-primary">
              <span>Received Bank Wire:</span>
              <span>Rs. {Number(values.bankAmountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {values.settlementMode === 'Split' && (
            <div className="flex justify-between border-b pb-1 dark:border-strokedark text-success font-black">
              <span>Total Paid (Cash + Bank):</span>
              <span>Rs. {(Number(values.cashAmountPaid || 0) + Number(values.bankAmountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          {(() => {
            const totalPaidNow = values.settlementMode === 'Cash'
              ? Number(values.cashAmountPaid || 0)
              : (values.settlementMode === 'Bank' ? Number(values.bankAmountPaid || 0) : (Number(values.cashAmountPaid || 0) + Number(values.bankAmountPaid || 0)));
            
            if (netPayableBeforeFloor < 0) {
              const refundAmt = values.excessCreditAction === 'refund' ? Number(values.excessRefundAmount || 0) : 0;
              const creditRetained = Math.max(0, Math.abs(netPayableBeforeFloor) - refundAmt);
              return (
                <div className="space-y-1.5 pt-1 border-double border-b-4 border-teal-500 dark:border-teal-400">
                  {values.excessCreditAction === 'refund' && refundAmt > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span className="font-sans text-[11px] font-bold">
                        Refund Paid ({values.excessRefundMethod || 'Cash'}):
                      </span>
                      <b className="text-sm font-mono font-black">
                        Rs. {refundAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </b>
                    </div>
                  )}
                  <div className="flex justify-between text-teal-700 dark:text-teal-300">
                    <span className="font-sans text-[11px] font-bold">
                      Customer Ledger Credit:
                    </span>
                    <b className="text-sm font-mono font-black">
                      Rs. {creditRetained.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </b>
                  </div>
                </div>
              );
            }

            const remBalance = Math.max(0, currentSubtotalValue - totalPaidNow);
            return (
              <div className="flex justify-between pt-1 border-double border-b-4 border-stroke dark:border-strokedark">
                <span className="font-sans text-[11px]">Un-invoiced Remaining Balance:</span>
                <span className="text-sm font-black text-black dark:text-white">
                  Rs. {remBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/sales/invoice/list`)}
          className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition shadow-sm text-xs cursor-pointer"
        >
          Cancel
        </button>

        {(() => {
          const totalPaidNow = values.settlementMode === 'Cash'
            ? Number(values.cashAmountPaid || 0)
            : (values.settlementMode === 'Bank' ? Number(values.bankAmountPaid || 0) : (Number(values.cashAmountPaid || 0) + Number(values.bankAmountPaid || 0)));
          const isOverpaid = netPayableBeforeFloor >= 0 && totalPaidNow > currentSubtotalValue + 0.01;

          return (
            <>
              <button
                type="button"
                onClick={() => {
                  if (isOverpaid) {
                    toast.error(`Payment (Rs. ${totalPaidNow.toLocaleString()}) cannot exceed bill total (Rs. ${currentSubtotalValue.toLocaleString()})!`);
                    return;
                  }
                  setSubmitAction('print');
                  setIsOpeningCustomerModal(true);
                  submitForm().finally(() => {
                    setTimeout(() => setIsOpeningCustomerModal(false), 1200);
                  });
                }}
                disabled={loading || isModalLoading || isOverpaid}
                className={`rounded-xl py-3 px-6 font-bold text-white transition shadow-md text-xs cursor-pointer flex items-center gap-2 ${
                  isOverpaid || isModalLoading ? 'bg-gray-400 cursor-not-allowed opacity-75' : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {isModalLoading && submitAction === 'print' ? (
                  <>
                    <Spinner color="border-white" size="w-4 h-4" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <FiPrinter size={15} /> <span>Save & Print</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isOverpaid) {
                    toast.error(`Payment (Rs. ${totalPaidNow.toLocaleString()}) cannot exceed bill total (Rs. ${currentSubtotalValue.toLocaleString()})!`);
                    return;
                  }
                  setSubmitAction('save');
                  setIsOpeningCustomerModal(true);
                  submitForm().finally(() => {
                    setTimeout(() => setIsOpeningCustomerModal(false), 1200);
                  });
                }}
                disabled={loading || isModalLoading || isOverpaid}
                className={`rounded-xl py-3 px-8 font-bold text-white transition shadow-md text-xs cursor-pointer flex items-center gap-2 ${
                  isOverpaid || isModalLoading ? 'bg-gray-400 cursor-not-allowed opacity-75' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isModalLoading && submitAction === 'save' ? (
                  <>
                    <Spinner color="border-white" size="w-4 h-4" />
                    <span>Validating...</span>
                  </>
                ) : loading ? (
                  <Spinner color="border-white" size="w-4 h-4" />
                ) : (
                  <>
                    <FiCheck size={15} /> <span>{editData ? 'Apply Updates' : 'Log Invoice'}</span>
                  </>
                )}
              </button>
            </>
          );
        })()}
      </div>
    </>
  );
};

export default InvoiceSummaryFooter;
