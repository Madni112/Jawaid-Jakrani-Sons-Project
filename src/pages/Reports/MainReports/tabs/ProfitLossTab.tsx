import React from 'react';

interface ProfitLossTabProps {
  pnlData: any;
  fromDate?: string;
  toDate?: string;
  pnlBasis: 'accrual' | 'cash';
  setPnlBasis: (basis: 'accrual' | 'cash') => void;
  pnlIncludeOB?: boolean;
  setPnlIncludeOB?: (val: boolean) => void;
  pnlCalculationMode?: string;
  setPnlCalculationMode?: (val: string) => void;
  pnlExpenseFilter?: string;
  setPnlExpenseFilter?: (val: string) => void;
  expandedPnLSections?: Record<string, boolean>;
  togglePnLSection?: (sec: string) => void;
  isGeneratingPdf?: boolean;
}

export const ProfitLossTab: React.FC<ProfitLossTabProps> = ({
  pnlData,
  fromDate,
  toDate,
  pnlBasis,
  setPnlBasis,
  pnlIncludeOB = false,
  setPnlIncludeOB = () => {},
  pnlCalculationMode = 'net',
  setPnlCalculationMode = () => {},
  pnlExpenseFilter = 'all',
  setPnlExpenseFilter = () => {},
  expandedPnLSections = {},
  togglePnLSection = () => {},
  isGeneratingPdf = false,
}) => {
  return (
    <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-2xs p-6 space-y-6 print:border-none print:shadow-none print:rounded-none print:p-0 print:space-y-4">
              {/* Header with Title and View Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stroke dark:border-strokedark pb-4 print:border-b-2 print:border-slate-800">
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Income Statement (Profit & Loss)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Duration Window: {fromDate} to {toDate}
                  </p>
                </div>

                {/* Calculation Mode Switcher & Opening Balance Toggle (Hidden in Print) */}
                <div className="flex flex-wrap items-center gap-2.5 print:hidden">
                  <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 border border-stroke dark:border-strokedark">
                    <button
                      type="button"
                      onClick={() => setPnlBasis('accrual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        pnlBasis === 'accrual'
                          ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Trading Profit (Accrual)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPnlBasis('cash')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        pnlBasis === 'cash'
                          ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Realized Profit (Cash & Bank)
                    </button>
                  </div>

                  <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-stroke dark:border-strokedark">
                    <button
                      type="button"
                      onClick={() => setPnlIncludeOB(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        !pnlIncludeOB
                          ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Exclude Opening Balances
                    </button>
                    <button
                      type="button"
                      onClick={() => setPnlIncludeOB(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        pnlIncludeOB
                          ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      Include Opening Balances
                    </button>
                  </div>
                </div>
              </div>

              {/* ── ACCRUAL BASIS STATEMENT ── */}
              {pnlBasis === 'accrual' && (() => {
                const effGrossSales = pnlData.periodSales + (pnlIncludeOB ? pnlData.customerOB : 0);
                const effCOGS = pnlData.periodCogs + (pnlIncludeOB ? pnlData.vendorOB : 0);
                const effNetSales = Math.max(0, effGrossSales - pnlData.periodSalesReturns);
                const effGrossProfit = effNetSales - effCOGS;
                const effNetProfit = effGrossProfit - pnlData.totalExpenses;

                return (
                  <div className="space-y-4 max-w-3xl font-mono text-xs">
                    {/* Sales Section */}
                    <div className="space-y-2 border-b border-stroke dark:border-strokedark pb-3">
                      {pnlIncludeOB && (
                        <div className="flex justify-between items-center text-purple-600 pl-2 text-[11px]">
                          <span>Customer Opening Balance (Prior Sales)</span>
                          <span>Rs. {Number(pnlData.customerOB).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-slate-800 dark:text-white font-bold">
                        <span>{pnlIncludeOB ? 'Total Gross Sales Revenue (SAV + Invoices + OB)' : 'Gross Sales Revenue (SAV & Invoices)'}</span>
                        <span>Rs. {Number(effGrossSales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-amber-600 pl-4 text-[11px]">
                        <span>Less: Sales Returns (SRV)</span>
                        <span>(Rs. {Number(pnlData.periodSalesReturns).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                      </div>
                      <div className="flex justify-between items-center font-black text-primary border-t border-dashed border-stroke dark:border-strokedark pt-2">
                        <span>Net Sales Turnover</span>
                        <span>Rs. {Number(effNetSales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* COGS Section */}
                    <div className="space-y-2 border-b border-stroke dark:border-strokedark pb-3">
                      {pnlIncludeOB && pnlData.vendorOB > 0 && (
                        <div className="flex justify-between items-center text-purple-600 pl-2 text-[11px]">
                          <span>Vendor Opening Balance (Prior Purchases)</span>
                          <span>Rs. {Number(pnlData.vendorOB).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-slate-800 dark:text-white font-bold">
                        <span>Cost of Goods Sold (Purchases / Material)</span>
                        <span className="text-rose-600">(Rs. {Number(effCOGS).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                      </div>
                      <div className="flex justify-between items-center font-black text-emerald-600 border-t border-dashed border-stroke dark:border-strokedark pt-2">
                        <span>Gross Profit (Trading Profit)</span>
                        <span>Rs. {Number(effGrossProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Operating Expenses Section */}
                    <div className="space-y-2 border-b border-stroke dark:border-strokedark pb-3">
                      <span className="block font-bold text-slate-800 dark:text-white mb-2">Operating Expenses:</span>
                      {Object.entries(pnlData.expenseMap).length === 0 ? (
                        <div className="text-slate-400 italic pl-4">No operational expenses recorded in this period.</div>
                      ) : (
                        Object.entries(pnlData.expenseMap).map(([head, amt]) => (
                          <div key={head} className="flex justify-between items-center text-slate-600 dark:text-slate-300 pl-4 text-[11px]">
                            <span>{head}</span>
                            <span>Rs. {Number(amt).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))
                      )}
                      <div className="flex justify-between items-center font-bold text-rose-600 border-t border-dashed border-stroke dark:border-strokedark pt-2">
                        <span>Total Operating Expenses</span>
                        <span>(Rs. {Number(pnlData.totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                      </div>
                    </div>

                    {/* Net Trading Profit */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-stroke dark:border-strokedark flex justify-between items-center text-sm font-black">
                      <span className="text-slate-900 dark:text-white">Net Trading Profit / (Loss) for the Period</span>
                      <span className={effNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        Rs. {Number(effNetProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* ── CASH & BANK BASIS (REALIZED LIQUID PROFIT) STATEMENT ── */}
              {pnlBasis === 'cash' && (
                <div className="space-y-4 max-w-3xl font-mono text-xs">
                  <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-300 text-[11px] font-medium">
                    💡 <strong>Realized Pocket Profit:</strong> Measures actual liquid funds collected from customers (Cash + Bank / Wallets) minus payments made to vendors and operational expenses paid. Credit receivables (udhaar) are not counted until collected.
                  </div>

                  <div className="space-y-2 border-b border-stroke dark:border-strokedark pb-3">
                    <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                      <span>1. Cash & Bank Recovered from Customers (Receipts & Invoices Paid)</span>
                      <span>Rs. {Number(pnlData.cashFromCustomers).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-600 pl-4 text-[11px]">
                      <span>Less: Paid to Suppliers / Vendors (Cash & Bank Outflows)</span>
                      <span>(Rs. {Number(pnlData.cashPaidToVendors).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                    </div>
                    <div className="flex justify-between items-center font-black text-primary border-t border-dashed border-stroke dark:border-strokedark pt-2">
                      <span>Net Cash & Bank Generated from Trading</span>
                      <span>Rs. {Number(pnlData.cashFromCustomers - pnlData.cashPaidToVendors).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-b border-stroke dark:border-strokedark pb-3">
                    <span className="block font-bold text-slate-800 dark:text-white mb-2">Operating Expenses Paid (Cash / Bank):</span>
                    {Object.entries(pnlData.expenseMap).length === 0 ? (
                      <div className="text-slate-400 italic pl-4">No operational expenses paid in this period.</div>
                    ) : (
                      Object.entries(pnlData.expenseMap).map(([head, amt]) => (
                        <div key={head} className="flex justify-between items-center text-slate-600 dark:text-slate-300 pl-4 text-[11px]">
                          <span>{head}</span>
                          <span>Rs. {Number(amt).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between items-center font-bold text-rose-600 border-t border-dashed border-stroke dark:border-strokedark pt-2">
                      <span>Total Operating Expenses Paid</span>
                      <span>(Rs. {Number(pnlData.totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-stroke dark:border-strokedark flex justify-between items-center text-sm font-black">
                    <span className="text-slate-900 dark:text-white">Net Realized Profit / (Loss) [Cash & Bank]</span>
                    <span className={pnlData.netCashProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      Rs. {Number(pnlData.netCashProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* ── MARKET NET OUTSTANDING POSITION (RECEIVABLES - PAYABLES) ── */}
              {(() => {
                const displayReceivables = pnlIncludeOB ? pnlData.totalReceivables : (pnlData.periodReceivables ?? (pnlData.periodSales - pnlData.periodSalesReturns - pnlData.cashFromCustomers));
                const displayPayables = pnlIncludeOB ? pnlData.totalPayables : (pnlData.periodPayables ?? (pnlData.periodCogs - pnlData.cashPaidToVendors));
                const displayNetMarket = displayReceivables - displayPayables;

                const hasPriorOB = (pnlData.priorCustomerOB || 0) > 0 || (pnlData.priorVendorOB || 0) > 0;
                const hasInPeriodOB = (pnlData.inPeriodCustomerOB || 0) > 0 || (pnlData.inPeriodVendorOB || 0) > 0;

                const periodSubtitle = pnlIncludeOB
                  ? 'Includes Prior Opening Balances (Cumulative as of ' + (toDate || 'End Date') + ')'
                  : hasInPeriodOB
                    ? 'Strict Date Period (Includes In-Period Opening Balances)'
                    : hasPriorOB
                      ? 'Strict Date Period (Excludes Prior Opening Balances)'
                      : 'Strict Date Period';

                return (
                  <div className="max-w-3xl mt-6 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-stroke dark:border-strokedark space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-stroke dark:border-strokedark">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>📊</span>
                        <span>{pnlIncludeOB ? `Cumulative Market Standing (As of ${toDate || 'End Date'})` : `Period Market Standing (${fromDate || 'Start'} to ${toDate || 'End'})`}</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {periodSubtitle}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="bg-white dark:bg-boxdark p-3 rounded-xl border border-stroke dark:border-strokedark">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Customer Receivables</span>
                        <div className="text-sm font-black text-emerald-600 mt-1">
                          Rs. {Number(displayReceivables).toLocaleString(undefined, { minimumFractionDigits: 2 })} Dr
                        </div>
                        <span className="text-[9px] text-slate-400">
                          {pnlIncludeOB ? 'All-time market se lena (Asset)' : hasInPeriodOB ? 'Includes in-period opening balances + sales' : 'Period net receivables (Asset)'}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-boxdark p-3 rounded-xl border border-stroke dark:border-strokedark">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Vendor Payables</span>
                        <div className="text-sm font-black text-amber-600 mt-1">
                          Rs. {Number(displayPayables).toLocaleString(undefined, { minimumFractionDigits: 2 })} Cr
                        </div>
                        <span className="text-[9px] text-slate-400">
                          {pnlIncludeOB ? 'All-time suppliers ko dena (Liability)' : 'Period net payables (Liability)'}
                        </span>
                      </div>

                      <div className="bg-white dark:bg-boxdark p-3 rounded-xl border border-primary/30 shadow-2xs">
                        <span className="text-[10px] font-bold text-primary uppercase block">3. Net Market Position</span>
                        <div className="text-sm font-black text-primary mt-1">
                          Rs. {Number(Math.abs(displayNetMarket)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {displayNetMarket >= 0 ? 'Dr (Net Asset)' : 'Cr (Net Liability)'}
                        </div>
                        <span className="text-[9px] text-slate-500">
                          {displayNetMarket >= 0 ? 'Market Surplus Position' : 'Market Liability Position'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
  );
};
