import React from 'react';

interface MainReportsMetricsProps {
  activeTab: string;
  summary: {
    opening: number;
    debit: number;
    credit: number;
    returnAmt: number;
    closing: number;
  };
  pnlData: any;
  pnlCalculationMode: 'cash' | 'accrual';
  pnlIncludeOB: boolean;
}

export const MainReportsMetrics: React.FC<MainReportsMetricsProps> = ({
  activeTab,
  summary,
  pnlData,
  pnlCalculationMode,
  pnlIncludeOB
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 print:hidden">
      {activeTab === 'customer-ledger' && (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Opening Balance</span>
            <div className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">
              Rs. {Number(summary.opening).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Sales (Debit)</span>
            <div className="text-base font-black text-emerald-600 font-mono mt-1">
              Rs. {Number(summary.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-amber-600 uppercase">Returns (Credit)</span>
            <div className="text-base font-black text-amber-600 font-mono mt-1">
              Rs. {Number(summary.returnAmt).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-teal-600 uppercase">Received (Credit)</span>
            <div className="text-base font-black text-teal-600 font-mono mt-1">
              Rs. {Number(summary.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-2xs">
            <span className="text-[11px] font-bold text-primary uppercase">Net Closing Balance</span>
            <div className="text-base font-black text-primary font-mono mt-1">
              Rs. {Number(Math.abs(summary.closing)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {summary.closing >= 0 ? 'Dr' : 'Cr'}
            </div>
          </div>
        </>
      )}

      {activeTab === 'vendor-ledger' && (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Opening Payable</span>
            <div className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">
              Rs. {Number(summary.opening).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-blue-600 uppercase">Purchases (Credit)</span>
            <div className="text-base font-black text-blue-600 font-mono mt-1">
              Rs. {Number(summary.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-amber-600 uppercase">Purchase Returns (Dr)</span>
            <div className="text-base font-black text-amber-600 font-mono mt-1">
              Rs. {Number(summary.returnAmt).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Payments Made (Dr)</span>
            <div className="text-base font-black text-emerald-600 font-mono mt-1">
              Rs. {Number(summary.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-2xs">
            <span className="text-[11px] font-bold text-primary uppercase">Net Closing Payable</span>
            <div className="text-base font-black text-primary font-mono mt-1">
              Rs. {Number(Math.abs(summary.closing)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {summary.closing >= 0 ? 'Cr' : 'Dr'}
            </div>
          </div>
        </>
      )}

      {activeTab === 'combined-ledger' && (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Ledger Scope</span>
            <div className="text-base font-black text-slate-800 dark:text-white mt-1 truncate">
              All Parties
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-blue-600 uppercase">Total Debit</span>
            <div className="text-base font-black text-blue-600 font-mono mt-1">
              Rs. {Number(summary.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-amber-600 uppercase">Total Credit</span>
            <div className="text-base font-black text-amber-600 font-mono mt-1">
              Rs. {Number(summary.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Status</span>
            <div className="text-base font-black text-emerald-600 mt-1">
              Balanced System
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-2xs">
            <span className="text-[11px] font-bold text-primary uppercase">Net Net Total</span>
            <div className="text-base font-black text-primary font-mono mt-1">
              Rs. {Number(Math.abs(summary.closing)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {summary.closing >= 0 ? 'Dr' : 'Cr'}
            </div>
          </div>
        </>
      )}

      {activeTab === 'expense-report' && (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Expense Amount</span>
            <div className="text-base font-black text-rose-600 font-mono mt-1">
              Rs. {Number(summary.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Cash Expenses</span>
            <div className="text-base font-black text-emerald-600 font-mono mt-1">
              {summary.opening} Voucher(s)
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-blue-600 uppercase">Bank / Online Transfers</span>
            <div className="text-base font-black text-blue-600 font-mono mt-1">
              {summary.credit} Voucher(s)
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Accounting Classification</span>
            <div className="text-base font-black text-slate-800 dark:text-white mt-1">
              Operating OPEX
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-2xs">
            <span className="text-[11px] font-bold text-primary uppercase">Net Financial Impact</span>
            <div className="text-base font-black text-primary font-mono mt-1">
              -Rs. {Number(summary.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </>
      )}

      {activeTab === 'daily-book' && (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Day Opening Cash</span>
            <div className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">
              Rs. {Number(summary.opening).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Total Receipts (Inflow)</span>
            <div className="text-base font-black text-emerald-600 font-mono mt-1">
              Rs. {Number(summary.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-rose-600 uppercase">Total Payments (Outflow)</span>
            <div className="text-base font-black text-rose-600 font-mono mt-1">
              Rs. {Number(summary.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-blue-600 uppercase">Net Flow</span>
            <div className={`text-base font-black font-mono mt-1 ${summary.debit - summary.credit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              Rs. {Number(summary.debit - summary.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-2xs">
            <span className="text-[11px] font-bold text-primary uppercase">Day Closing Cash</span>
            <div className="text-base font-black text-primary font-mono mt-1">
              Rs. {Number(summary.closing).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </>
      )}

      {activeTab === 'daily-activity' && (
        <>
          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Activities</span>
            <div className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">
              {Number(summary.opening).toLocaleString()} <span className="text-xs font-normal text-slate-400">events</span>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Invoiced Sales</span>
            <div className="text-base font-black text-emerald-600 font-mono mt-1">
              Rs. {Number(summary.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Inflows (Receipts)</span>
            <div className="text-base font-black text-blue-600 font-mono mt-1">
              Rs. {Number(summary.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Outflows & Purchases</span>
            <div className="text-base font-black text-purple-600 font-mono mt-1">
              Rs. {Number(summary.closing).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10 shadow-2xs">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Returns / Credits</span>
            <div className="text-base font-black text-rose-600 font-mono mt-1">
              Rs. {Number(summary.returnAmt).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </>
      )}

      {activeTab === 'profit-loss' && pnlData && (
        <>
          {pnlCalculationMode === 'cash' ? (
            <>
              <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-600 uppercase">Total Receipts (Cash In)</span>
                <div className="text-base font-black text-emerald-600 font-mono mt-1">
                  Rs. {Number(pnlData.cashReceipts).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
                <span className="text-[11px] font-bold text-blue-600 uppercase">Vendor Payments (Cash Out)</span>
                <div className="text-base font-black text-blue-600 font-mono mt-1">
                  Rs. {Number(pnlData.cashVendorPayments).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
                <span className="text-[11px] font-bold text-rose-600 uppercase">Total Expenses</span>
                <div className="text-base font-black text-rose-600 font-mono mt-1">
                  Rs. {Number(pnlData.totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
                <span className="text-[11px] font-bold text-purple-600 uppercase">Net Realized Cash Profit</span>
                <div className={`text-base font-black font-mono mt-1 ${pnlData.cashNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Rs. {Number(pnlData.cashNetProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Receivable vs Payable</span>
                <div className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">
                  Rs. {Number(Math.abs(pnlData.customerReceivables - pnlData.periodPayables)).toLocaleString(undefined, { minimumFractionDigits: 2 })} Dr
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-600 uppercase">
                  {pnlIncludeOB ? 'Gross Sales (+OB)' : 'Gross Sales Revenue'}
                </span>
                <div className="text-base font-black text-emerald-600 font-mono mt-1">
                  Rs. {Number(pnlData.periodSales + (pnlIncludeOB ? pnlData.customerOB : 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
                <span className="text-[11px] font-bold text-amber-600 uppercase">Sales Returns</span>
                <div className="text-base font-black text-amber-600 font-mono mt-1">
                  Rs. {Number(pnlData.periodSalesReturns).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
                <span className="text-[11px] font-bold text-blue-600 uppercase">
                  {pnlIncludeOB && pnlData.vendorOB > 0 ? 'COGS (+OB)' : 'Cost of Goods (COGS)'}
                </span>
                <div className="text-base font-black text-blue-600 font-mono mt-1">
                  Rs. {Number(pnlData.periodCogs + (pnlIncludeOB ? pnlData.vendorOB : 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs">
                <span className="text-[11px] font-bold text-rose-600 uppercase">Total Expenses</span>
                <div className="text-base font-black text-rose-600 font-mono mt-1">
                  Rs. {Number(pnlData.totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              {(() => {
                const effProfit = (pnlData.periodNetSales + (pnlIncludeOB ? pnlData.customerOB : 0)) - (pnlData.periodCogs + (pnlIncludeOB ? pnlData.vendorOB : 0)) - pnlData.totalExpenses;
                return (
                  <div className={`p-4 bg-white dark:bg-boxdark rounded-2xl border shadow-2xs ${effProfit >= 0 ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'}`}>
                    <span className={`text-[11px] font-bold uppercase ${effProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      Net Trading Profit
                    </span>
                    <div className={`text-base font-black font-mono mt-1 ${effProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Rs. {Number(effProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </>
      )}
    </div>
  );
};
