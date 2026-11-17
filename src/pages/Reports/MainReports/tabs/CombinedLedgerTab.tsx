import React from 'react';

interface CombinedLedgerTabProps {
  filteredCombinedRows: any[];
  handleSort: (col: string) => void;
  renderSortIcon: (col: string) => React.ReactNode;
  isGeneratingPdf: boolean;
}

export const CombinedLedgerTab: React.FC<CombinedLedgerTabProps> = ({
  filteredCombinedRows,
  handleSort,
  renderSortIcon,
  isGeneratingPdf
}) => {
  return (
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
                  <span>Party Name (Code)</span>
                  {renderSortIcon('partyName')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('partyType')}
                className="py-2.5 px-2 cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center gap-0.5">
                  <span>Type</span>
                  {renderSortIcon('partyType')}
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
                onClick={() => handleSort('debit')}
                className="py-2.5 px-2 text-right cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>Debit (Dr)</span>
                  {renderSortIcon('debit')}
                </div>
              </th>
              <th 
                onClick={() => handleSort('credit')}
                className="py-2.5 px-2 text-right cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>Credit (Cr)</span>
                  {renderSortIcon('credit')}
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
            {filteredCombinedRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                  No party transaction records found.
                </td>
              </tr>
            ) : (
              filteredCombinedRows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition print:break-inside-avoid print:border-b print:border-slate-300">
                  <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px] whitespace-nowrap">{idx + 1}</td>
                  <td className="py-2 px-2 font-mono text-[11px] whitespace-nowrap">{row.date}</td>
                  <td className="py-2 px-2 font-mono font-bold text-primary whitespace-nowrap">{row.refNo}</td>
                  <td className="py-2 px-2 font-bold text-slate-800 dark:text-white">
                    <span>{row.partyName}</span>{' '}
                    <bdi dir="ltr" className="font-mono text-slate-400 text-[10px] inline-block font-normal">{`\u200E(${row.accountCode})\u200E`}</bdi>
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.partyType === 'Customer' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {row.partyType}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">{row.city || '-'}</td>
                  <td className="py-2 px-2 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{row.area || '-'}</td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.isOpening ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' :
                      row.entryType.includes('Return') ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                      row.entryType.includes('Payment') || row.entryType.includes('Receipt') ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                      row.partyType === 'Customer' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' :
                      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {row.entryType}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-blue-600 whitespace-nowrap">
                    {row.debit > 0 ? `Rs. ${Number(row.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-amber-600 whitespace-nowrap">
                    {row.credit > 0 ? `Rs. ${Number(row.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    Rs. {Number(Math.abs(row.runningBalance)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {row.runningBalance >= 0 ? 'Dr' : 'Cr'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
