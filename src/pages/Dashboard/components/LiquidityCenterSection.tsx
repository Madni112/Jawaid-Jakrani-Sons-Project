import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import { MdAccountBalance, MdAccountBalanceWallet } from 'react-icons/md';

interface LiquidityCenterSectionProps {
  metrics: any;
  liquidityTab: 'bank' | 'cash';
  setLiquidityTab: (tab: 'bank' | 'cash') => void;
  bankDonutOptions: any;
  bankDonutSeries: number[];
  cashTransactions: any[];
}

export const LiquidityCenterSection: React.FC<LiquidityCenterSectionProps> = ({
  metrics,
  liquidityTab,
  setLiquidityTab,
  bankDonutOptions,
  bankDonutSeries,
  cashTransactions,
}) => {
  const navigate = useNavigate();

  return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bank Allocation Donut Chart (4 cols) */}
        <div className="lg:col-span-4 relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs hover:shadow-xs p-5 sm:p-6 flex flex-col justify-between overflow-hidden transition-all duration-200 group">
          {/* Linear Cyan Accent Notch */}
          <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-cyan-500 shadow-xs transition-all duration-200 group-hover:w-2" />

          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3 pl-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 border border-cyan-200/70 dark:border-cyan-800/60 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <MdAccountBalance size={18} />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Bank Balance
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    Distribution across corporate liquid accounts
                  </p>
                </div>
              </div>
            </div>
            <ReactApexChart options={bankDonutOptions} series={bankDonutSeries} type="donut" height={260} />
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-2 font-medium">
            Net Liquid Reserves: <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">Rs. {(metrics.totalBankBalance + metrics.cashBalance).toLocaleString()}</span>
          </div>
        </div>

        {/* Liquid Ledgers (Bank Accounts & Cash Drawer Tabs) (8 cols) */}
        <div className="lg:col-span-8 relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xs hover:shadow-xs p-5 sm:p-6 flex flex-col justify-between overflow-hidden transition-all duration-200 group">
          {/* Linear Emerald Accent Notch */}
          <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-emerald-500 shadow-xs transition-all duration-200 group-hover:w-2" />

          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3 pl-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <MdAccountBalanceWallet size={18} />
                </div>
                <div>
                  <h3 className="font-black text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    Cash & Bank Ledgers
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    Reconciled corporate bank accounts & cash drawer transactions
                  </p>
                </div>
              </div>

              {/* Dual Tab: Bank Accounts vs Cash Drawer */}
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 font-bold text-xs">
                <button
                  onClick={() => setLiquidityTab('bank')}
                  className={`px-3 py-1 rounded-md text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${liquidityTab === 'bank'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
                    }`}
                >
                  <MdAccountBalance size={14} />
                  <span>Bank Accounts ({metrics.bankAccounts?.length || 0})</span>
                </button>
                <button
                  onClick={() => setLiquidityTab('cash')}
                  className={`px-3 py-1 rounded-md text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${liquidityTab === 'cash'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
                    }`}
                >
                  <MdAccountBalanceWallet size={14} />
                  <span>Cash Drawer</span>
                </button>
              </div>
            </div>

            {/* TAB 1: BANK ACCOUNTS LEDGER TABLE */}
            {liquidityTab === 'bank' && (
              <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-800 max-h-[260px] overflow-y-auto">
                <table className="w-full table-auto border-collapse font-mono text-xs">
                  <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/90 backdrop-blur-xs z-10 shadow-2xs">
                    <tr className="text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-700/80 text-left text-[10.5px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Bank Title</th>
                      <th className="py-2.5 px-3">Account Number</th>
                      <th className="py-2.5 px-3 text-right">Debit (+In)</th>
                      <th className="py-2.5 px-3 text-right">Credit (-Out)</th>
                      <th className="py-2.5 px-3 text-right font-black">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {metrics.bankAccounts && metrics.bankAccounts.length > 0 ? (
                      metrics.bankAccounts.map((b) => (
                        <tr
                          key={b.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 duration-150 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100 font-sans flex items-center gap-2">
                            <span className="p-1 rounded-md bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/50">
                              <MdAccountBalance size={14} />
                            </span>
                            {b.bankName} - {b.accountTitle}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono">{b.accountNumber || '-'}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                            {b.totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right text-rose-500 dark:text-rose-400 font-semibold font-mono">
                            {b.totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white font-mono">
                            Rs. {b.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          No corporate bank accounts registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: CASH DRAWER SETTLEMENT TABLE */}
            {liquidityTab === 'cash' && (
              <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-800 max-h-[260px] overflow-y-auto">
                <table className="w-full table-auto border-collapse font-mono text-xs">
                  <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/90 backdrop-blur-xs z-10 shadow-2xs">
                    <tr className="text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-700/80 text-left text-[10.5px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Source / Voucher</th>
                      <th className="py-2.5 px-3">Party / Particulars</th>
                      <th className="py-2.5 px-3 text-center">Type</th>
                      <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {cashTransactions.length > 0 ? (
                      cashTransactions.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 duration-150 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono">{c.date}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100 font-sans">
                            {(() => {
                              const s = String(c.source || '');
                              if (s.toLowerCase().includes('sale bill')) {
                                const parts = s.split(/(sale bill)/i);
                                return parts.map((part, i) =>
                                  part.toLowerCase() === 'sale bill'
                                    ? <span key={i} className="text-rose-500 font-black">{part}</span>
                                    : <span key={i}>{part}</span>
                                );
                              } else if (s.toLowerCase().includes('purchase bill')) {
                                const parts = s.split(/(purchase bill)/i);
                                return parts.map((part, i) =>
                                  part.toLowerCase() === 'purchase bill'
                                    ? <span key={i} className="text-emerald-600 font-black">{part}</span>
                                    : <span key={i}>{part}</span>
                                );
                              }
                              return s;
                            })()}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-sans max-w-[140px] truncate" title={c.party}>
                            {c.party}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${c.type === 'Inflow'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50'
                              }`}>
                              {c.type === 'Inflow' ? '+ Received' : '- Paid'}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 text-right font-black font-mono ${c.type === 'Inflow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                            Rs. {c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          No recent cash drawer movements found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs mt-2">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              {liquidityTab === 'bank' ? 'Real-time verified bank reconciliation' : `Current Cash In Hand: Rs. ${metrics.cashBalance.toLocaleString()}`}
            </span>
            <button
              onClick={() => navigate('/Accounts/Ledgers?tab=combined-ledger')}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>View Full General Ledger</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

  );
};

export default LiquidityCenterSection;
