import React from 'react';

export interface ActivitySummaryData {
  totalEvents: number;
  totalSales: number;
  totalPurchases: number;
  cashReceived: number;
  cashPaid: number;
  expenses: number;
  salesReturns: number;
  purchaseReturns: number;
}

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
  activitySummary?: ActivitySummaryData;
}

export const MainReportsMetrics: React.FC<MainReportsMetricsProps> = ({
  activeTab,
  summary,
  pnlData,
  pnlCalculationMode,
  pnlIncludeOB,
  activitySummary
}) => {
  if (activeTab === 'daily-activity') {
    const act = activitySummary || {
      totalEvents: summary?.opening || 0,
      totalSales: summary?.debit || 0,
      totalPurchases: 0,
      cashReceived: summary?.credit || 0,
      cashPaid: 0,
      expenses: 0,
      salesReturns: 0,
      purchaseReturns: 0
    };

    const netCash = (act.cashReceived || 0) - ((act.cashPaid || 0) + (act.expenses || 0));

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 print:hidden">
        {/* Row 1: 4 Cards */}
        {/* 1. Total Activities */}
        <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs hover:shadow-xs transition-shadow">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Activities</span>
          <div className="text-base font-black text-slate-800 dark:text-white font-mono mt-1">
            {Number(act.totalEvents || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">events</span>
          </div>
        </div>

        {/* 2. Total Sales */}
        <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs hover:shadow-xs transition-shadow">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Sales</span>
          <div className="text-base font-black text-emerald-600 font-mono mt-1">
            Rs. {Number(act.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* 3. Total Purchases */}
        <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs hover:shadow-xs transition-shadow">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Total Purchases</span>
          <div className="text-base font-black text-indigo-600 font-mono mt-1">
            Rs. {Number(act.totalPurchases || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* 4. Cash Received */}
        <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs hover:shadow-xs transition-shadow">
          <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Cash Received</span>
          <div className="text-base font-black text-teal-600 font-mono mt-1">
            Rs. {Number(act.cashReceived || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Row 2: 4 Cards */}
        {/* 5. Cash Paid */}
        <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs hover:shadow-xs transition-shadow">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Cash Paid</span>
          <div className="text-base font-black text-rose-600 font-mono mt-1">
            Rs. {Number(act.cashPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* 6. Expense */}
        <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs hover:shadow-xs transition-shadow">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Expense</span>
          <div className="text-base font-black text-amber-600 font-mono mt-1">
            Rs. {Number(act.expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* 7. Sales Returns */}
        <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs hover:shadow-xs transition-shadow">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Sales Returns</span>
          <div className="text-base font-black text-rose-600 font-mono mt-1">
            Rs. {Number(act.salesReturns || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* 8. Purchase Returns */}
        <div className="p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs hover:shadow-xs transition-shadow">
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">Purchase Returns</span>
          <div className="text-base font-black text-orange-600 font-mono mt-1">
            Rs. {Number(act.purchaseReturns || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Row 3: Net Cash Flow Status Bar */}
        <div className={`col-span-full p-3.5 rounded-2xl border shadow-2xs flex flex-wrap items-center justify-between gap-3 ${
          netCash >= 0
            ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
            : 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${netCash >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${netCash >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                Net Operating Cash Position (Cash Received − Cash Paid − Expense)
              </span>
              <div className={`text-base font-black font-mono ${netCash >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                Rs. {Number(Math.abs(netCash)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                <span className="text-xs font-semibold ml-2 opacity-85">
                  {netCash >= 0 ? '(Operating Cash Surplus)' : '(Operating Cash Deficit)'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <span className="text-teal-700 dark:text-teal-400">Cash In: Rs. {Number(act.cashReceived || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-rose-700 dark:text-rose-400">Cash Out &amp; Exp: Rs. {Number((act.cashPaid || 0) + (act.expenses || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    );
  }

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
