import React, { useMemo } from 'react';

interface VendorLedgerTabProps {
  filteredVendorRows: any[];
  handleSort: (col: string) => void;
  renderSortIcon: (col: string) => React.ReactNode;
  isGeneratingPdf: boolean;
}

export const VendorLedgerTab: React.FC<VendorLedgerTabProps> = ({
  filteredVendorRows,
  handleSort,
  renderSortIcon,
  isGeneratingPdf
}) => {
  const aging = useMemo(() => {
    const now = Date.now();
    let d0_30 = 0;
    let d31_60 = 0;
    let d61_90 = 0;
    let d90_plus = 0;

    filteredVendorRows.forEach(r => {
      const amt = Number(r.purchases || 0);
      if (amt <= 0) return;
      const t = r.timestamp || (r.date ? new Date(r.date + 'T12:00:00').getTime() : now);
      const days = Math.max(0, Math.floor((now - t) / (1000 * 60 * 60 * 24)));
      if (days <= 30) d0_30 += amt;
      else if (days <= 60) d31_60 += amt;
      else if (days <= 90) d61_90 += amt;
      else d90_plus += amt;
    });

    return { d0_30, d31_60, d61_90, d90_plus };
  }, [filteredVendorRows]);

  return (
    <div className="space-y-3">
      {/* ── AGING ANALYSIS BRACKETS ── */}
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-3 shadow-2xs print:border-slate-300 print:shadow-none">
        <div className="flex items-center justify-between pb-2 border-b border-stroke dark:border-strokedark mb-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Vendor Payables Aging Analysis
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Total Liabilities: Rs. {Number(aging.d0_30 + aging.d31_60 + aging.d61_90 + aging.d90_plus).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
          <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">0 - 30 Days (Current)</span>
            <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 mt-0.5 block">
              Rs. {Number(aging.d0_30).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">31 - 60 Days</span>
            <span className="text-xs font-black text-amber-800 dark:text-amber-300 mt-0.5 block">
              Rs. {Number(aging.d31_60).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <span className="block text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase">61 - 90 Days</span>
            <span className="text-xs font-black text-orange-800 dark:text-orange-300 mt-0.5 block">
              Rs. {Number(aging.d61_90).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
            <span className="block text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">90+ Days (Overdue)</span>
            <span className="text-xs font-black text-rose-800 dark:text-rose-300 mt-0.5 block">
              Rs. {Number(aging.d90_plus).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className={`bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs ${isGeneratingPdf ? 'overflow-visible border-none shadow-none rounded-none' : 'overflow-hidden'} print:border-none print:shadow-none print:rounded-none print:overflow-visible`}>
      <div className={`${isGeneratingPdf ? 'overflow-visible' : 'overflow-x-auto'} print:overflow-visible`}>
        <table className="w-full text-left border-collapse text-xs print:text-[10px]">
          <thead className="print:table-header-group">
            <tr className="border-b border-stroke dark:border-strokedark bg-slate-50/75 dark:bg-slate-800/60 font-bold text-slate-700 dark:text-slate-200 select-none print:bg-slate-100 print:text-black print:border-b-2 print:border-slate-800">
              <th className="py-2.5 px-2 text-center w-8 whitespace-nowrap">S#</th>
              <th 
                onClick={() => handleSort('date')}
                className="py-2.5 px-2 cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center gap-0.5">
                  <span>Date</span>
                  {renderSortIcon('date')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('refNo')}
                className="py-2.5 px-2 cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center gap-0.5">
                  <span>Ref / Doc #</span>
                  {renderSortIcon('refNo')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('partyName')}
                className="py-2.5 px-2 cursor-pointer group hover:text-primary transition"
              >
                <div className="flex items-center gap-0.5">
                  <span>Vendor Name (Code)</span>
                  {renderSortIcon('partyName')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('city')}
                className="py-2.5 px-2 cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center gap-0.5">
                  <span>City</span>
                  {renderSortIcon('city')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('area')}
                className="py-2.5 px-2 cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center gap-0.5">
                  <span>Area</span>
                  {renderSortIcon('area')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('entryType')}
                className="py-2.5 px-2 cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center gap-0.5">
                  <span>Entry Type</span>
                  {renderSortIcon('entryType')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('purchases')}
                className="py-2.5 px-2 text-right cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>Purchases (Cr)</span>
                  {renderSortIcon('purchases')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('returns')}
                className="py-2.5 px-2 text-right cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>Return (Dr)</span>
                  {renderSortIcon('returns')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('payments')}
                className="py-2.5 px-2 text-right cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>Paid (Dr)</span>
                  {renderSortIcon('payments')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('runningBalance')}
                className="py-2.5 px-2 text-right cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>Running Balance</span>
                  {renderSortIcon('runningBalance')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke dark:divide-strokedark font-medium">
            {filteredVendorRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                  No transactions found matching your selected vendor, city, area and date range.
                </td>
              </tr>
            ) : (
              filteredVendorRows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition print:break-inside-avoid print:border-b print:border-slate-300">
                  <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px] whitespace-nowrap">{row.index}</td>
                  <td className="py-2 px-2 font-mono text-[11px] whitespace-nowrap">{row.date}</td>
                  <td className="py-2 px-2 font-mono font-bold text-primary whitespace-nowrap">{row.refNo}</td>
                  <td className="py-2 px-2 font-bold text-slate-800 dark:text-white">
                    <span>{row.partyName}</span>{' '}
                    <bdi dir="ltr" className="font-mono text-slate-400 text-[10px] inline-block font-normal">{`\u200E(${row.accountCode})\u200E`}</bdi>
                  </td>
                  <td className="py-2 px-2 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
                    {row.city || '-'}
                  </td>
                  <td className="py-2 px-2 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                    {row.area || '-'}
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.isOpening ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' :
                      row.entryType.includes('Return') ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                      row.entryType.includes('Payment') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                      'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}>
                      {row.entryType}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-blue-600 whitespace-nowrap">
                    {row.purchases > 0 ? `Rs. ${Number(row.purchases).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-amber-600 whitespace-nowrap">
                    {row.returns > 0 ? `Rs. ${Number(row.returns).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                    {row.payments > 0 ? `Rs. ${Number(row.payments).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    Rs. {Number(Math.abs(row.runningBalance)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {row.runningBalance >= 0 ? 'Cr' : 'Dr'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};
