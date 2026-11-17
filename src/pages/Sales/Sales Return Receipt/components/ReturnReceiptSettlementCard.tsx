import React from 'react';
import { MdPerson, MdInfoOutline, MdAccountBalance } from 'react-icons/md';

interface ReturnReceiptSettlementCardProps {
  selectedCustomer: string;
  selectedCustomerObj: any;
  selectedReturnNo: string;
  customerOpeningBalance?: number;
  customerInvoiceUnpaidDebt?: number;
  customerReceivableBalance?: number;
  returnGrossBill: number;
  returnCreditAdjusted: number;
  returnPaidUpfront: number;
  returnPastReceiptsPaid: number;
  effectiveDueForThisReceipt: number;
  currentTotalAmt: number;
  projectedRemaining: number;
  formatMoney: (val: number | string | undefined | null) => string;
}

export const ReturnReceiptSettlementCard: React.FC<ReturnReceiptSettlementCardProps> = ({
  selectedCustomer,
  selectedCustomerObj,
  selectedReturnNo,
  customerOpeningBalance = 0,
  customerInvoiceUnpaidDebt = 0,
  customerReceivableBalance = 0,
  returnGrossBill,
  returnCreditAdjusted,
  returnPaidUpfront,
  returnPastReceiptsPaid,
  effectiveDueForThisReceipt,
  currentTotalAmt,
  projectedRemaining,
  formatMoney,
}) => {
  const currentCustomerDebt = customerReceivableBalance;
  const newLedgerDebtOffsetFromThisVoucher = effectiveDueForThisReceipt > 0 ? Math.max(0, effectiveDueForThisReceipt - currentTotalAmt) : 0;
  const projectedCustomerDebtAfter = Math.max(0, currentCustomerDebt - newLedgerDebtOffsetFromThisVoucher);
  const totalPastCreditAdjusted = Math.max(0, (customerOpeningBalance + customerInvoiceUnpaidDebt) - currentCustomerDebt);

  return (
    <div className="lg:col-span-5 space-y-4">
      {/* 1. Customer Profile Card */}
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <MdPerson className="text-emerald-600" size={16} /> Customer Profile
        </div>

        {selectedCustomer ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Customer:</span>
              <strong className="text-slate-950 dark:text-white font-bold text-sm">{selectedCustomer}</strong>
            </div>
            {selectedCustomerObj?.contact_name && (
              <div className="flex justify-between">
                <span className="text-slate-500">Contact:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{selectedCustomerObj.contact_name}</span>
              </div>
            )}
            {(selectedCustomerObj?.cell_no || selectedCustomerObj?.phone_no || selectedCustomerObj?.phone) && (
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedCustomerObj.cell_no || selectedCustomerObj.phone_no || selectedCustomerObj.phone}</span>
              </div>
            )}
            {selectedCustomerObj?.address && (
              <div className="flex justify-between">
                <span className="text-slate-500">Address:</span>
                <span className="text-slate-700 dark:text-slate-300 text-right max-w-[60%]">{selectedCustomerObj.address}</span>
              </div>
            )}

            {/* Customer Financial Balances Breakdown */}
            <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Customer Opening / Old Balance:</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">
                  Rs. {formatMoney(customerOpeningBalance)}
                </strong>
              </div>
              {customerInvoiceUnpaidDebt > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Unpaid Sales Invoices:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    Rs. {formatMoney(customerInvoiceUnpaidDebt)}
                  </span>
                </div>
              )}
              {totalPastCreditAdjusted > 0 && (
                <div className="flex justify-between items-center text-xs text-purple-700 dark:text-purple-400 font-semibold">
                  <span>Less Past Returns Debt Offset:</span>
                  <span className="font-mono">
                    - Rs. {formatMoney(totalPastCreditAdjusted)}
                  </span>
                </div>
              )}
              {newLedgerDebtOffsetFromThisVoucher > 0 && (
                <div className="flex justify-between items-center text-xs text-purple-700 dark:text-purple-400 font-semibold">
                  <span>Less Deducted from Debt (This Return):</span>
                  <span className="font-mono">
                    - Rs. {formatMoney(newLedgerDebtOffsetFromThisVoucher)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-300 font-bold text-xs">Net Outstanding Customer Debt:</span>
                <strong className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                  Rs. {formatMoney(projectedCustomerDebtAfter)}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400">
            <MdInfoOutline className="mx-auto mb-1 text-slate-300" size={24} />
            <p className="text-xs">Type or search a customer on the left to inspect return history</p>
          </div>
        )}
      </div>

      {/* 2. Interactive Settlement & Balance Card */}
      {selectedCustomer && (
        <div className="bg-white dark:bg-boxdark rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <MdAccountBalance className="text-emerald-600" size={16} /> Settlement Breakdown
            </div>
            {selectedReturnNo ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                {selectedReturnNo}
              </span>
            ) : (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                General Ledger
              </span>
            )}
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span className="font-sans">Gross Return Total:</span>
              <strong className="text-slate-900 dark:text-white font-black text-sm">
                Rs. {formatMoney(returnGrossBill)}
              </strong>
            </div>

            {returnPaidUpfront > 0 && (
              <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                <span className="font-sans">Refund Disbursed Upfront:</span>
                <span>- Rs. {formatMoney(returnPaidUpfront)}</span>
              </div>
            )}

            {returnPastReceiptsPaid > 0 && (
              <div className="flex justify-between items-center text-teal-700 dark:text-teal-400">
                <span className="font-sans">Past Voucher Payouts:</span>
                <span>- Rs. {formatMoney(returnPastReceiptsPaid)}</span>
              </div>
            )}

            {returnCreditAdjusted > 0 && (
              <div className="flex justify-between items-center text-purple-700 dark:text-purple-400">
                <span className="font-sans">Past Ledger Adjustments:</span>
                <span>- Rs. {formatMoney(returnCreditAdjusted)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-black">
              <span className="font-sans">Total Available to Settle:</span>
              <strong className="text-base">Rs. {formatMoney(effectiveDueForThisReceipt)}</strong>
            </div>

            {/* Live Calculation */}
            <div className="pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between items-center text-slate-500 font-sans text-[11px]">
                <span>Cash / Bank Refund to Customer:</span>
                <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Rs. {formatMoney(currentTotalAmt)}
                </strong>
              </div>

              {newLedgerDebtOffsetFromThisVoucher > 0 && (
                <div className="flex justify-between items-center text-purple-700 dark:text-purple-400 font-sans text-[11px]">
                  <span>Adjusted to Customer Debt (Khata):</span>
                  <strong className="font-mono font-bold">
                    - Rs. {formatMoney(newLedgerDebtOffsetFromThisVoucher)}
                  </strong>
                </div>
              )}

              <div className="p-3 rounded-xl border flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-300">
                <div className="font-sans">
                  <span className="block text-[10px] font-black uppercase tracking-wider">
                    Settlement Status:
                  </span>
                  <span className="text-[11px] font-medium">
                    {effectiveDueForThisReceipt === 0 || currentTotalAmt + newLedgerDebtOffsetFromThisVoucher >= effectiveDueForThisReceipt
                      ? 'Return Voucher Fully Settled'
                      : 'Partially Settled'}
                  </span>
                </div>
                <strong className="font-mono font-black text-sm text-emerald-800 dark:text-emerald-200">
                  {effectiveDueForThisReceipt === 0
                    ? `Rs. ${formatMoney(returnGrossBill)} / Rs. ${formatMoney(returnGrossBill)}`
                    : `Rs. ${formatMoney(Math.min(effectiveDueForThisReceipt, currentTotalAmt + newLedgerDebtOffsetFromThisVoucher))} / Rs. ${formatMoney(effectiveDueForThisReceipt)}`}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
