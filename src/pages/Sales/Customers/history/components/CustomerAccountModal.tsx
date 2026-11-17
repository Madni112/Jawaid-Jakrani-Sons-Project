import React, { useState } from 'react';
import { MdAccountBalanceWallet, MdClose, MdCheckCircle } from 'react-icons/md';
import Spinner from '../../../../../ui/Spinner';
import { CustomerRecord, COAAccount } from '../types/customerHistoryTypes';
import { getCustomerDisplayName } from '../utils/customerHistoryHelpers';

interface CustomerAccountModalProps {
  customer: CustomerRecord;
  initialCode: string;
  initialOpeningBalance: string;
  initialNature: 'Debit' | 'Credit';
  existingCOA?: COAAccount;
  coaAccounts: COAAccount[];
  onClose: () => void;
  onSave: (params: {
    selectedCustomer: CustomerRecord;
    cleanCode: string;
    openingBalanceInput: string;
    balanceNatureInput: 'Debit' | 'Credit';
    existingCOA?: COAAccount;
    coaAccounts: COAAccount[];
  }) => Promise<void>;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  customer,
  initialCode,
  initialOpeningBalance,
  initialNature,
  existingCOA,
  coaAccounts,
  onClose,
  onSave
}) => {
  const [accountCodeInput, setAccountCodeInput] = useState(initialCode);
  const [openingBalanceInput, setOpeningBalanceInput] = useState(initialOpeningBalance);
  const [balanceNatureInput, setBalanceNatureInput] = useState<'Debit' | 'Credit'>(initialNature);
  const [savingAccount, setSavingAccount] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      await onSave({
        selectedCustomer: customer,
        cleanCode: accountCodeInput.trim(),
        openingBalanceInput,
        balanceNatureInput,
        existingCOA,
        coaAccounts
      });
      onClose();
    } finally {
      setSavingAccount(false);
    }
  };

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-lg border border-stroke bg-white p-6 shadow-2xl dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between border-b border-stroke pb-3 mb-4 dark:border-strokedark">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <MdAccountBalanceWallet size={20} />
            </div>
            <div>
              <h4 className="font-bold text-black dark:text-white text-sm">Assign Chart of Account Code</h4>
              <p className="text-xs text-gray-500">Maps customer directly into Accounts Receivable asset ledger</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black dark:hover:text-white cursor-pointer p-1 rounded"
          >
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Customer Name:</label>
            <input
              type="text"
              value={getCustomerDisplayName(customer)}
              disabled
              className="w-full rounded border border-stroke dark:border-strokedark px-3 h-9 bg-gray-100 dark:bg-meta-4/30 font-bold text-black dark:text-white text-xs cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-200 dark:border-slate-700">
            <div>
              <span className="block text-[10px] uppercase font-bold text-gray-400">Category:</span>
              <span className="font-bold text-black dark:text-white text-xs">1. ASSETS</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-gray-400">Sub-Category:</span>
              <span className="font-bold text-black dark:text-white text-xs">Current Assets</span>
            </div>
            <div className="col-span-2">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Control Group:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                Customers (Trade Debtors)
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-black dark:text-white mb-1">
              Assign Account Code: *
            </label>
            <input
              type="text"
              value={accountCodeInput}
              onChange={(e) => setAccountCodeInput(e.target.value)}
              placeholder="e.g. 2020-001"
              required
              className="w-full rounded border border-stroke dark:border-strokedark px-3 h-10 bg-transparent font-mono font-bold text-sm text-black dark:text-white outline-none focus:border-primary"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
              Auto-links customer ledger under Chart of Accounts:{' '}
              <strong className="text-black dark:text-white font-mono">
                Customers ({accountCodeInput || '2020-xxx'})
              </strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Opening Balance (PKR):
              </label>
              <input
                type="number"
                step="any"
                value={openingBalanceInput}
                onChange={(e) => setOpeningBalanceInput(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-stroke dark:border-strokedark px-3 py-2 bg-slate-50/50 dark:bg-boxdark font-mono font-bold text-xs text-black dark:text-white outline-none focus:border-primary"
              />
              <p className="text-[10px] text-gray-400 mt-1">Initial balance owed or advance held</p>
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">Balance Nature:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceNatureInput('Debit')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                    balanceNatureInput === 'Debit'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-stroke dark:border-strokedark hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {balanceNatureInput === 'Debit' && <MdCheckCircle size={13} />}
                  <span>Debit (Dr - Receivable)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceNatureInput('Credit')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                    balanceNatureInput === 'Credit'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-stroke dark:border-strokedark hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {balanceNatureInput === 'Credit' && <MdCheckCircle size={13} />}
                  <span>Credit (Cr - Advance)</span>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {balanceNatureInput === 'Debit'
                  ? 'Customer owes this amount (Receivable)'
                  : 'Customer paid advance (Excess Credit)'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAccount}
              className="rounded bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {savingAccount ? (
                <Spinner size="w-3.5 h-3.5" color="border-white" />
              ) : (
                <MdCheckCircle size={15} />
              )}
              <span>Save & Sync to COA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
