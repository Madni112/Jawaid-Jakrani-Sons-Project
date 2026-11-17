import React from 'react';
import { FieldArray } from 'formik';
import AccountCombobox from '../../../../components/AccountCombobox';
import Spinner from '../../../../ui/Spinner';
import { blockInvalidChar } from '../utils/voucherConstants';

interface VoucherGeneralJournalTableProps {
  values: any;
  handleChange: (e: React.ChangeEvent<any>) => void;
  setFieldValue: (field: string, value: any) => void;
  getFilteredAccounts: (idx: number) => any[];
  isLockedVoucher: boolean;
  loading: boolean;
  onCancel: () => void;
}

export const VoucherGeneralJournalTable: React.FC<VoucherGeneralJournalTableProps> = ({
  values,
  handleChange,
  setFieldValue,
  getFilteredAccounts,
  isLockedVoucher,
  loading,
  onCancel
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-center border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wide border-b">
              <th className="p-2.5 border w-12">S.#</th>
              <th className="p-2.5 border text-left min-w-[260px]">Chart Of Account *</th>
              <th className="p-2.5 border min-w-[220px]">Description / Reference</th>
              <th className="p-2.5 border w-36">Debit (Dr)</th>
              <th className="p-2.5 border w-36">Credit (Cr)</th>
              <th className="p-2.5 border w-10"></th>
            </tr>
          </thead>
          <FieldArray name="items">
            {({ push, remove }) => (
              <tbody>
                {values.items.map((item: any, idx: number) => {
                  const rowAccounts = getFilteredAccounts(idx);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2 border text-slate-400 font-medium bg-slate-50/30">
                        {idx + 1}
                      </td>
                      <td className="p-2 border min-w-[260px]">
                        <AccountCombobox
                          accounts={rowAccounts}
                          value={String(item.accountCode || '')}
                          onChange={(selectedCode) => {
                            setFieldValue(`items.${idx}.accountCode`, selectedCode);
                          }}
                        />
                      </td>
                      <td className="p-1 border">
                        <input
                          type="text"
                          name={`items.${idx}.description`}
                          onChange={handleChange}
                          value={item.description}
                          className="w-full px-2 outline-none bg-transparent h-8 text-slate-900 dark:text-white"
                          placeholder="Enter line details"
                        />
                      </td>
                      <td className="p-1 border">
                        <input
                          type="number"
                          name={`items.${idx}.debit`}
                          onKeyDown={blockInvalidChar}
                          onChange={(e) => {
                            handleChange(e);
                            const val = Number(e.target.value) || 0;
                            if (val > 0) setFieldValue(`items.${idx}.credit`, 0);
                          }}
                          value={item.debit || ''}
                          className="w-full text-center font-mono font-bold outline-none h-8 bg-transparent text-slate-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-1 border">
                        <input
                          type="number"
                          name={`items.${idx}.credit`}
                          onKeyDown={blockInvalidChar}
                          onChange={(e) => {
                            handleChange(e);
                            const val = Number(e.target.value) || 0;
                            if (val > 0) setFieldValue(`items.${idx}.debit`, 0);
                          }}
                          value={item.credit || ''}
                          className="w-full text-center font-mono font-bold outline-none h-8 bg-transparent text-slate-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 border text-center">
                        {values.items.length > 2 && (
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="text-red-500 font-bold hover:scale-110 transition cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={6} className="p-2.5 text-left bg-slate-50/20">
                    <button
                      type="button"
                      onClick={() => push({ accountCode: '', description: '', debit: 0, credit: 0 })}
                      className="text-emerald-600 font-black hover:underline cursor-pointer"
                    >
                      + Add Row
                    </button>
                  </td>
                </tr>
              </tbody>
            )}
          </FieldArray>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
        >
          {isLockedVoucher ? 'Back to List' : 'Cancel'}
        </button>
        {!isLockedVoucher && (
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-8 font-bold text-white text-xs cursor-pointer flex items-center gap-2"
          >
            {loading ? <Spinner color="border-white" size="w-4 h-4" /> : <span>Save Voucher</span>}
          </button>
        )}
      </div>
    </div>
  );
};
