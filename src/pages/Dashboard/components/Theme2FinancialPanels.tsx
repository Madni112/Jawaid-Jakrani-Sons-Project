import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { LuCreditCard, LuArrowUpRight, LuArrowDownLeft } from 'react-icons/lu';
import { MdTrendingUp, MdTrendingDown } from 'react-icons/md';

interface Theme2FinancialPanelsProps {
  metrics: any;
  setActiveBreakdownModal: (modal: 'cash' | 'bank' | 'receivables' | 'payables' | 'stock' | null) => void;
}

export const Theme2FinancialPanels: React.FC<Theme2FinancialPanelsProps> = ({
  metrics,
  setActiveBreakdownModal,
}) => {
  const hasMonthlyTrend = Boolean(metrics?.monthlySalesTrend && metrics.monthlySalesTrend.length > 0);
  const monthlyCategories = hasMonthlyTrend ? metrics.monthlySalesTrend.map((m: any) => m.month) : ['Jan', 'Feb', 'Mar'];
  const grossSalesData = hasMonthlyTrend ? metrics.monthlySalesTrend.map((m: any) => m.sales) : [0, 0, 0];
  const procurementData = hasMonthlyTrend ? metrics.monthlySalesTrend.map((m: any) => m.purchases) : [0, 0, 0];

  return (
    <>
          {/* 4 Financial Metric Cards (Amal Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CASH */}
            <div
              onClick={() => setActiveBreakdownModal('cash')}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between border-b-2 border-b-cyan-400 cursor-pointer hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center font-bold text-sm mb-3">
                $
              </div>
              <div>
                <div className={`text-xl font-extrabold ${metrics.cashBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {metrics.cashBalance < 0
                    ? `-Rs.${Math.abs(metrics.cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `Rs.${metrics.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  CASH
                </div>
              </div>
            </div>

            {/* BANK */}
            <div
              onClick={() => setActiveBreakdownModal('bank')}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between border-b-2 border-b-emerald-400 cursor-pointer hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold text-sm mb-3">
                <LuCreditCard size={16} />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Rs.{metrics.totalBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  BANK
                </div>
              </div>
            </div>

            {/* RECEIVABLE */}
            <div
              onClick={() => setActiveBreakdownModal('receivables')}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between border-b-2 border-b-amber-400 cursor-pointer hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold text-sm mb-3">
                <LuArrowDownLeft size={16} />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Rs.{metrics.totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  RECEIVABLE
                </div>
              </div>
            </div>

            {/* PAYABLE */}
            <div
              onClick={() => setActiveBreakdownModal('payables')}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between border-b-2 border-b-rose-400 cursor-pointer hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold text-sm mb-3">
                <LuArrowUpRight size={16} />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Rs.{metrics.totalPayables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  PAYABLE
                </div>
              </div>
            </div>
          </div>

          {/* 4 Analytical Panels (Amal Style) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Money Position */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs min-h-[190px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center text-xs">
                    📈
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Money Position</h3>
                    <p className="text-[11px] text-slate-400">Cash and bank, month by month</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Total: Rs. {(metrics.cashBalance + metrics.totalBankBalance).toLocaleString()}
                </span>
              </div>
              {hasMonthlyTrend ? (
                <div className="mt-2 -mb-2">
                  <ReactApexChart
                    options={{
                      chart: { type: 'area', height: 140, sparkline: { enabled: false }, toolbar: { show: false } },
                      colors: ['#059669', '#0284C7'],
                      stroke: { curve: 'smooth', width: 2 },
                      dataLabels: { enabled: false },
                      xaxis: { categories: monthlyCategories, labels: { style: { colors: '#94A3B8', fontSize: '9px' } } },
                      yaxis: { labels: { formatter: (val: number) => `Rs.${(val / 1000).toFixed(0)}k`, style: { colors: '#94A3B8', fontSize: '9px' } } },
                      tooltip: { y: { formatter: (val: number) => `Rs. ${Number(val || 0).toLocaleString()}` } },
                      legend: { position: 'top', horizontalAlign: 'right', fontSize: '10px' }
                    }}
                    series={[
                      { name: 'Cash Flow Inflow', data: metrics.cashFlowTrend ? metrics.cashFlowTrend.map(c => c.inflow) : [metrics.cashBalance] },
                      { name: 'Net Bank Liquidity', data: monthlyCategories.map(() => metrics.totalBankBalance) }
                    ]}
                    type="area"
                    height={140}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  <div className="flex items-center gap-4 text-center">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Cash in Hand</span>
                      <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">Rs. {metrics.cashBalance.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Bank Accounts</span>
                      <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">Rs. {metrics.totalBankBalance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Owed to you vs owed by you */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs min-h-[190px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center text-xs">
                    ⏱️
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Owed to you vs owed by you</h3>
                    <p className="text-[11px] text-slate-400">Settlement clearance & pending balances</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                  (metrics.totalReceivables - metrics.totalPayables) >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                }`}>
                  Net: Rs. {(metrics.totalReceivables - metrics.totalPayables).toLocaleString()}
                </span>
              </div>
              {(() => {
                const totalGrossCust = Number(metrics.totalGrossReceivables || metrics.totalReceivables || 0);
                const custDue = Number(metrics.totalReceivables || 0);
                const custRecovered = Number(metrics.totalCustomerRecovered !== undefined ? metrics.totalCustomerRecovered : Math.max(0, totalGrossCust - custDue));
                const custRecoveredPct = totalGrossCust > 0 ? Math.round((custRecovered / totalGrossCust) * 100) : (custDue === 0 ? 100 : 0);
                const custPendingPct = Math.max(0, 100 - custRecoveredPct);

                const totalGrossVend = Number(metrics.totalGrossPayables || metrics.totalPayables || 0);
                const vendDue = Number(metrics.totalPayables || 0);
                const vendPaid = Number(metrics.totalVendorDisbursed !== undefined ? metrics.totalVendorDisbursed : Math.max(0, totalGrossVend - vendDue));
                const vendPaidPct = totalGrossVend > 0 ? Math.round((vendPaid / totalGrossVend) * 100) : (vendDue === 0 ? 100 : 0);
                const vendPendingPct = Math.max(0, 100 - vendPaidPct);

                const hasData = totalGrossCust > 0 || totalGrossVend > 0 || custDue > 0 || vendDue > 0;

                return hasData ? (
                  <div className="flex-1 flex flex-col justify-center py-2 space-y-3.5">
                    {/* 1. Customer Receivables */}
                    <div>
                      <div className="flex justify-between items-baseline text-xs mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          Receivable from Customers
                        </span>
                        <div className="text-right">
                          <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                            Rs. {custDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] font-semibold text-rose-500 dark:text-rose-400 ml-1">Due</span>
                        </div>
                      </div>

                      {/* Dual-Tone Bar (Green = Recovered, Amber = Pending Due) */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                        {custRecoveredPct > 0 && (
                          <div
                            className="bg-emerald-500 h-2 transition-all duration-500"
                            style={{ width: `${custRecoveredPct}%` }}
                            title={`Recovered: Rs. ${custRecovered.toLocaleString()} (${custRecoveredPct}%)`}
                          />
                        )}
                        <div
                          className="bg-amber-400 h-2 transition-all duration-500"
                          style={{ width: `${custPendingPct}%` }}
                          title={`Pending Due: Rs. ${custDue.toLocaleString()} (${custPendingPct}%)`}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-0.5">
                        <span>Total Billed: <strong className="text-slate-600 dark:text-slate-300 font-mono">Rs. {totalGrossCust.toLocaleString()}</strong></span>
                        <span>Recovered: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{custRecoveredPct}%</strong> (Rs. {custRecovered.toLocaleString()})</span>
                      </div>
                    </div>

                    {/* 2. Vendor Payables */}
                    <div>
                      <div className="flex justify-between items-baseline text-xs mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          Payable to Vendors & Mills
                        </span>
                        <div className="text-right">
                          <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                            Rs. {vendDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] font-semibold text-rose-500 dark:text-rose-400 ml-1">Due</span>
                        </div>
                      </div>

                      {/* Dual-Tone Bar (Green = Cleared, Rose = Pending Due) */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                        {vendPaidPct > 0 && (
                          <div
                            className="bg-emerald-500 h-2 transition-all duration-500"
                            style={{ width: `${vendPaidPct}%` }}
                            title={`Paid / Cleared: Rs. ${vendPaid.toLocaleString()} (${vendPaidPct}%)`}
                          />
                        )}
                        <div
                          className="bg-rose-500 h-2 transition-all duration-500"
                          style={{ width: `${vendPendingPct}%` }}
                          title={`Pending Due: Rs. ${vendDue.toLocaleString()} (${vendPendingPct}%)`}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-0.5">
                        <span>Total Liability: <strong className="text-slate-600 dark:text-slate-300 font-mono">Rs. {totalGrossVend.toLocaleString()}</strong></span>
                        <span>Cleared: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{vendPaidPct}%</strong> (Rs. {vendPaid.toLocaleString()})</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center py-6">
                    Nothing outstanding either way.
                  </div>
                );
              })()}
            </div>

            {/* Sales vs Recovery */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs min-h-[190px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-500 flex items-center justify-center text-xs">
                    🔄
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Sales vs Recovery</h3>
                    <p className="text-[11px] text-slate-400">Monthly recovery against billing</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                  This Month: Rs. {metrics.thisMonthSales.toLocaleString()}
                </span>
              </div>
              {hasMonthlyTrend ? (
                <div className="mt-2 -mb-2">
                  <ReactApexChart
                    options={{
                      chart: { type: 'bar', height: 140, toolbar: { show: false } },
                      colors: ['#0D9488', '#F59E0B'],
                      plotOptions: { bar: { columnWidth: '40%', borderRadius: 3 } },
                      dataLabels: { enabled: false },
                      xaxis: { categories: monthlyCategories, labels: { style: { colors: '#94A3B8', fontSize: '9px' } } },
                      yaxis: { labels: { formatter: (val: number) => `Rs.${(val / 1000).toFixed(0)}k`, style: { colors: '#94A3B8', fontSize: '9px' } } },
                      tooltip: { y: { formatter: (val: number) => `Rs. ${Number(val || 0).toLocaleString()}` } },
                      legend: { position: 'top', horizontalAlign: 'right', fontSize: '10px' }
                    }}
                    series={[
                      { name: 'Monthly Gross Sales', data: grossSalesData },
                      { name: 'Monthly Collections / Inflow', data: metrics.cashFlowTrend ? metrics.cashFlowTrend.map(c => c.inflow) : [metrics.thisMonthCashInflow] }
                    ]}
                    type="bar"
                    height={140}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  <div className="flex items-center gap-4 text-center">
                    <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-100 dark:border-teal-900/50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Invoiced</span>
                      <span className="text-sm font-black font-mono text-teal-600 dark:text-teal-400">Rs. {metrics.thisMonthSales.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Recovered</span>
                      <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">Rs. {metrics.thisMonthCashInflow.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sales vs Expense */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs min-h-[190px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs">
                    📊
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Sales vs Expense</h3>
                    <p className="text-[11px] text-slate-400">Revenue against procurement velocity</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  Purchases: Rs. {metrics.thisMonthPurchases.toLocaleString()}
                </span>
              </div>
              {hasMonthlyTrend ? (
                <div className="mt-2 -mb-2">
                  <ReactApexChart
                    options={{
                      chart: { type: 'line', height: 140, toolbar: { show: false } },
                      colors: ['#4F46E5', '#E11D48'],
                      stroke: { width: [3, 2], curve: 'smooth' },
                      dataLabels: { enabled: false },
                      xaxis: { categories: monthlyCategories, labels: { style: { colors: '#94A3B8', fontSize: '9px' } } },
                      yaxis: { labels: { formatter: (val: number) => `Rs.${(val / 1000).toFixed(0)}k`, style: { colors: '#94A3B8', fontSize: '9px' } } },
                      tooltip: { y: { formatter: (val: number) => `Rs. ${Number(val || 0).toLocaleString()}` } },
                      legend: { position: 'top', horizontalAlign: 'right', fontSize: '10px' }
                    }}
                    series={[
                      { name: 'Revenue (Sales)', data: grossSalesData },
                      { name: 'Procurement (Expense)', data: procurementData }
                    ]}
                    type="line"
                    height={140}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  <div className="flex items-center gap-4 text-center">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Sales (Revenue)</span>
                      <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">Rs. {metrics.thisMonthSales.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Procurement</span>
                      <span className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">Rs. {metrics.thisMonthPurchases.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

    </>
  );
};

export default Theme2FinancialPanels;
