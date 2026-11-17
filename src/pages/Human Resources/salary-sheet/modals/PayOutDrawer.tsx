import React from 'react';
import { Banknote } from 'lucide-react';
import { Field, Pick, Text } from '../../../Masters/masterUi';
import { SalarySheetView } from '../../../../services/hr.service';
import { money } from '../utils/salarySheetUtils';

interface PayOutDrawerProps {
  open: boolean;
  detail: SalarySheetView;
  pay: {
    open: boolean;
    payThrough: string;
    accountId: string;
    date: string;
  };
  setPay: React.Dispatch<React.SetStateAction<{
    open: boolean;
    payThrough: string;
    accountId: string;
    date: string;
  }>>;
  payThroughOptions: string[];
  accounts: any[];
  busy: boolean;
  onPayOut: (s: SalarySheetView) => void;
}

export const PayOutDrawer: React.FC<PayOutDrawerProps> = ({
  open,
  detail,
  pay,
  setPay,
  payThroughOptions,
  accounts,
  busy,
  onPayOut
}) => {
  if (!open || detail.status !== 'Approved') return null;

  return (
    <div className="p-4 border-b border-stroke dark:border-strokedark bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-wrap items-end gap-3 animate-fade-in">
      <Field label="Pay Through" className="w-44">
        <Pick
          value={pay.payThrough}
          onChange={(e) => setPay((p) => ({ ...p, payThrough: e.target.value }))}
        >
          {payThroughOptions.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </Pick>
      </Field>

      <Field label="From Account" required className="w-64">
        <Pick
          value={pay.accountId}
          onChange={(e) => setPay((p) => ({ ...p, accountId: e.target.value }))}
        >
          <option value="">Choose bank / cash account...</option>
          {accounts
            .filter((a) => !/payable|loan|wage|salary/i.test(a.name))
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} - {a.name}
              </option>
            ))}
        </Pick>
      </Field>

      <Field label="Payment Date" className="w-44">
        <Text
          type="date"
          value={pay.date}
          onChange={(e) => setPay((p) => ({ ...p, date: e.target.value }))}
        />
      </Field>

      <button
        type="button"
        onClick={() => onPayOut(detail)}
        disabled={busy || !pay.accountId}
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
      >
        <Banknote className="w-3.5 h-3.5" />
        <span>Post Payment of Rs. {money(detail.netPayable)}</span>
      </button>

      <button
        type="button"
        onClick={() => setPay((p) => ({ ...p, open: false }))}
        className="px-3 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white text-xs font-bold hover:bg-gray-100 transition cursor-pointer"
      >
        Cancel
      </button>
    </div>
  );
};

export default PayOutDrawer;
