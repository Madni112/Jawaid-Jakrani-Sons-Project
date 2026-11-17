import React from 'react';
import { MdAccountBalance, MdTrendingUp } from 'react-icons/md';
import { formatMoney } from '../utils/purchaseReturnReceiptHelpers';

interface ReturnSettlementCardProps {
  selectedVendor: string;
  selectedReturnNo: string;
  returnGrossBill: number;
  returnCreditAdjusted: number;
  returnPaidUpfront: number;
  returnPastReceiptsPaid: number;
  effectiveDueForThisReceipt: number;
  projectedRemaining: number;
  vendorTotalOutstandingReceivable: number;
}

export const ReturnSettlementCard: React.FC<ReturnSettlementCardProps> = ({
  selectedVendor,
  selectedReturnNo,
  returnGrossBill,
  returnCreditAdjusted,
  returnPaidUpfront,
  returnPastReceiptsPaid,
  effectiveDueForThisReceipt,
  projectedRemaining,
  vendorTotalOutstandingReceivable,
}) => {
  if (!selectedVendor) return null;

  return (
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

        {returnCreditAdjusted > 0 && (
          <div className="flex justify-between items-center text-purple-700 dark:text-purple-400 font-semibold">
            <span className="font-sans">Adjusted on Credit (Payables):</span>
            <span>- Rs. {formatMoney(returnCreditAdjusted)}</span>
          </div>
        )}

        {returnPaidUpfront > 0 && (
          <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
            <span className="font-sans">Refund Collected Upfront:</span>
            <span>- Rs. {formatMoney(returnPaidUpfront)}</span>
          </div>
        )}

        {returnPastReceiptsPaid > 0 && (
          <div className="flex justify-between items-center text-teal-700 dark:text-teal-400">
            <span className="font-sans">Past Voucher Collections:</span>
            <span>- Rs. {formatMoney(returnPastReceiptsPaid)}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-black">
          <span className="font-sans">Current Collectable Cash Balance:</span>
          <strong className="text-base">Rs. {formatMoney(effectiveDueForThisReceipt)}</strong>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
          <span className="font-sans">Projected Balance After This Voucher:</span>
          <strong className={`font-black ${projectedRemaining <= 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
            Rs. {formatMoney(Math.max(0, projectedRemaining))}
          </strong>
        </div>
      </div>

      {vendorTotalOutstandingReceivable > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <MdTrendingUp className="text-emerald-600" size={16} />
              <span className="text-[11px] font-bold">Total Vendor Return Debt:</span>
            </div>
            <strong className="font-mono font-black text-xs text-slate-900 dark:text-white">
              Rs. {formatMoney(vendorTotalOutstandingReceivable)}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
