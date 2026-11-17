import React from 'react';
import {
  LuX,
  LuBanknote,
  LuCreditCard,
  LuQrCode,
  LuCoins,
  LuSearch,
  LuAlertTriangle,
  LuCheck,
} from 'react-icons/lu';
import { MdPointOfSale } from 'react-icons/md';

interface POSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  customerName: string;
  paymentMethod: 'Cash' | 'Card' | 'Digital' | 'Split';
  setPaymentMethod: (m: 'Cash' | 'Card' | 'Digital' | 'Split') => void;
  grandTotal: number;
  cartItems: any[];
  cashTendered: number;
  setCashTendered: (val: number) => void;
  changeDue: number;
  posPaymentAccounts: any[];
  filteredPaymentAccounts: any[];
  selectedPaymentAccount: any;
  setSelectedPaymentAccount: (acc: any) => void;
  accountSearchQuery: string;
  setAccountSearchQuery: (val: string) => void;
  paymentRefNumber: string;
  setPaymentRefNumber: (val: string) => void;
  isProcessingSale: boolean;
  handleCompleteOrder: () => void;
  accentColor: string;
  contrastText: string;
  isAccentWhite: boolean;
  safeAccentText: string;
  isDark: boolean;
}

export const POSPaymentModal: React.FC<POSPaymentModalProps> = ({
  isOpen,
  onClose,
  ticketNumber,
  customerName,
  paymentMethod,
  setPaymentMethod,
  grandTotal,
  cartItems,
  cashTendered,
  setCashTendered,
  changeDue,
  posPaymentAccounts,
  filteredPaymentAccounts,
  selectedPaymentAccount,
  setSelectedPaymentAccount,
  accountSearchQuery,
  setAccountSearchQuery,
  paymentRefNumber,
  setPaymentRefNumber,
  isProcessingSale,
  handleCompleteOrder,
  accentColor,
  contrastText,
  isAccentWhite,
  safeAccentText,
  isDark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <MdPointOfSale className="text-primary text-xl" />
              <span>Payment Tender</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Order {ticketNumber} • {customerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'Cash', label: 'Cash', icon: LuBanknote },
              { id: 'Card', label: 'Card (POS)', icon: LuCreditCard },
              { id: 'Digital', label: 'Digital / QR', icon: LuQrCode },
              { id: 'Split', label: 'Split', icon: LuCoins },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: isAccentWhite
                            ? isDark
                              ? 'rgba(255, 255, 255, 0.15)'
                              : 'rgba(15, 23, 42, 0.08)'
                            : `${accentColor}18`,
                          color: safeAccentText,
                        }
                      : undefined
                  }
                >
                  <Icon size={20} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Total Due Display */}
          <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Net Amount Due
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                Rs. {Number(grandTotal || 0).toLocaleString()}
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-primary/10 text-primary">
              {cartItems.length} items
            </span>
          </div>

          {/* Cash Tendered & Quick Buttons */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Cash Tendered from Customer:
              </label>
              <input
                type="number"
                value={cashTendered || ''}
                onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                placeholder="Enter cash given"
                className="w-full px-4 py-2.5 text-base font-bold font-mono rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
              />

              {/* Quick Denominations */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { label: 'Exact', val: grandTotal },
                  { label: '+500', val: Math.ceil(grandTotal / 500) * 500 },
                  { label: '+1,000', val: Math.ceil(grandTotal / 1000) * 1000 },
                  { label: '+5,000', val: Math.ceil(grandTotal / 5000) * 5000 },
                ].map((btn, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashTendered(btn.val)}
                    className="py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Change Due Pill */}
              <div className="rounded-xl p-3.5 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Change Due to Customer:
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-300 font-mono">
                  Rs. {Number(changeDue || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Digital & Card Payment Destination Account Selector */}
          {(paymentMethod === 'Digital' || paymentMethod === 'Card') && (
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MdPointOfSale size={14} className="text-primary" />
                  <span>Destination Account ({paymentMethod === 'Card' ? 'Card POS Terminal' : 'Digital / QR'}):</span>
                </label>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {posPaymentAccounts.length} Active in POS
                </span>
              </div>

              {/* Search box if multiple accounts */}
              {posPaymentAccounts.length > 2 && (
                <div className="relative">
                  <LuSearch size={13} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    placeholder="Search bank name or account #..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {posPaymentAccounts.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <LuAlertTriangle size={15} />
                    <span>No Bank / Digital Accounts Configured</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    No accounts are enabled for POS yet. Go to <b>Accounts &gt; Bank Account</b> and click <b>+ Add Bank Account</b> to register your accounts and enable <b>Show in POS</b>.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-0.5">
                  {filteredPaymentAccounts.map((acc: any) => {
                    const isSelected = selectedPaymentAccount?.id === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedPaymentAccount(acc)}
                        className={`p-2.5 rounded-xl text-left border transition flex items-start justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border-primary ring-1 ring-primary shadow-xs'
                            : 'bg-white dark:bg-[#111622] border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-0 pr-1 space-y-0.5">
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {acc.bank_name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-semibold truncate">
                            {acc.account_number}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate">
                            {acc.account_title}
                          </div>
                        </div>
                        {isSelected && <LuCheck size={14} className="text-primary shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Transaction Reference / Approval Code */}
              <div className="pt-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Transaction / Approval Ref # (Optional):
                </label>
                <input
                  type="text"
                  value={paymentRefNumber}
                  onChange={(e) => setPaymentRefNumber(e.target.value)}
                  placeholder="e.g. TRX-99201, Raast Ref, or Slip #"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isProcessingSale}
            onClick={handleCompleteOrder}
            className="flex-1 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: accentColor,
              color: contrastText,
              border: isAccentWhite ? '1px solid #cbd5e1' : undefined,
            }}
          >
            <LuCheck size={16} />
            <span>
              {isProcessingSale ? 'Finalizing...' : 'Complete Sale & Print Receipt'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
