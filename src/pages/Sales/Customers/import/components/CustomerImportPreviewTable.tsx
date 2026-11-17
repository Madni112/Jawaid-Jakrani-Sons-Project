import React from 'react';
import {
  MdPersonAdd,
  MdSync,
  MdWarning,
  MdDeleteOutline,
  MdCheckCircle,
} from 'react-icons/md';
import { ParsedCustomer } from '../types/customerImportTypes';

interface CustomerImportPreviewTableProps {
  parsedData: ParsedCustomer[];
  fileName: string;
  batchOpeningDate: string;
  setBatchOpeningDate: (date: string) => void;
  onClear: () => void;
}

export const CustomerImportPreviewTable: React.FC<CustomerImportPreviewTableProps> = ({
  parsedData,
  fileName,
  batchOpeningDate,
  setBatchOpeningDate,
  onClear,
}) => {
  if (parsedData.length === 0) return null;

  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.length - validCount;
  const existingCount = parsedData.filter((r) => r.isExisting && r.isValid).length;
  const newCount = validCount - existingCount;

  return (
    <div className="space-y-3">
      {/* Summary Stats Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-100 dark:bg-meta-4/30 border border-stroke dark:border-strokedark">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Preview ({parsedData.length} records)
          </span>

          {newCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <MdPersonAdd size={14} />
              <span>{newCount} New Customers</span>
            </span>
          )}

          {existingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <MdSync size={14} />
              <span>{existingCount} Existing (Will update balances & location)</span>
            </span>
          )}

          {invalidCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
              <MdWarning size={14} />
              <span>{invalidCount} Invalid</span>
            </span>
          )}

          {fileName && (
            <span className="text-xs text-slate-400 font-mono truncate max-w-xs ml-1">
              ({fileName})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {parsedData.some((r) => !r.openingDate) && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-boxdark px-2.5 py-1 rounded-lg border border-stroke dark:border-strokedark">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                Fallback OB Date (for empty rows):
              </label>
              <input
                type="date"
                value={batchOpeningDate}
                onChange={(e) => setBatchOpeningDate(e.target.value)}
                className="bg-transparent font-mono text-xs font-semibold text-black dark:text-white outline-none cursor-pointer"
                title="Fallback date for Opening Balance vouchers if row doesn't have a date"
              />
            </div>
          )}

          <button
            type="button"
            onClick={onClear}
            className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <MdDeleteOutline size={15} />
            <span>Clear List</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="max-h-72 overflow-y-auto overflow-x-auto rounded-xl border border-stroke dark:border-strokedark">
        <table className="w-full min-w-[850px] text-left text-xs">
          <thead className="bg-slate-100 dark:bg-meta-4/60 sticky top-0 font-bold text-slate-700 dark:text-slate-200 z-10">
            <tr>
              <th className="py-2.5 px-3 w-8">#</th>
              <th className="py-2.5 px-3">Customer Name *</th>
              <th className="py-2.5 px-3 text-center">Account Code</th>
              <th className="py-2.5 px-3 text-center">Action</th>
              <th className="py-2.5 px-3">City *</th>
              <th className="py-2.5 px-3">Area</th>
              <th className="py-2.5 px-3">Address</th>
              <th className="py-2.5 px-3">Province</th>
              <th className="py-2.5 px-3">Phone</th>
              <th className="py-2.5 px-3 text-right">Opening Bal.</th>
              <th className="py-2.5 px-3 text-center">Nature</th>
              <th className="py-2.5 px-3 text-center">OB Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke dark:divide-strokedark">
            {parsedData.map((row, idx) => (
              <tr
                key={row.id}
                className={
                  !row.isValid
                    ? 'bg-rose-50/50 dark:bg-rose-950/20'
                    : row.isExisting
                    ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/60 dark:hover:bg-amber-950/20'
                    : 'hover:bg-slate-50 dark:hover:bg-meta-4/10'
                }
              >
                <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>

                <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                  <div>
                    {row.name || <span className="text-rose-500 italic">Missing Name</span>}
                  </div>
                  {row.tier && (
                    <span className="text-[10px] text-slate-400 block font-normal">{row.tier}</span>
                  )}
                </td>

                {/* Account Code */}
                <td className="py-2 px-3 text-center">
                  {row.assignedCode ? (
                    <span className="font-mono font-bold text-primary dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded text-[11px]">
                      {row.assignedCode}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">-</span>
                  )}
                </td>

                {/* Status / Action */}
                <td className="py-2 px-3 text-center">
                  {row.isExisting ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                      title="Existing customer in system. Opening balance and details will be updated."
                    >
                      <MdSync size={11} />
                      <span>UPDATE</span>
                    </span>
                  ) : row.isValid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      <MdCheckCircle size={11} />
                      <span>NEW</span>
                    </span>
                  ) : (
                    <span
                      title={row.validationError}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300"
                    >
                      <MdWarning size={11} />
                      <span>INVALID</span>
                    </span>
                  )}
                </td>

                {/* City */}
                <td className="py-2 px-3">
                  <span className="font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-primary/20 text-[11px]">
                    {row.city}
                  </span>
                </td>

                <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{row.area || '-'}</td>

                <td
                  className="py-2 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[150px]"
                  title={row.address}
                >
                  {row.address || '-'}
                </td>

                <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                  {row.province || 'Sindh'}
                </td>

                <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
                  {row.phone || '-'}
                </td>

                <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-200 font-bold">
                  {row.balance ? (
                    `Rs. ${row.balance.toLocaleString()}`
                  ) : (
                    <span className="text-slate-400 font-normal">0</span>
                  )}
                </td>

                <td className="py-2 px-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      row.balanceNature === 'Credit'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}
                  >
                    {row.balanceNature === 'Credit' ? 'Credit (Cr)' : 'Debit (Dr)'}
                  </span>
                </td>

                <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {row.openingDate || batchOpeningDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
