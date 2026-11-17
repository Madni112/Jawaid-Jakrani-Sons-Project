import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdAssessment,
  MdAccountBalanceWallet,
  MdAccountBalance,
  MdReceiptLong,
  MdCorporateFare,
  MdClose,
} from 'react-icons/md';

export interface FinancialBreakdownModalProps {
  activeBreakdownModal: 'cash' | 'bank' | 'receivables' | 'payables' | 'stock' | null;
  setActiveBreakdownModal: (modal: 'cash' | 'bank' | 'receivables' | 'payables' | 'stock' | null) => void;
  metrics: any;
  stockModalView: 'allTime' | 'thisMonth';
  setStockModalView: (view: 'allTime' | 'thisMonth') => void;
  receivablesList: any[];
}

export const FinancialBreakdownModal: React.FC<FinancialBreakdownModalProps> = ({
  activeBreakdownModal,
  setActiveBreakdownModal,
  metrics,
  stockModalView,
  setStockModalView,
  receivablesList,
}) => {
  const navigate = useNavigate();

  if (!activeBreakdownModal || !metrics) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Top Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-2xs border ${
                  activeBreakdownModal === 'cash'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/60'
                    : activeBreakdownModal === 'bank'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/60'
                    : activeBreakdownModal === 'receivables'
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200/70 dark:border-indigo-800/60'
                    : activeBreakdownModal === 'payables'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/60'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/60'
                }`}>
                  {activeBreakdownModal === 'stock' && <MdAssessment size={22} />}
                  {activeBreakdownModal === 'cash' && <MdAccountBalanceWallet size={22} />}
                  {activeBreakdownModal === 'bank' && <MdAccountBalance size={22} />}
                  {activeBreakdownModal === 'receivables' && <MdReceiptLong size={22} />}
                  {activeBreakdownModal === 'payables' && <MdCorporateFare size={22} />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                    {activeBreakdownModal === 'stock' && 'Stock Assets & Valuation Ledger'}
                    {activeBreakdownModal === 'cash' && 'Cash Liquidity & Inflow Ledger'}
                    {activeBreakdownModal === 'bank' && 'Corporate Bank Accounts'}
                    {activeBreakdownModal === 'receivables' && 'Customer Receivables & Aging'}
                    {activeBreakdownModal === 'payables' && 'Vendor Payables & Supplier Balances'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeBreakdownModal === 'stock' && 'Real-time warehouse physical stock audit'}
                    {activeBreakdownModal === 'cash' && 'Cash drawer inflows, outflows & balances'}
                    {activeBreakdownModal === 'bank' && 'Verified multi-bank treasury accounts'}
                    {activeBreakdownModal === 'receivables' && 'Outstanding customer debt & collection status'}
                    {activeBreakdownModal === 'payables' && 'Liabilities owed to fabric suppliers and mills'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveBreakdownModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
              >
                <MdClose size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* === 1. STOCK MODAL === */}
              {activeBreakdownModal === 'stock' && (
                <div className="space-y-4">
                  {/* Linear Hero Card */}
                  <div className="relative p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs overflow-hidden">
                    <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-amber-500 shadow-xs" />
                    <div className="pl-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Current Physical Stock Valuation
                          </span>
                          <div className="text-3xl sm:text-4xl font-black mt-1.5 font-mono tracking-tight text-slate-900 dark:text-white">
                            Rs. {metrics.inventoryAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                            Total Inventory
                          </span>
                          <span className="font-mono font-black text-xl text-slate-900 dark:text-white">
                            {(metrics.totalStockUnits || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">Units</span>
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ✓ 100% Synced with Live Stock Registry
                        </span>
                        <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-600/60">
                          Evaluated at Selling Price
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2 Tabs Switcher */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setStockModalView('allTime')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        stockModalView === 'allTime'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>📦 All-Time Inventory Audit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockModalView('thisMonth')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        stockModalView === 'thisMonth'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>🗓️ This Month ({new Date().toLocaleString('default', { month: 'short' })}) Movement</span>
                    </button>
                  </div>

                  {/* TAB 1: ALL-TIME AUDIT TRAIL */}
                  {stockModalView === 'allTime' && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-4 space-y-2.5 font-mono text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-700/60 font-sans">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">1. Initial Opening Stock (Registered):</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          Rs. {(metrics.baseOpeningStockValue || metrics.monthOpeningStockValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-700/60 font-sans">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <span>➕</span> Total Supplier Purchases (Inflow):
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          +Rs. {(metrics.totalPurchasesStockVal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-700/60 font-sans">
                        <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                          <span>➖</span> Total Sales Invoices (Outflow):
                        </span>
                        <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                          -Rs. {(metrics.totalSalesStockVal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {Number(metrics.totalSalesReturnsStockVal || 0) > 0 && (
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-700/60 font-sans">
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <span>🔄</span> Total Sales Returns (Restored):
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            +Rs. {(metrics.totalSalesReturnsStockVal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 font-sans font-bold text-sm bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                        <span className="text-slate-900 dark:text-white">Current Physical Stock:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base font-black">
                          Rs. {metrics.inventoryAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: THIS MONTH'S MOVEMENT */}
                  {stockModalView === 'thisMonth' && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-4 space-y-2.5 font-mono text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-700/60 font-sans">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">1. Month Opening Stock ({new Date().toLocaleString('default', { month: 'short' })} 1st):</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          Rs. {metrics.monthOpeningStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-700/60 font-sans">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <span>➕</span> Month Purchases (Inflow):
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          +Rs. {metrics.thisMonthStockInflowVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-700/60 font-sans">
                        <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                          <span>➖</span> Month Sales (Dispatches):
                        </span>
                        <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                          -Rs. {metrics.thisMonthStockOutflowVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-700/60 font-sans bg-slate-100/70 dark:bg-slate-700/30 px-2 rounded-lg">
                        <span className="text-slate-700 dark:text-slate-200 font-bold">Month-to-Date Net Movement:</span>
                        <span className={`font-black font-mono ${metrics.thisMonthStockMovement < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {metrics.thisMonthStockMovement < 0 ? '-' : '+'}Rs. {Math.abs(metrics.thisMonthStockMovement).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 font-sans font-bold text-sm bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                        <span className="text-slate-900 dark:text-white">Current Physical Stock:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base font-black">
                          Rs. {metrics.inventoryAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Top Inventory Valuation Assets List */}
                  {metrics.topStockProducts && metrics.topStockProducts.length > 0 && (
                    <div className="border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3 bg-white dark:bg-slate-800/40 space-y-2">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Top Stock Assets (By Value)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBreakdownModal(null);
                            navigate('/Reports/Reports-Dashboard?category=inventory', { state: { category: 'inventory' } });
                          }}
                          className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                        >
                          Full Report →
                        </button>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {metrics.topStockProducts.map((p: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-600 text-[10px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">({p.qty} pcs @ Rs. {p.unitPrice})</span>
                            </div>
                            <span className="font-mono font-black text-slate-900 dark:text-white shrink-0">
                              Rs. {p.totalValuation.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* === 2. CASH MODAL === */}
              {activeBreakdownModal === 'cash' && (
                <div className="space-y-4">
                  {/* Linear Hero Card */}
                  <div className="relative p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs overflow-hidden">
                    <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-emerald-500 shadow-xs" />
                    <div className="pl-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Net Cash in Hand
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Reconciled Treasury
                        </span>
                      </div>
                      <div className={`text-3xl sm:text-4xl font-black mt-1.5 font-mono tracking-tight ${metrics.cashBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                        {metrics.cashBalance < 0
                          ? `-Rs. ${Math.abs(metrics.cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : `Rs. ${metrics.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      </div>
                    </div>
                  </div>

                  {/* Fintech Inflow vs Outflow Metric Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                      <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">Total Cash Inflows (All-Time)</span>
                      <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                        +Rs. {metrics.totalCashInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40">
                      <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 block">Total Cash Outflows (All-Time)</span>
                      <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                        -Rs. {metrics.totalCashOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Summary Ledger */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-4 space-y-2.5 font-sans text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">This Month Cash Collected:</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                        Rs. {metrics.thisMonthCashInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 font-bold text-sm bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                      <span className="text-slate-900 dark:text-white">Net Cash Balance:</span>
                      <span className={`${metrics.cashBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} font-mono text-lg font-black`}>
                        {metrics.cashBalance < 0
                          ? `-Rs. ${Math.abs(metrics.cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : `Rs. ${metrics.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* === 3. BANK MODAL === */}
              {activeBreakdownModal === 'bank' && (
                <div className="space-y-4">
                  {/* Linear Hero Card */}
                  <div className="relative p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs overflow-hidden">
                    <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-blue-500 shadow-xs" />
                    <div className="pl-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Bank Balance</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {metrics.bankAccounts.length} Verified Accounts
                        </span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-black mt-1.5 font-mono tracking-tight text-slate-900 dark:text-white">
                        Rs. {metrics.totalBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-4 space-y-3 font-sans text-xs">
                    {metrics.bankAccounts.length === 0 ? (
                      <p className="text-center text-slate-400 py-3">No active corporate bank accounts recorded.</p>
                    ) : (
                      metrics.bankAccounts.map((b, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{b.accountTitle || b.bankName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{b.accountNumber || 'Primary Account'}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            Rs. {Number(b.netBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* === 4. RECEIVABLES MODAL === */}
              {activeBreakdownModal === 'receivables' && (
                <div className="space-y-4">
                  {/* Linear Hero Card */}
                  <div className="relative p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs overflow-hidden">
                    <span className="absolute left-0 top-3.5 bottom-3.5 w-1.25 rounded-r-full bg-indigo-500 shadow-xs" />
                    <div className="pl-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Customer Receivables</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {receivablesList.length} Active Pending Invoices
                        </span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-black mt-1.5 font-mono tracking-tight text-slate-900 dark:text-white">
                        Rs. {metrics.totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-4 space-y-2 font-sans text-xs max-h-56 overflow-y-auto">
                    {receivablesList.slice(0, 5).map((rec, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{rec.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Inv: {rec.invoiceNo} • {rec.daysPending} days old</span>
                        </div>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          Rs. {rec.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end">
              <button
                onClick={() => setActiveBreakdownModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
  );
};

export default FinancialBreakdownModal;
