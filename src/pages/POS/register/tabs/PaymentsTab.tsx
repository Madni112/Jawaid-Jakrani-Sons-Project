import React from 'react';
import { LuBanknote, LuCreditCard, LuQrCode } from 'react-icons/lu';

interface PaymentsTabProps {
  paymentStats: {
    cash: { total: number; count: number; share: string | number };
    card: { total: number; count: number; share: string | number };
    digital: { total: number; count: number; share: string | number };
  };
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ paymentStats }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cash Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <LuBanknote size={18} />
              <span>Cash Payments</span>
            </span>
            <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-emerald-500 text-white">
              {paymentStats.cash.share}%
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            Rs. {paymentStats.cash.total.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {paymentStats.cash.count} transaction(s) recorded in cash drawer
          </div>
        </div>

        {/* Card Card */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-50/20 dark:bg-sky-950/10 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-2">
              <LuCreditCard size={18} />
              <span>Debit / Credit Cards</span>
            </span>
            <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-sky-500 text-white">
              {paymentStats.card.share}%
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            Rs. {paymentStats.card.total.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {paymentStats.card.count} transaction(s) settled via card POS machine
          </div>
        </div>

        {/* Digital / QR Card */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-50/20 dark:bg-purple-950/10 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <LuQrCode size={18} />
              <span>Digital / QR Pay</span>
            </span>
            <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-purple-500 text-white">
              {paymentStats.digital.share}%
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            Rs. {paymentStats.digital.total.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {paymentStats.digital.count} transaction(s) via Raast, JazzCash, or Nayapay
          </div>
        </div>
      </div>
    </div>
  );
};
