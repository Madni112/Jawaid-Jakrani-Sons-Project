import React from 'react';
import { MdAccountBalance } from 'react-icons/md';
import { formatMoney } from '../utils/purchaseReceiptHelpers';

interface SettlementBreakdownCardProps {
  selectedPurchaseNo: string;
  vendorOpeningBalanceVoucherNo: string;
  vendorOpeningBalance: number;
  vendorPurchasesGrossTotal: number;
  poGrossBill: number;
  poPaidUpfront: number;
  poPastReceiptsPaid: number;
  effectiveDueForThisReceipt: number;
  vendorTotalOutstanding: number;
  currentTotalAmt: number;
}

export const SettlementBreakdownCard: React.FC<SettlementBreakdownCardProps> = ({
  selectedPurchaseNo,
  vendorOpeningBalanceVoucherNo,
  vendorOpeningBalance,
  vendorPurchasesGrossTotal,
  poGrossBill,
  poPaidUpfront,
  poPastReceiptsPaid,
  effectiveDueForThisReceipt,
  vendorTotalOutstanding,
  currentTotalAmt
}) => {
  const projectedRemaining = effectiveDueForThisReceipt - currentTotalAmt;

  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
          <MdAccountBalance className="text-emerald-600" size={16} /> Settlement Breakdown
        </div>
        {selectedPurchaseNo === 'OPENING_BALANCE' ? (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
            Opening Balance {vendorOpeningBalanceVoucherNo ? `(${vendorOpeningBalanceVoucherNo})` : ''}
          </span>
        ) : selectedPurchaseNo ? (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
            {selectedPurchaseNo}
          </span>
        ) : (
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            General Ledger
          </span>
        )}
      </div>

      <div className="space-y-2.5 font-mono text-xs">
        {selectedPurchaseNo === 'OPENING_BALANCE' ? (
          <>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span className="font-sans flex items-center gap-1">
                Opening Balance:
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-sans font-bold">
                  Credit Liability
                </span>
              </span>
              <strong className="text-slate-900 dark:text-white font-black text-sm">
                Rs. {formatMoney(vendorOpeningBalance)}
              </strong>
            </div>

            {poPastReceiptsPaid > 0 && (
              <div className="flex justify-between items-center text-teal-700 dark:text-teal-400">
                <span className="font-sans">Past Voucher Disbursements:</span>
                <span>Rs. {formatMoney(poPastReceiptsPaid)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-black">
              <span className="font-sans">Current Outstanding Due:</span>
              <strong className="text-base">Rs. {formatMoney(effectiveDueForThisReceipt)}</strong>
            </div>

            <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400 pt-1 flex justify-between border-t border-slate-100 dark:border-slate-800">
              <span>Vendor Overall Ledger Due:</span>
              <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                Rs. {formatMoney(vendorTotalOutstanding)}
              </strong>
            </div>
          </>
        ) : selectedPurchaseNo ? (
          <>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span className="font-sans">Gross Billed Total:</span>
              <strong className="text-slate-900 dark:text-white font-black text-sm">
                Rs. {formatMoney(poGrossBill)}
              </strong>
            </div>

            <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
              <span className="font-sans">Paid Upfront:</span>
              <span>Rs. {formatMoney(poPaidUpfront)}</span>
            </div>

            {poPastReceiptsPaid > 0 && (
              <div className="flex justify-between items-center text-teal-700 dark:text-teal-400">
                <span className="font-sans">Past Voucher Disbursements:</span>
                <span>Rs. {formatMoney(poPastReceiptsPaid)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-black">
              <span className="font-sans">Current Outstanding Due:</span>
              <strong className="text-base">Rs. {formatMoney(effectiveDueForThisReceipt)}</strong>
            </div>

            <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400 pt-1 flex justify-between border-t border-slate-100 dark:border-slate-800">
              <span>Vendor Overall Ledger Due:</span>
              <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                Rs. {formatMoney(vendorTotalOutstanding)}
              </strong>
            </div>
          </>
        ) : (
          <>
            {vendorOpeningBalance > 0 && (
              <div className="flex justify-between items-center text-amber-700 dark:text-amber-400">
                <span className="font-sans flex items-center gap-1">
                  Opening Balance:
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-sans font-bold">
                    Credit
                  </span>
                </span>
                <strong className="font-black text-xs">
                  Rs. {formatMoney(vendorOpeningBalance)}
                </strong>
              </div>
            )}

            {vendorPurchasesGrossTotal > 0 && (
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="font-sans">Purchase Orders Gross:</span>
                <span>Rs. {formatMoney(vendorPurchasesGrossTotal)}</span>
              </div>
            )}

            <div
              className={`flex justify-between items-center text-slate-600 dark:text-slate-400 ${
                vendorOpeningBalance > 0 ? 'pt-1 border-t border-slate-100 dark:border-slate-800' : ''
              }`}
            >
              <span className="font-sans font-bold">
                {vendorOpeningBalance > 0 ? 'Total Gross Liability:' : 'Gross Billed Total:'}
              </span>
              <strong className="text-slate-900 dark:text-white font-black text-sm">
                Rs. {formatMoney(poGrossBill)}
              </strong>
            </div>

            <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
              <span className="font-sans">Paid Upfront:</span>
              <span>Rs. {formatMoney(poPaidUpfront)}</span>
            </div>

            {poPastReceiptsPaid > 0 && (
              <div className="flex justify-between items-center text-teal-700 dark:text-teal-400">
                <span className="font-sans">Past Voucher Disbursements:</span>
                <span>Rs. {formatMoney(poPastReceiptsPaid)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-black">
              <span className="font-sans">Current Outstanding Due:</span>
              <strong className="text-base">Rs. {formatMoney(effectiveDueForThisReceipt)}</strong>
            </div>
          </>
        )}

        {/* Live Calculation */}
        <div className="pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex justify-between items-center text-slate-500 font-sans text-[11px]">
            <span>Paying in this Voucher:</span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              - Rs. {formatMoney(currentTotalAmt)}
            </strong>
          </div>

          <div
            className={`p-3 rounded-xl border flex justify-between items-center ${
              projectedRemaining <= 0
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-900 dark:text-amber-300'
            }`}
          >
            <div className="font-sans">
              <span className="block text-[10px] font-black uppercase tracking-wider">
                Balance After Payment:
              </span>
              <span className="text-[11px] font-medium">
                {projectedRemaining <= 0 ? 'Fully Cleared & Settled' : 'Remaining Payable Balance'}
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
