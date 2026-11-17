import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdCheckCircle,
  MdWarning,
  MdMonetizationOn,
  MdAccountBalance,
  MdAccountBalanceWallet,
  MdPeople,
  MdInventory,
  MdStorefront,
  MdPieChart,
  MdExpandMore,
  MdChevronRight,
  MdArrowForward,
} from 'react-icons/md';
import { FinancialSummary } from '../../../../service/financialCalculations';

interface GAAPBalanceSheetViewProps {
  metrics: FinancialSummary;
  tenantId?: string | null;
}

export const GAAPBalanceSheetView: React.FC<GAAPBalanceSheetViewProps> = ({
  metrics,
  tenantId,
}) => {
  const navigate = useNavigate();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    cash: true,
    bank: true,
    receivables: false,
    inventory: false,
    payables: false,
    equity: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const totalLiabEq = (metrics.totalLiabilities || 0) + (metrics.totalEquity || 0);
  const isBalanced = Math.abs((metrics.totalAssets || 0) - totalLiabEq) < 1;

  const assetsVal = metrics.totalAssets || 1;
  const liabPct = Math.min(100, Math.round(((metrics.totalLiabilities || 0) / assetsVal) * 100));
  const equityPct = Math.max(0, 100 - liabPct);

  return (
    <div className="space-y-6">
      {/* ── AUDIT STATUS BANNER WITH CAPITAL SOLVENCY GAUGE ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-[#111827] dark:to-slate-900 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3.5 rounded-2xl shadow-sm ${
                isBalanced
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isBalanced ? <MdCheckCircle size={32} /> : <MdWarning size={32} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">GAAP Audit Status:</h3>
                <span
                  className={`px-2.5 py-1 rounded-full font-black text-[10px] tracking-wide uppercase ${
                    isBalanced
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                      : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60'
                  }`}
                >
                  {isBalanced ? 'Balanced Statement ✅' : 'Unbalanced Discrepancy ⚠️'}
                </span>
              </div>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-mono bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md inline-block">
                Assets (Rs. {Number(metrics.totalAssets || 0).toLocaleString()}) = Liabilities (Rs.{' '}
                {Number(metrics.totalLiabilities || 0).toLocaleString()}) + Equity (Rs.{' '}
                {Number(metrics.totalEquity || 0).toLocaleString()})
              </p>
            </div>
          </div>

          {/* 3 Executive KPI Chips */}
          <div className="flex flex-wrap items-center gap-3 font-mono">
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 p-3.5 rounded-xl min-w-[140px] text-right shadow-sm">
              <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Total Assets
              </span>
              <b className="text-emerald-700 dark:text-emerald-300 text-[15px] font-black">
                Rs.{' '}
                {Number(metrics.totalAssets || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </b>
            </div>

            <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 p-3.5 rounded-xl min-w-[140px] text-right shadow-sm">
              <span className="text-rose-700 dark:text-rose-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Total Liabilities
              </span>
              <b className="text-rose-700 dark:text-rose-300 text-[15px] font-black">
                Rs.{' '}
                {Number(metrics.totalLiabilities || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </b>
            </div>

            <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 p-3.5 rounded-xl min-w-[140px] text-right shadow-sm">
              <span className="text-purple-700 dark:text-purple-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Net Owner Equity
              </span>
              <b className="text-purple-700 dark:text-purple-300 text-[15px] font-black">
                Rs.{' '}
                {Number(metrics.totalEquity || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </b>
            </div>
          </div>
        </div>

        {/* Visual Capital Ratio Progress Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
              Owner Equity ({equityPct}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              External Liabilities ({liabPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${equityPct}%` }}
              className="bg-purple-600 h-full transition-all duration-500"
              title={`Equity: ${equityPct}%`}
            ></div>
            <div
              style={{ width: `${liabPct}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`Liabilities: ${liabPct}%`}
            ></div>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN GAAP BALANCE SHEET INTERACTIVE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═════════ LEFT COLUMN: ASSETS ═════════ */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <MdMonetizationOn className="text-emerald-600" size={20} />
              Current &amp; Fixed Assets
            </h3>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Assets</span>
              <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">
                Rs.{' '}
                {Number(metrics.totalAssets || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="space-y-3 font-sans">
            {/* 1. CASH IN HAND ACCORDION */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection('cash')}
                className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {expandedSections.cash ? <MdExpandMore size={20} /> : <MdChevronRight size={20} />}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center">
                    <MdAccountBalanceWallet size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Cash in Hand (Counter Liquidity)
                    </h4>
                    <span className="text-[10px] text-slate-400">App Cash Register Ledger Balance</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                  Rs.{' '}
                  {Number(metrics.cashBalance || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {expandedSections.cash && (
                <div className="p-3 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Primary Physical Cash Box Drawer</span>
                  <button
                    onClick={() =>
                      navigate(`${tenantId ? `/${tenantId}` : ''}/Reports/view/daybook-activity-report`)
                    }
                    className="text-emerald-600 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Cash Daybook &amp; Ledger</span>
                    <MdArrowForward size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* 2. CORPORATE BANK ACCOUNTS ACCORDION */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection('bank')}
                className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {expandedSections.bank ? <MdExpandMore size={20} /> : <MdChevronRight size={20} />}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-teal-600/10 text-teal-600 font-bold flex items-center justify-center">
                    <MdAccountBalance size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Corporate Bank Accounts</h4>
                    <span className="text-[10px] text-slate-400">
                      {metrics.bankAccounts?.length || 0} Bank Accounts Logged
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-xs">
                  Rs.{' '}
                  {Number(metrics.totalBankBalance || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {expandedSections.bank && (
                <div className="p-3 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {!metrics.bankAccounts || metrics.bankAccounts.length === 0 ? (
                    <div className="text-slate-400 italic text-[11px] text-center py-2">
                      No bank accounts logged.
                    </div>
                  ) : (
                    metrics.bankAccounts.map((b) => (
                      <div
                        key={b.id}
                        className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-none text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            🏦 {b.bankName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {b.accountTitle} {b.accountNumber ? `(${b.accountNumber})` : ''}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-600">
                          Rs.{' '}
                          {Number(b.netBalance || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 3. ACCOUNTS RECEIVABLE ACCORDION */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection('receivables')}
                className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {expandedSections.receivables ? <MdExpandMore size={20} /> : <MdChevronRight size={20} />}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 font-bold flex items-center justify-center">
                    <MdPeople size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Accounts Receivable</h4>
                    <span className="text-[10px] text-slate-400">Client Debt Outstanding</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                  Rs.{' '}
                  {Number(metrics.totalReceivables || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {expandedSections.receivables && (
                <div className="p-3 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500 text-[11px]">Uncollected customer sales invoices</span>
                  <button
                    onClick={() =>
                      navigate(`${tenantId ? `/${tenantId}` : ''}/Reports/view/customer-aging-report`)
                    }
                    className="text-blue-600 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Receivables Aging</span>
                    <MdArrowForward size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* 4. MERCHANDISE INVENTORY ASSETS ACCORDION */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection('inventory')}
                className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {expandedSections.inventory ? <MdExpandMore size={20} /> : <MdChevronRight size={20} />}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-600 font-bold flex items-center justify-center">
                    <MdInventory size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Merchandise Inventory Valuation
                    </h4>
                    <span className="text-[10px] text-slate-400">Warehouse Stock Cost Valuation</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-xs">
                  Rs.{' '}
                  {Number(metrics.inventoryAssetValue || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {expandedSections.inventory && (
                <div className="p-3 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500 text-[11px]">Current warehouse inventory holdings</span>
                  <button
                    onClick={() =>
                      navigate(`${tenantId ? `/${tenantId}` : ''}/Reports/view/stock-balances`)
                    }
                    className="text-purple-600 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Stock Valuation</span>
                    <MdArrowForward size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TOTAL ASSETS FOOTER */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center font-mono font-black text-sm">
            <span className="uppercase text-slate-900 dark:text-white tracking-wider">TOTAL ASSETS</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-base">
              Rs.{' '}
              {Number(metrics.totalAssets || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* ═════════ RIGHT COLUMN: LIABILITIES & EQUITY ═════════ */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <MdAccountBalance className="text-rose-600" size={20} />
              Liabilities &amp; Owner Equity
            </h3>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Total Liabilities &amp; Equity
              </span>
              <span className="text-sm font-mono font-black text-rose-600 dark:text-rose-400">
                Rs.{' '}
                {Number(totalLiabEq).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div className="space-y-3 font-sans">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pt-1">
              Current Liabilities (Supplier Credit &amp; Debts)
            </div>

            {/* 1. ACCOUNTS PAYABLE ACCORDION */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection('payables')}
                className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {expandedSections.payables ? <MdExpandMore size={20} /> : <MdChevronRight size={20} />}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-rose-600/10 text-rose-600 font-bold flex items-center justify-center">
                    <MdStorefront size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Accounts Payable (Vendor Debt)
                    </h4>
                    <span className="text-[10px] text-slate-400">Supplier Unpaid Credit Invoices</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                  Rs.{' '}
                  {Number(metrics.totalPayables || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {expandedSections.payables && (
                <div className="p-3 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500 text-[11px]">Outstanding procurement payables</span>
                  <button
                    onClick={() =>
                      navigate(`${tenantId ? `/${tenantId}` : ''}/Reports/view/vendor-outstanding-report`)
                    }
                    className="text-rose-600 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Vendor Outstanding</span>
                    <MdArrowForward size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* TOTAL LIABILITIES SUB-ROW */}
            <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex justify-between items-center">
              <span className="font-bold text-rose-800 dark:text-rose-300 text-xs uppercase">
                Total Current Liabilities
              </span>
              <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-xs">
                Rs.{' '}
                {Number(metrics.totalLiabilities || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pt-3">
              Owner's Equity &amp; Retained Earnings
            </div>

            {/* 2. OWNER EQUITY ACCORDION */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div
                onClick={() => toggleSection('equity')}
                className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {expandedSections.equity ? <MdExpandMore size={20} /> : <MdChevronRight size={20} />}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-600 font-bold flex items-center justify-center">
                    <MdPieChart size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Net Capital &amp; Retained Earnings
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Accumulated Retained Operating Income
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-xs">
                  Rs.{' '}
                  {Number(metrics.totalEquity || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {expandedSections.equity && (
                <div className="p-3 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500 text-[11px]">Net Worth = Assets - Liabilities</span>
                  <button
                    onClick={() =>
                      navigate(`${tenantId ? `/${tenantId}` : ''}/Reports/view/trial-balance-statement`)
                    }
                    className="text-purple-600 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Trial Balance &amp; Capital</span>
                    <MdArrowForward size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TOTAL LIABILITIES & EQUITY FOOTER */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center font-mono font-black text-sm">
            <span className="uppercase text-slate-900 dark:text-white tracking-wider">
              TOTAL LIABILITIES &amp; EQUITY
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 text-base">
              Rs.{' '}
              {Number(totalLiabEq).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GAAPBalanceSheetView;
