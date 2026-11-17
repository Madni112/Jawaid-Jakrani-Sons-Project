import React from 'react';
import { MdDelete } from 'react-icons/md';
import Spinner from '../../../../../ui/Spinner';
import { CustomerRecord } from '../types/customerHistoryTypes';
import { getCustomerDisplayName } from '../utils/customerHistoryHelpers';

interface CustomerDeleteConfirmModalProps {
  customer: CustomerRecord;
  deleteCustomerCOA: boolean;
  deletingCustomer: boolean;
  onDeleteCustomerCOAChange: (val: boolean) => void;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export const CustomerDeleteConfirmModal: React.FC<CustomerDeleteConfirmModalProps> = ({
  customer,
  deleteCustomerCOA,
  deletingCustomer,
  onDeleteCustomerCOAChange,
  onCancel,
  onConfirm
}) => {
  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3 text-rose-600">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
            <MdDelete size={22} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete Customer Profile</h3>
            <p className="text-xs text-slate-500">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          Are you sure you want to delete{' '}
          <strong className="text-slate-900 dark:text-white">
            {getCustomerDisplayName(customer)}
          </strong>
          {(customer.customer_code || customer.customerCode || customer.coa_code) && (
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {' '}
              ({customer.customer_code || customer.customerCode || customer.coa_code})
            </span>
          )}
          ?
        </p>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-meta-4/30 border border-slate-200 dark:border-slate-700">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={deleteCustomerCOA}
              onChange={(e) => onDeleteCustomerCOAChange(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Delete linked Chart of Accounts & Opening Balance
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Frees up account code{' '}
                <strong className="font-mono">
                  {customer.customer_code ||
                    customer.customerCode ||
                    customer.coa_code ||
                    '2020-xxx'}
                </strong>{' '}
                so it can be reused for future customer entries.
              </span>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deletingCustomer}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deletingCustomer}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {deletingCustomer ? (
              <Spinner size="w-3.5 h-3.5" color="border-white" />
            ) : (
              <MdDelete size={15} />
            )}
            <span>Delete Customer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
