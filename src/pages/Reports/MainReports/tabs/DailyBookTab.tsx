import React from 'react';

interface DailyBookTabProps {
  isGeneratingPdf: boolean;
  handleSort: (field: string) => void;
  renderSortIcon: (field: string) => React.ReactNode;
  filteredDailyRows: any[];
  dailySummary: {
    cashIn?: number;
    cashOut?: number;
    closing?: number;
    [key: string]: any;
  };
}

export const DailyBookTab: React.FC<DailyBookTabProps> = ({
  isGeneratingPdf,
  handleSort,
  renderSortIcon,
  filteredDailyRows,
  dailySummary,
}) => {
  return (
    <div className={`bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs ${isGeneratingPdf ? 'overflow-visible border-none shadow-none rounded-none w-full' : 'overflow-hidden'} print:border-none print:shadow-none print:rounded-none print:overflow-visible`}>
              <div className={`${isGeneratingPdf ? 'overflow-visible w-full' : 'overflow-x-auto'} print:overflow-visible`}>
                <table className="w-full text-left border-collapse text-xs print:text-[10px]">
                  <thead className="print:table-header-group">
                    <tr className="border-b-2 border-slate-900 dark:border-strokedark bg-slate-50/75 dark:bg-slate-800/60 font-bold text-slate-800 dark:text-slate-200 print:bg-slate-100 print:text-black">
                      <th className="py-3 px-3 text-center w-12 whitespace-nowrap">S#</th>
                      <th 
                        onClick={() => handleSort('date')}
                        className="py-3 px-3 cursor-pointer group hover:text-primary transition whitespace-nowrap w-28"
                      >
                        <div className="flex items-center gap-0.5">
                          <span>Date</span>
                          {renderSortIcon('date')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('voucherNo')}
                        className="py-3 px-3 cursor-pointer group hover:text-primary transition whitespace-nowrap w-32"
                      >
                        <div className="flex items-center gap-0.5">
                          <span>Voucher / Ref #</span>
                          {renderSortIcon('voucherNo')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('accountTitle')}
                        className="py-3 px-3 cursor-pointer group hover:text-primary transition min-w-[200px]"
                      >
                        <div className="flex items-center gap-0.5">
                          <span>Account Title (Code)</span>
                          {renderSortIcon('accountTitle')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('entryType')}
                        className="py-3 px-3 cursor-pointer group hover:text-primary transition whitespace-nowrap w-28"
                      >
                        <div className="flex items-center gap-0.5">
                          <span>Entry Type</span>
                          {renderSortIcon('entryType')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('cashIn')}
                        className="py-3 px-3 text-right cursor-pointer group hover:text-primary transition whitespace-nowrap w-32"
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          <span>Cash In (Dr)</span>
                          {renderSortIcon('cashIn')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('cashOut')}
                        className="py-3 px-3 text-right cursor-pointer group hover:text-primary transition whitespace-nowrap w-32"
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          <span>Cash Out (Cr)</span>
                          {renderSortIcon('cashOut')}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('netDrawerCash')}
                        className="py-3 px-3 text-right cursor-pointer group hover:text-primary transition whitespace-nowrap w-36"
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          <span>Net Drawer Cash</span>
                          {renderSortIcon('netDrawerCash')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark font-medium">
                    {filteredDailyRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                          No daily transactions found in this period.
                        </td>
                      </tr>
                    ) : (
                      filteredDailyRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition print:break-inside-avoid print:border-b print:border-slate-300">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] whitespace-nowrap align-middle">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap align-middle">{row.date}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-primary whitespace-nowrap align-middle">{row.voucherNo}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white whitespace-nowrap align-middle">
                            <span dir="auto">{row.accountTitle}</span>
                            {row.accountCode && (
                              <>
                                {' '}
                                <bdi dir="ltr" className="font-mono text-slate-400 dark:text-slate-500 text-[10px] inline-block font-normal">
                                  {`\u200E(${row.accountCode})\u200E`}
                                </bdi>
                              </>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800 dark:text-white text-[11px]">
                                {row.entryType}
                              </span>
                              {row.paymentMode && (
                                <span className={`text-[10px] font-bold ${
                                  row.paymentMode.includes('Credit')
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : row.paymentMode.includes('Bank')
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {row.paymentMode}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap align-middle">
                            {row.cashIn > 0 ? `Rs. ${Number(row.cashIn).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap align-middle">
                            {row.cashOut > 0 ? `Rs. ${Number(row.cashOut).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap align-middle">
                            Rs. {Number(row.netDrawerCash).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredDailyRows.length > 0 && (
                    <tfoot className="print:table-footer-group border-t-2 border-slate-900 dark:border-slate-300 bg-slate-50/90 dark:bg-slate-800/80 font-bold">
                      <tr>
                        <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200">
                          Total Daily Inflow & Outflow:
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-600 whitespace-nowrap">
                          Rs. {Number(dailySummary.cashIn).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-rose-600 whitespace-nowrap">
                          Rs. {Number(dailySummary.cashOut).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                          Rs. {Number(dailySummary.closing).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
  );
};
