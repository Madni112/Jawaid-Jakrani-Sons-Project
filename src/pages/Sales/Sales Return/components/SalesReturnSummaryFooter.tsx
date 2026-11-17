import React from 'react';
import { MdOutlinePayment, MdAccountBalance } from 'react-icons/md';
import { FiPrinter } from 'react-icons/fi';
import Spinner from '../../../../ui/Spinner';

interface SalesReturnSummaryFooterProps {
  values: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  errors: any;
  touched: any;
  bankAccountsList: any[];
  netCashRefundDisbursed: number;
  exchangeInvoiceTotal: number;
  netReturnTotal: number;
  overallGrossTotal: number;
  tileTotalSum: number;
  totalDiscountDeducted: number;
  isExchangeReturn: boolean;
  loading: boolean;
  isEditMode: boolean;
  navigate: (to: string) => void;
  tenantId?: string;
  setShouldPrintAfterSave: (val: boolean) => void;
  handleSubmit: () => void;
  blockInvalidChar: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  formatMoney: (val: number) => string;
  selectedInvNo?: string;
  selectedInvObj?: any;
  hasBillExceeded?: boolean;
  exceededBillItems?: string[];
}

export const SalesReturnSummaryFooter: React.FC<SalesReturnSummaryFooterProps> = ({
  values,
  handleChange,
  setFieldValue,
  errors,
  touched,
  bankAccountsList,
  netCashRefundDisbursed,
  exchangeInvoiceTotal,
  netReturnTotal,
  overallGrossTotal,
  tileTotalSum,
  totalDiscountDeducted,
  isExchangeReturn,
  loading,
  isEditMode,
  navigate,
  tenantId,
  setShouldPrintAfterSave,
  handleSubmit,
  blockInvalidChar,
  formatMoney,
  selectedInvNo,
  selectedInvObj,
  hasBillExceeded,
  exceededBillItems,
}) => {
  return (
    <>
                {/* ── BOTTOM FINANCIAL AUDIT & SETTLEMENT CARDS (2 COLUMNS) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Settlement Gateway (7 Cols) */}
                  <div className="lg:col-span-7 bg-white dark:bg-boxdark rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                      <MdOutlinePayment className="text-emerald-600" size={16} /> Quality Check & Post-QC Settlement Notice
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/60 to-blue-50/60 dark:from-emerald-950/20 dark:to-blue-950/20 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                        <span>📦</span>
                        <span>Two-Stage Customer Return Verification Protocol:</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        1. <strong>Stock Recording:</strong> Saving this Return Note registers incoming goods into the warehouse receiving queue (<code className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-mono text-[10px]">Pending Inward</code>).
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        2. <strong>Warehouse QC:</strong> The warehouse team inspects the stock, confirming <strong>Accepted</strong>, <strong>On Hold</strong>, or <strong>Rejected</strong> quantities.
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        3. <strong>Settlement & Disbursement:</strong> Financial reimbursement (Cash payout, Bank transfer, Split, or Ledger credit) is processed via <strong>Sales Return Receipt</strong> based on verified accepted goods.
                      </p>
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] mb-1">
                        Return Reason / Notes:
                      </label>
                      <textarea
                        name="remarks"
                        rows={2}
                        onChange={handleChange}
                        value={values.remarks}
                        placeholder="Enter return reason, damaged box details, or reference notes..."
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Right Column: Live Settlement Summary (5 Cols) */}
                  <div className="lg:col-span-5 bg-white dark:bg-boxdark rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-3.5">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MdAccountBalance className="text-emerald-600" size={16} /> 2. Return Audit Profile
                      </span>
                      {selectedInvNo ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {selectedInvNo}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          FIFO All Invoices
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 font-mono text-xs">
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span className="font-sans">Total Return Line Items:</span>
                        <strong className="text-slate-900 dark:text-white font-bold">{values.items.length} Items</strong>
                      </div>

                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span className="font-sans">Gross Return Items Value:</span>
                        <strong className="text-slate-900 dark:text-white font-black text-sm">
                          Rs. {formatMoney(overallGrossTotal)}
                        </strong>
                      </div>

                      {values.showTileSection && tileTotalSum > 0 && (
                        <div className="flex justify-between items-center text-amber-700 dark:text-amber-400">
                          <span className="font-sans font-bold">Tile Returns Total:</span>
                          <strong className="font-mono font-bold">Rs. {formatMoney(tileTotalSum)}</strong>
                        </div>
                      )}

                      {totalDiscountDeducted > 0 && (
                        <div className="flex justify-between items-center text-rose-500 dark:text-rose-400 mt-2">
                          <span className="font-sans">Total Discount Deducted:</span>
                          <strong className="text-rose-600 dark:text-rose-400 font-black text-sm">
                            - Rs. {formatMoney(totalDiscountDeducted)}
                          </strong>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-slate-800 dark:text-slate-200 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="font-sans font-bold">Net Return Value:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-black text-lg">
                          Rs. {formatMoney(netReturnTotal)}
                        </strong>
                      </div>

                      {isExchangeReturn && selectedInvObj ? (
                        <>
                          <div className="flex justify-between items-center text-purple-700 dark:text-purple-400 font-semibold">
                            <span className="font-sans">Exchanged Items on Invoice:</span>
                            <span>- Rs. {formatMoney(exchangeInvoiceTotal)}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                            <span className="font-sans">Cash Refund Paid to Customer:</span>
                            <span>- Rs. {formatMoney(Number(values.cashAmountPaid || values.amountPaid || netCashRefundDisbursed))}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700 text-emerald-800 dark:text-emerald-300 font-black">
                            <span className="font-sans">Remaining Customer Balance:</span>
                            <strong className="text-base">Rs. 0.00</strong>
                          </div>
                        </>
                      ) : (
                        <>
                          {values.paymentTerm !== 'On Credit' && (
                            <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                              <span className="font-sans">Upfront Refund Disbursed:</span>
                              <span>- Rs. {formatMoney(values.paymentTerm === 'Split' ? (Number(values.cashAmountPaid || 0) + Number(values.bankAmountPaid || 0)) : (Number(values.amountPaid) || 0))}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700 text-emerald-800 dark:text-emerald-300 font-black">
                            <span className="font-sans">
                              {values.paymentTerm === 'On Credit' ? 'Credit Balance to Invoices:' : 'Remaining Customer Balance:'}
                            </span>
                            <strong className="text-base">
                              Rs. {formatMoney(values.paymentTerm === 'On Credit' ? netReturnTotal : Math.max(0, netReturnTotal - (values.paymentTerm === 'Split' ? (Number(values.cashAmountPaid || 0) + Number(values.bankAmountPaid || 0)) : (Number(values.amountPaid) || 0))))}
                            </strong>
                          </div>
                        </>
                      )}

                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] font-sans text-emerald-900 dark:text-emerald-300">
                        <strong>FIFO Auto-Deduction Active:</strong> Returned quantities will deduct chronologically starting from the oldest invoice issued to <strong>{values.customerName || 'the customer'}</strong>.
                      </div>
                    </div>
                  </div>

                </div>

                
                {hasBillExceeded && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 font-bold flex items-center gap-2 shadow-xs">
                    <span className="text-base">⚠️</span>
                    <span>
                      Cannot save: Return quantity exceeds {selectedInvNo ? `Invoice #${selectedInvNo}` : 'total purchased'} quantity for: <strong>{[...new Set(exceededBillItems || [])].join(', ')}</strong>. Please adjust return quantities before saving.
                    </span>
                  </div>
                )}

                {/* ── ACTION BUTTONS FOOTER ── */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/Sales-Return/Debit-Notes/List`)}
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
                    disabled={loading || !values.customerName || hasBillExceeded}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-6 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <FiPrinter size={15} />
                    <span>Save & Print Credit Note</span>
                  </button>

                  <button
                    type="submit"
                    onClick={() => setShouldPrintAfterSave(false)}
                    disabled={loading || !values.customerName || hasBillExceeded}
                    className="rounded-xl bg-primary hover:bg-opacity-90 py-3 px-8 font-black text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
                  >
                    {loading ? <Spinner color="border-white" size="w-4 h-4" /> : <span>{isEditMode ? 'Update Credit Note' : 'Post & Authorize Return'}</span>}
                  </button>
                </div>

    </>
  );
};

export default SalesReturnSummaryFooter;
