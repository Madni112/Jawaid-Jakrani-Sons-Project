import React from 'react';
import { MdCheckCircle, MdWarning, MdDeleteOutline, MdSync, MdPersonAdd } from 'react-icons/md';
import { ParsedVendor } from '../types/vendorImportTypes';

interface VendorImportPreviewTableProps {
  parsedData: ParsedVendor[];
  fileName: string;
  onClear: () => void;
}

export const VendorImportPreviewTable: React.FC<VendorImportPreviewTableProps> = ({
  parsedData,
  fileName,
  onClear
}) => {
  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.length - validCount;
  const existingCount = parsedData.filter((r) => r.isExisting).length;
  const newCount = validCount - existingCount;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100/70 dark:bg-meta-4/30 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            Preview ({parsedData.length} records)
          </span>
          {newCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <MdPersonAdd size={11} /> {newCount} New Vendors
            </span>
          )}
          {existingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              <MdSync size={11} /> {existingCount} Existing Vendors (Will Update Balance & City)
            </span>
          )}
          {invalidCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
              <MdWarning size={11} /> {invalidCount} Invalid
            </span>
          )}
          {fileName && (
            <span className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
              ({fileName})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClear}
          className="text-rose-600 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1 self-end sm:self-auto cursor-pointer"
        >
          <MdDeleteOutline size={14} /> Clear List
        </button>
      </div>

      {/* Data Table */}
      <div className="max-h-64 overflow-y-auto border border-stroke dark:border-strokedark rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-stroke dark:border-strokedark text-[11px] font-bold text-slate-500 uppercase">
            <tr>
              <th className="p-2.5 w-10 text-center">#</th>
              <th className="p-2.5 min-w-[150px]">Vendor Name *</th>
              <th className="p-2.5 min-w-[80px]">Action</th>
              <th className="p-2.5 min-w-[100px]">City *</th>
              <th className="p-2.5 min-w-[100px]">Area</th>
              <th className="p-2.5 min-w-[130px]">Address</th>
              <th className="p-2.5 min-w-[80px]">Province</th>
              <th className="p-2.5 min-w-[100px]">Phone</th>
              <th className="p-2.5 min-w-[110px] text-right">Opening Bal.</th>
              <th className="p-2.5 min-w-[90px] text-center">Nature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke dark:divide-strokedark font-medium">
            {parsedData.map((row, idx) => (
              <tr
                key={row.id}
                className={`hover:bg-slate-50/60 dark:hover:bg-meta-4/20 transition-colors ${
                  !row.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                }`}
              >
                <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">
                  {idx + 1}
                </td>
                <td className="p-2.5 font-bold text-slate-800 dark:text-slate-100">
                  {row.name}
                  {!row.isValid && (
                    <span className="block text-[10px] text-rose-500 font-normal">
                      {row.validationError}
                    </span>
                  )}
                </td>
                <td className="p-2.5">
                  {row.isExisting ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      <MdSync size={10} /> UPDATE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      <MdCheckCircle size={10} /> NEW
                    </span>
                  )}
                </td>
                <td className="p-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold text-[11px]">
                    {row.city || 'Hyderabad'}
                  </span>
                </td>
                <td className="p-2.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  {row.area || '-'}
                </td>
                <td
                  className="p-2.5 text-slate-600 dark:text-slate-300 text-[11px] truncate max-w-[140px]"
                  title={row.address}
                >
                  {row.address || '-'}
                </td>
                <td className="p-2.5 text-slate-600 dark:text-slate-300 text-[11px]">
                  {row.province || 'Sindh'}
                </td>
                <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                  {row.phone || '-'}
                </td>
                <td className="p-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                  Rs. {row.balance.toLocaleString()}
                </td>
                <td className="p-2.5 text-center">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      row.balanceNature === 'Credit'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                    }`}
                  >
                    {row.balanceNature === 'Credit' ? 'Credit (Cr)' : 'Debit (Dr)'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
