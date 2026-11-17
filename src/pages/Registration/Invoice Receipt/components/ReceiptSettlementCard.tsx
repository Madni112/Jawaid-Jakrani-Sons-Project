import React from 'react';
import { MdAccountBalance } from 'react-icons/md';
import { formatMoney } from '../utils/invoiceReceiptHelpers';

interface ReceiptSettlementCardProps {
  selectedCustomer: string;
  selectedInvoiceNo: string;
  customerOpeningBalance?: number;
  invGrossBill: number;
  invPaidUpfront: number;
  invReturnsDeducted: number;
  invPastReceiptsPaid: number;
  effectiveDueForThisReceipt: number;
  currentTotalAmt: number;
}

export const ReceiptSettlementCard: React.FC<ReceiptSettlementCardProps> = ({
  selectedCustomer,
  selectedInvoiceNo,
  customerOpeningBalance = 0,
  invGrossBill,
  invPaidUpfront,
  invReturnsDeducted,
  invPastReceiptsPaid,
  effectiveDueForThisReceipt,
  currentTotalAmt
}) => {
  if (!selectedCustomer) return null;

  const projectedRemaining = Math.max(0, effectiveDueForThisReceipt - currentTotalAmt);
  const isOpeningBalanceSelected = selectedInvoiceNo === 'OPENING_BALANCE';
  const openBal = Number(customerOpeningBalance) || 0;
  const invoicesGrossOnly = Math.max(0, invGrossBill - openBal);

  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
          <MdAccountBalance className="text-primary" size={16} /> Receivable Settlement Breakdown
        </div>
        {isOpeningBalanceSelected ? (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-mono">
            OPENING BALANCE
          </span>
        ) : selectedInvoiceNo ? (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">
            {selectedInvoiceNo}
          </span>
        ) : (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            General Ledger
          </span>
        )}
      </div>

      <div className="space-y-2.5 font-mono text-xs">
        {isOpeningBalanceSelected ? (
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span className="font-sans flex items-center gap-1">
              Opening Balance:
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-sans font-bold">
                Credit Liability
              </span>
            </span>
            <strong className="text-slate-900 dark:text-white font-black text-sm">
              Rs. {formatMoney(openBal || invGrossBill)}
            </strong>
          </div>
        ) : (
          <>
            {openBal > 0 && !selectedInvoiceNo && (
              <div className="flex justify-between items-center text-amber-800 dark:text-amber-300">
                <span className="font-sans flex items-center gap-1">
                  Customer Opening Balance:
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-sans font-bold">
                    Initial Ledger
                  </span>
                </span>
                <strong className="text-slate-900 dark:text-white font-bold">
                  Rs. {formatMoney(openBal)}
                </strong>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span className="font-sans">
                {!selectedInvoiceNo && openBal > 0 ? 'Sales Invoices Billed:' : 'Gross Billed Total:'}
              </span>
              <strong className="text-slate-900 dark:text-white font-black text-sm">
                Rs. {formatMoney(!selectedInvoiceNo && openBal > 0 ? invoicesGrossOnly : invGrossBill)}
              </strong>
            </div>

            <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
              <span className="font-sans">Paid Upfront at Billing:</span>
              <span>Rs. {formatMoney(invPaidUpfront)}</span>
            </div>
          </>
        )}

        {invReturnsDeducted > 0 && (
          <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
            <span className="font-sans">Sales Returns Deducted:</span>
            <span>- Rs. {formatMoney(invReturnsDeducted)}</span>
          </div>
        )}

        {invPastReceiptsPaid > 0 && (
          <div className="flex justify-between items-center text-teal-700 dark:text-teal-400">
            <span className="font-sans">Past Voucher Collections:</span>
            <span>Rs. {formatMoney(invPastReceiptsPaid)}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-black">
          <span className="font-sans">Current Outstanding Due:</span>
          <strong className="text-base">Rs. {formatMoney(effectiveDueForThisReceipt)}</strong>
        </div>

        {/* Live Calculation */}
        <div className="pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex justify-between items-center text-slate-500 font-sans text-[11px]">
            <span>Collecting in this Voucher:</span>
            <strong className="font-mono text-primary font-bold">
              - Rs. {formatMoney(currentTotalAmt)}
            </strong>
          </div>

          <div className={`p-3 rounded-xl border flex justify-between items-center ${
            projectedRemaining <= 0
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-300'
          }`}>
            <div className="font-sans">
              <span className="block text-[10px] font-black uppercase tracking-wider">
                Balance After Collection:
              </span>
              <span className="text-[11px] font-medium">
                {projectedRemaining <= 0 ? 'Fully Cleared & Settled' : 'Remaining Customer Debt'}
              </span>
            </div>
            <strong className="font-mono font-black text-sm">
              Rs. {formatMoney(projectedRemaining)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
