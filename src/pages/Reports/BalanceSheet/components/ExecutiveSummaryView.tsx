import React from 'react';
import {
  MdAccountBalanceWallet,
  MdTrendingUp,
  MdShoppingBag,
  MdInventory,
  MdCompareArrows,
  MdPieChart,
  MdShowChart,
  MdAccountBalance,
} from 'react-icons/md';
import { FinancialSummary } from '../../../../service/financialCalculations';

interface ExecutiveSummaryViewProps {
  metrics: FinancialSummary;
}

export const ExecutiveSummaryView: React.FC<ExecutiveSummaryViewProps> = ({ metrics }) => {
  const netLiquidFunds = (metrics.cashBalance || 0) + (metrics.totalBankBalance || 0);
  const netReceivablePayableSpread = (metrics.totalReceivables || 0) - (metrics.totalPayables || 0);

  const assetsVal = metrics.totalAssets || 1;
  const liabPct = Math.min(100, Math.round(((metrics.totalLiabilities || 0) / assetsVal) * 100));
  const equityPct = Math.max(0, 100 - liabPct);

  return (
    <div className="space-y-6">
      {/* 📊 6 Executive KPI Briefing Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Liquid Funds */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Liquid Cash &amp; Bank Pool
              </span>
              <h3 className="text-lg font-black font-mono text-emerald-950 dark:text-emerald-100 mt-1">
                Rs. {Number(netLiquidFunds).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="p-2 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl">
              <MdAccountBalanceWallet size={20} />
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex justify-between text-[11px] font-mono text-emerald-900 dark:text-emerald-200">
            <span>
              Cash Drawer: <b>Rs. {Number(metrics.cashBalance || 0).toLocaleString()}</b>
            </span>
            <span>
              Banks: <b>Rs. {Number(metrics.totalBankBalance || 0).toLocaleString()}</b>
            </span>
          </div>
        </div>

        {/* Card 2: Sales Performance */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Month-to-Date Sales (MTD)
              </span>
              <h3 className="text-lg font-black font-mono text-blue-950 dark:text-blue-100 mt-1">
                Rs. {Number(metrics.thisMonthSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="p-2 bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-xl">
              <MdTrendingUp size={20} />
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-blue-500/20 flex justify-between text-[11px] font-mono text-blue-900 dark:text-blue-200">
            <span>
              Today's Billing: <b>Rs. {Number(metrics.todaysSales || 0).toLocaleString()}</b>
            </span>
            <span className="text-emerald-600 font-bold">Active Stream</span>
          </div>
        </div>

        {/* Card 3: Procurement Outlay */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                Month Procurement Purchases
              </span>
              <h3 className="text-lg font-black font-mono text-indigo-950 dark:text-indigo-100 mt-1">
                Rs. {Number(metrics.thisMonthPurchases || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="p-2 bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl">
              <MdShoppingBag size={20} />
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-indigo-500/20 flex justify-between text-[11px] font-mono text-indigo-900 dark:text-indigo-200">
            <span>Procurement Outflow</span>
            <span className="font-bold text-indigo-700">Vendor Bills</span>
          </div>
        </div>

        {/* Card 4: Inventory Asset Valuation */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300">
                Merchandise Inventory Valuation
              </span>
              <h3 className="text-lg font-black font-mono text-purple-950 dark:text-purple-100 mt-1">
                Rs. {Number(metrics.inventoryAssetValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="p-2 bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-xl">
              <MdInventory size={20} />
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-purple-500/20 flex justify-between text-[11px] font-mono text-purple-900 dark:text-purple-200">
            <span>Opening: Rs. {Number(metrics.monthOpeningStockValue || 0).toLocaleString()}</span>
            <span>
              Net Move: {metrics.thisMonthStockMovement >= 0 ? '+' : ''}
              {Number(metrics.thisMonthStockMovement || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 5: Credit Spread (Receivables vs Payables) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Net Working Capital Spread
              </span>
              <h3 className="text-lg font-black font-mono text-amber-950 dark:text-amber-100 mt-1">
                Rs. {Number(netReceivablePayableSpread).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="p-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-xl">
              <MdCompareArrows size={20} />
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex justify-between text-[11px] font-mono text-amber-900 dark:text-amber-200">
            <span>
              Rec: <b>Rs. {Number(metrics.totalReceivables || 0).toLocaleString()}</b>
            </span>
            <span>
              Pay: <b>Rs. {Number(metrics.totalPayables || 0).toLocaleString()}</b>
            </span>
          </div>
        </div>

        {/* Card 6: Total Commercial Net Worth (Equity) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent p-4 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Total Net Owner Equity
              </span>
              <h3 className="text-lg font-black font-mono text-teal-950 dark:text-teal-100 mt-1">
                Rs. {Number(metrics.totalEquity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="p-2 bg-teal-500/20 text-teal-700 dark:text-teal-300 rounded-xl">
              <MdPieChart size={20} />
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-teal-500/20 flex justify-between text-[11px] font-mono text-teal-900 dark:text-teal-200">
            <span>
              Solvency: <b>{equityPct}% Equity</b>
            </span>
            <span>
              Liab: <b>{liabPct}%</b>
            </span>
          </div>
        </div>
      </div>

      {/* 📈 6-Month Commercial Trajectory Table & Trends */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MdShowChart className="text-emerald-600" size={20} />
            6-Month Revenue &amp; Procurement Trajectory
          </h3>
          <span className="text-[11px] font-bold text-gray-500 font-mono">Monthly Trend Comparative</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                <th className="p-2 border border-black text-center w-12">S#</th>
                <th className="p-2 border border-black">Month</th>
                <th className="p-2 border border-black text-right">Sales Revenue (Rs.)</th>
                <th className="p-2 border border-black text-right">Procurement Purchases (Rs.)</th>
                <th className="p-2 border border-black text-right">Net Operating Margin (Rs.)</th>
                <th className="p-2 border border-black text-center">Performance Indicator</th>
              </tr>
            </thead>
            <tbody>
              {(metrics.monthlySalesTrend || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 italic text-gray-400 border border-black">
                    No monthly history recorded yet.
                  </td>
                </tr>
              ) : (
                (metrics.monthlySalesTrend || []).map((tr, idx) => {
                  const netMargin = tr.sales - tr.purchases;
                  const isPositive = netMargin >= 0;
                  return (
                    <tr
                      key={idx}
                      className="border-b border-black font-mono text-xs hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-2 border border-black text-center font-bold text-gray-600">{idx + 1}</td>
                      <td className="p-2 border border-black font-bold font-sans text-gray-900">{tr.month}</td>
                      <td className="p-2 border border-black text-right font-bold text-blue-900">
                        Rs. {Number(tr.sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-right font-bold text-indigo-900">
                        Rs. {Number(tr.purchases || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`p-2 border border-black text-right font-black ${
                          isPositive ? 'text-emerald-700 bg-emerald-50/40' : 'text-rose-700 bg-rose-50/40'
                        }`}
                      >
                        Rs. {Number(netMargin).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 border border-black text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPositive ? 'Surplus Positive ▲' : 'Deficit Outflow ▼'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 border-t-2 border-black font-black text-black text-xs font-mono">
                <td colSpan={2} className="p-2.5 border border-black text-right uppercase font-sans">
                  Trailing 6-Month Aggregate:
                </td>
                <td className="p-2.5 border border-black text-right text-blue-900">
                  Rs.{' '}
                  {(metrics.monthlySalesTrend || [])
                    .reduce((s, r) => s + Number(r.sales || 0), 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2.5 border border-black text-right text-indigo-900">
                  Rs.{' '}
                  {(metrics.monthlySalesTrend || [])
                    .reduce((s, r) => s + Number(r.purchases || 0), 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2.5 border border-black text-right text-emerald-950 bg-emerald-100 font-bold">
                  Rs.{' '}
                  {(metrics.monthlySalesTrend || [])
                    .reduce((s, r) => s + (Number(r.sales || 0) - Number(r.purchases || 0)), 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2.5 border border-black text-center font-sans text-[10px] text-gray-700">
                  Cumulative Summary
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 🏦 Bank Accounts Portfolio Ledger Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MdAccountBalance className="text-teal-600" size={20} />
            Corporate Bank Accounts &amp; Liquidity Distribution
          </h3>
          <span className="text-[11px] font-bold text-gray-500 font-mono">
            {(metrics.bankAccounts || []).length} Active Bank Ledgers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans text-left print:w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                <th className="p-2 border border-black text-center w-12">S#</th>
                <th className="p-2 border border-black">Bank Name</th>
                <th className="p-2 border border-black">Account Title &amp; Details</th>
                <th className="p-2 border border-black text-right">Total Deposits Inflow (Rs.)</th>
                <th className="p-2 border border-black text-right">Total Withdrawals Outflow (Rs.)</th>
                <th className="p-2 border border-black text-right bg-teal-50">Net Active Balance (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {!metrics.bankAccounts || metrics.bankAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 italic text-gray-400 border border-black">
                    No corporate bank accounts logged.
                  </td>
                </tr>
              ) : (
                metrics.bankAccounts.map((b, idx) => (
                  <tr
                    key={b.id || idx}
                    className="border-b border-black font-mono text-xs hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-2 border border-black text-center font-bold text-gray-600">{idx + 1}</td>
                    <td className="p-2 border border-black font-bold font-sans text-gray-900">🏦 {b.bankName}</td>
                    <td className="p-2 border border-black font-mono text-gray-700">
                      {b.accountTitle} {b.accountNumber ? `(A/C: ${b.accountNumber})` : ''}
                    </td>
                    <td className="p-2 border border-black text-right text-emerald-700">
                      Rs.{' '}
                      {Number(b.totalInflow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right text-rose-700">
                      Rs.{' '}
                      {Number(b.totalOutflow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 border border-black text-right font-black text-teal-900 bg-teal-50/50">
                      Rs. {Number(b.netBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 border-t-2 border-black font-black text-black text-xs font-mono">
                <td colSpan={3} className="p-2.5 border border-black text-right uppercase font-sans">
                  Total Corporate Bank Holdings:
                </td>
                <td className="p-2.5 border border-black text-right text-emerald-800">
                  Rs.{' '}
                  {(metrics.bankAccounts || [])
                    .reduce((s, b) => s + Number(b.totalInflow || 0), 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2.5 border border-black text-right text-rose-800">
                  Rs.{' '}
                  {(metrics.bankAccounts || [])
                    .reduce((s, b) => s + Number(b.totalOutflow || 0), 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2.5 border border-black text-right text-teal-950 bg-teal-100 font-black">
                  Rs.{' '}
                  {Number(metrics.totalBankBalance || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummaryView;
