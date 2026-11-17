import React from 'react';

interface ExpenseReportTabProps {
  isGeneratingPdf: boolean;
  handleSort: (field: string) => void;
  renderSortIcon: (field: string) => React.ReactNode;
  filteredExpenseRows: any[];
  expenseSummary: { count: number; total: number };
}

export const ExpenseReportTab: React.FC<ExpenseReportTabProps> = ({
  isGeneratingPdf,
  handleSort,
  renderSortIcon,
  filteredExpenseRows,
  expenseSummary,
}) => {
  return (
    <div
      className={`bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs ${
        isGeneratingPdf
          ? 'overflow-visible border-none shadow-none rounded-none w-full'
          : 'overflow-hidden'
      } print:border-none print:shadow-none print:rounded-none print:overflow-visible`}
    >
      <div className={`${isGeneratingPdf ? 'overflow-visible w-full' : 'overflow-x-auto'} print:overflow-visible`}>
        <table className="w-full text-left border-collapse text-xs print:text-[10px]">
          <thead className="print:table-header-group">
            <tr className="border-b-2 border-slate-900 dark:border-strokedark bg-slate-50/75 dark:bg-slate-800/60 font-bold text-slate-800 dark:text-slate-200 print:bg-slate-100 print:text-black">
              <th className="py-2.5 px-3 text-center w-12 whitespace-nowrap">S#</th>
              <th
                onClick={() => handleSort('date')}
                className="py-2.5 px-3 cursor-pointer group hover:text-primary transition whitespace-nowrap w-28"
              >
                <div className="flex items-center gap-0.5">
                  <span>Date</span>
                  {renderSortIcon('date')}
                </div>
              </th>
              <th
                onClick={() => handleSort('voucherNo')}
                className="py-2.5 px-3 cursor-pointer group hover:text-primary transition whitespace-nowrap w-32"
              >
                <div className="flex items-center gap-0.5">
                  <span>Voucher #</span>
                  {renderSortIcon('voucherNo')}
                </div>
              </th>
              <th
                onClick={() => handleSort('coaCodeTitle')}
                className="py-2.5 px-3 cursor-pointer group hover:text-primary transition whitespace-nowrap"
              >
                <div className="flex items-center gap-0.5">
                  <span>Chart of Accounts (Code & Title)</span>
                  {renderSortIcon('coaCodeTitle')}
                </div>
              </th>
              <th
                onClick={() => handleSort('paidVia')}
                className="py-2.5 px-3 cursor-pointer group hover:text-primary transition whitespace-nowrap w-32"
              >
                <div className="flex items-center gap-0.5">
                  <span>Paid Via</span>
                  {renderSortIcon('paidVia')}
                </div>
              </th>
              <th
                onClick={() => handleSort('amount')}
                className="py-2.5 px-3 text-right cursor-pointer group hover:text-primary transition whitespace-nowrap w-36"
              >
                <div className="flex items-center justify-end gap-0.5">
                  <span>Amount (PKR)</span>
                  {renderSortIcon('amount')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke dark:divide-strokedark font-medium">
            {filteredExpenseRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                  No expense entries recorded in this window.
                </td>
              </tr>
            ) : (
              filteredExpenseRows.map((row, idx) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition print:break-inside-avoid print:border-b print:border-slate-300"
                >
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] whitespace-nowrap align-middle">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap align-middle">{row.date}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rose-600 whitespace-nowrap align-middle">
                    {row.voucherNo}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white whitespace-nowrap align-middle">
                    {row.coaCodeTitle}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                    {isGeneratingPdf ? (
                      <span className="font-semibold text-slate-800 text-[11px]">{row.paidVia}</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 print:bg-transparent print:p-0 print:text-black">
                        {row.paidVia}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600 whitespace-nowrap align-middle">
                    Rs. {Number(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filteredExpenseRows.length > 0 && (
            <tfoot className="print:table-footer-group border-t-2 border-slate-900 dark:border-slate-300 bg-slate-50/90 dark:bg-slate-800/80 font-bold">
              <tr>
                <td
                  colSpan={5}
                  className="py-3 px-3 text-right uppercase tracking-wider font-bold text-slate-700 dark:text-slate-200"
                >
                  Total Operating Expenses ({expenseSummary.count} Entries):
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-rose-600 whitespace-nowrap text-sm print:text-xs">
                  Rs. {Number(expenseSummary.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
