import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchFinancialMetrics, FinancialSummary } from '../../service/financialCalculations';
import Spinner from '../../ui/Spinner';
import { MdAccountBalance, MdTrendingUp, MdPrint, MdFileDownload } from 'react-icons/md';
import { useAuth } from '../../Context/Auth';
import { toast } from 'react-hot-toast';
import { ExecutiveSummaryView } from './BalanceSheet/components/ExecutiveSummaryView';
import { GAAPBalanceSheetView } from './BalanceSheet/components/GAAPBalanceSheetView';
import { BalanceSheetPrintHeader } from './BalanceSheet/components/BalanceSheetPrintHeader';
import { BalanceSheetPrintFooter } from './BalanceSheet/components/BalanceSheetPrintFooter';
import { exportBalanceSheetToExcel } from './BalanceSheet/utils/balanceSheetExport';

const defaultMetrics: FinancialSummary = {
  cashBalance: 0,
  totalCashInflow: 0,
  totalCashOutflow: 0,
  thisMonthCashInflow: 0,
  thisMonthCashOutflow: 0,
  totalBankBalance: 0,
  thisMonthBankInflow: 0,
  thisMonthBankOutflow: 0,
  bankAccounts: [],
  todaysSales: 0,
  thisMonthSales: 0,
  thisMonthPurchases: 0,
  totalReceivables: 0,
  thisMonthReceivables: 0,
  totalPayables: 0,
  thisMonthPayables: 0,
  inventoryAssetValue: 0,
  monthOpeningStockValue: 0,
  thisMonthStockInflowVal: 0,
  thisMonthStockOutflowVal: 0,
  thisMonthStockMovement: 0,
  totalAssets: 0,
  thisMonthAssets: 0,
  totalLiabilities: 0,
  totalEquity: 0,
  monthlySalesTrend: [],
  cashFlowTrend: [],
};

const BalanceSheet: React.FC = () => {
  const location = useLocation();
  const { businessName, tenantId } = useAuth();
  const [metrics, setMetrics] = useState<FinancialSummary>(defaultMetrics);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const printTypeFromState = location.state?.type || location.state?.printType;
  const activePerspective: 'balance_sheet' | 'summary' =
    printTypeFromState === 'summary' || location.state?.reportId === 'executive-summary-report'
      ? 'summary'
      : 'balance_sheet';

  const initialAsOfDate =
    location.state?.criteria?.asOfDate ||
    location.state?.filters?.asOfDate ||
    location.state?.asOfDate ||
    location.state?.date ||
    new Date().toISOString().split('T')[0];
  const [asOfDate, setAsOfDate] = useState(initialAsOfDate);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchFinancialMetrics();
      if (res) setMetrics(res);
    } catch (err: any) {
      console.error('BalanceSheet loadData failure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title =
      activePerspective === 'summary' ? `Executive_Summary_${asOfDate}` : `Balance_Sheet_${asOfDate}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await exportBalanceSheetToExcel(activePerspective, metrics, asOfDate, businessName);
      toast.success(
        activePerspective === 'summary'
          ? 'Executive Summary exported to Excel successfully!'
          : 'Balance Sheet exported to Excel successfully!'
      );
    } catch (err: any) {
      console.error(err);
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading && !metrics.totalAssets && !metrics.totalLiabilities) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs antialiased font-sans pb-12 print:p-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: landscape; margin: 6mm 6mm; }
          body, html { height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          .balance-sheet-print-container, .balance-sheet-print-container * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .balance-sheet-print-container {
            position: static !important;
            width: 100% !important;
            background: white !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 15px !important;
          }
          aside, header, nav, button, input, .print-hidden-element {
            display: none !important;
            visibility: hidden !important;
          }
          table {
            width: 100% !important;
            table-layout: fixed !important;
            box-sizing: border-box !important;
            border-collapse: collapse !important;
            border: 1.5px solid black !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          th {
            font-size: 13.5px !important;
            font-weight: 800 !important;
            padding: 5px 3px !important;
            color: #000000 !important;
            background-color: #f3f4f6 !important;
            border: 1px solid #000000 !important;
            white-space: normal !important;
            word-break: normal !important;
            line-height: 1.2 !important;
            vertical-align: middle !important;
          }
          td {
            font-size: 14px !important;
            font-weight: 700 !important;
            padding: 6px 4px !important;
            color: #000000 !important;
            border: 1px solid #374151 !important;
          }
          tfoot td {
            font-size: 14.5px !important;
            font-weight: 900 !important;
            padding: 6px 4px !important;
            color: #000000 !important;
            border: 1.5px solid #000000 !important;
            white-space: nowrap !important;
          }
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }
          .break-inside-avoid { break-inside: avoid !important; page-break-inside: avoid !important; }
        }
      `,
        }}
      />

      {/* ── TOP HEADER WITH PERSPECTIVE TABS & ACTIONS ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-900 to-emerald-800 dark:from-emerald-950 dark:to-emerald-900 p-6 rounded-2xl shadow-lg relative overflow-hidden print-hidden-element">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-600/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute left-1/4 -bottom-10 w-48 h-48 bg-emerald-400/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-white/10 text-emerald-100 font-bold backdrop-blur-sm border border-white/10 shadow-sm">
              {activePerspective === 'summary' ? <MdTrendingUp size={24} /> : <MdAccountBalance size={24} />}
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {activePerspective === 'summary'
                ? 'Commercial Executive Summary'
                : 'Corporate Balance Sheet & Financial Statement'}
            </h1>
          </div>
          <p className="text-[13px] text-emerald-100/70 mt-2 max-w-xl leading-relaxed">
            {activePerspective === 'summary'
              ? 'High-level financial KPIs, sales vs purchase revenue trajectories, liquid cash flows, and working capital audit.'
              : 'Real-time GAAP Statement (Assets = Liabilities + Equity) calculated from general ledger records.'}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-end gap-3 w-full md:w-auto ml-auto">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2.5">
            <span className="text-[11px] font-bold text-emerald-200">As Of Date:</span>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={asOfDate}
              onChange={(e) => {
                const today = new Date().toISOString().split('T')[0];
                if (e.target.value > today) {
                  setAsOfDate(today);
                  return;
                }
                setAsOfDate(e.target.value);
              }}
              className="bg-transparent font-bold text-xs text-white outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            disabled={exporting}
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl font-black text-xs transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
          >
            <MdFileDownload size={18} className="text-emerald-600" />
            <span>{exporting ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-black text-xs transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex items-center gap-2 border border-slate-800"
          >
            <MdPrint size={18} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <div className="balance-sheet-print-container flex flex-col gap-6">
        {/* Printable Header for physical paper prints */}
        <BalanceSheetPrintHeader
          businessName={businessName}
          activePerspective={activePerspective}
          asOfDate={asOfDate}
        />

        {/* Perspective 1: Commercial Executive Summary View */}
        {activePerspective === 'summary' && <ExecutiveSummaryView metrics={metrics} />}

        {/* Perspective 2: Balance Sheet Statement GAAP View */}
        {activePerspective === 'balance_sheet' && (
          <GAAPBalanceSheetView metrics={metrics} tenantId={tenantId} />
        )}

        {/* Formal Multi-Level Executive Verification & Signature Block + Corporate Footer */}
        <BalanceSheetPrintFooter businessName={businessName} />
      </div>
    </div>
  );
};

export default BalanceSheet;
