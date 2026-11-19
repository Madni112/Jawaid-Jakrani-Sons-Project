import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { getBrandConfig } from '../../../utils/brand';
import ReportPagination from '../../../components/ReportPagination';
import { MdFileDownload, MdPrint, MdTableChart, MdViewList } from 'react-icons/md';

import { usePurchaseReportData } from './hooks/usePurchaseReportData';
import { exportPurchaseReportToExcel } from './utils/purchaseReportExcelExport';
import PurchaseReportControls from './components/PurchaseReportControls';
import PurchaseReportHeaderBanner from './components/PurchaseReportHeaderBanner';
import PurchaseReportKpiCards from './components/PurchaseReportKpiCards';
import PurchaseReportFilterConstraints from './components/PurchaseReportFilterConstraints';
import PurchaseReportSignatureBlock from './components/PurchaseReportSignatureBlock';

import PurchaseCategoryVolumeTable from './perspectives/PurchaseCategoryVolumeTable';
import PurchaseProductHistoryTable from './perspectives/PurchaseProductHistoryTable';
import PurchaseInvoiceDetailTable from './perspectives/PurchaseInvoiceDetailTable';
import PurchaseRegisterTable from './perspectives/PurchaseRegisterTable';
import { PurchaseViewMode } from './types/purchaseReportTypes';

export interface PurchaseReportPrintProps {
  embedded?: boolean;
  typeOverride?: string;
  filtersOverride?: any;
}

const PurchaseReportPrint: React.FC<PurchaseReportPrintProps> = ({
  embedded,
  typeOverride,
  filtersOverride
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { businessName } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<PurchaseViewMode>('summary');
  const [expandedRowKeys, setExpandedRowKeys] = useState<Set<string | number>>(new Set());
  const [exporting, setExporting] = useState(false);

  const config = useMemo(() => {
    if (typeOverride && filtersOverride) {
      return { type: typeOverride, filters: filtersOverride };
    }
    return location.state || { type: 'purchase', filters: {} };
  }, [typeOverride, filtersOverride, location.state]);

  const { type: rType, filters = {} } = config;

  const {
    loading,
    reportRows,
    categoryHierarchyTree,
    productLookupMap,
    vendorLookupMap
  } = usePurchaseReportData(rType, filters);

  // Dynamic document title & print event listeners
  useEffect(() => {
    const originalTitle = document.title;
    let titlePrefix = 'Purchase Invoice Register';
    if (rType === 'category-purchases') titlePrefix = 'Category-Wise Purchases Report';
    else if (rType === 'product-purchase-history') titlePrefix = 'Product Purchase History & Price Trend';
    else if (rType === 'purchase-invoice-detail' || rType === 'invoice') titlePrefix = 'Purchase Invoice Itemized Detail Report';
    else if (rType === 'return') titlePrefix = 'Purchase Returns & Debit Ledger';
    else if (rType === 'vendor-purchase-summary') titlePrefix = 'Vendor Purchase & Procurement Analysis';
    else if (rType === 'purchase-query') titlePrefix = 'Purchase Parameter Transaction Register';

    document.title = `${titlePrefix} - ${businessName || getBrandConfig().fullName}`;

    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      document.title = originalTitle;
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [rType, businessName]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rType, JSON.stringify(filters)]);

  const toggleRowExpanded = (key: string | number) => {
    setExpandedRowKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllExpanded = () => {
    if (expandedRowKeys.size > 0) {
      setExpandedRowKeys(new Set());
    } else {
      const allKeys = new Set<string | number>();
      if (rType === 'category-purchases') {
        categoryHierarchyTree.forEach((p, pIdx) => {
          allKeys.add(`parent-${pIdx}`);
          (p.sub_categories || []).forEach((_s: any, sIdx: number) => {
            allKeys.add(`sub-${pIdx}-${sIdx}`);
          });
        });
      } else if (rType === 'product-purchase-history') {
        reportRows.forEach(r => allKeys.add(r.product_name));
      } else if (rType === 'purchase-invoice-detail') {
        reportRows.forEach(r => allKeys.add(r.id || r.purchase_no));
      }
      setExpandedRowKeys(allKeys);
    }
  };

  const handleViewModeChange = (mode: PurchaseViewMode) => {
    setActiveViewMode(mode);
    if (mode === 'detailed') {
      const allKeys = new Set<string | number>();
      if (rType === 'category-purchases') {
        categoryHierarchyTree.forEach((p, pIdx) => {
          allKeys.add(`parent-${pIdx}`);
          (p.sub_categories || []).forEach((_s: any, sIdx: number) => {
            allKeys.add(`sub-${pIdx}-${sIdx}`);
          });
        });
      } else if (rType === 'product-purchase-history') {
        reportRows.forEach(r => allKeys.add(r.product_name));
      } else if (rType === 'purchase-invoice-detail') {
        reportRows.forEach(r => allKeys.add(r.id || r.purchase_no));
      }
      setExpandedRowKeys(allKeys);
    } else {
      setExpandedRowKeys(new Set());
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportPurchaseReportToExcel({
        rType,
        filters,
        reportRows,
        businessName,
        productLookupMap,
        vendorLookupMap
      });
    } finally {
      setExporting(false);
    }
  };

  const paginatedRows = useMemo(() => {
    if (pageSize === 'all') return reportRows;
    const start = (currentPage - 1) * pageSize;
    return reportRows.slice(start, start + pageSize);
  }, [reportRows, currentPage, pageSize]);

  const startIndex = (currentPage - 1) * (pageSize === 'all' ? 0 : (pageSize as number));

  const summaryMetrics = useMemo(() => {
    if (rType === 'category-purchases') {
      const grossSpend = reportRows.reduce((s, r) => s + Number(r.gross_purchases || 0), 0);
      const retSpend = reportRows.reduce((s, r) => s + Number(r.returned_amount || 0), 0);
      const netSpend = reportRows.reduce((s, r) => s + Number(r.net_expenditure || 0), 0);
      const totalUnits = reportRows.reduce((s, r) => s + Number(r.net_units || 0), 0);
      return { grossSpend, retSpend, netSpend, totalUnits, count: reportRows.length };
    } else if (rType === 'product-purchase-history') {
      const totalSpend = reportRows.reduce((s, r) => s + Number(r.total_procurement_cost || 0), 0);
      const totalUnits = reportRows.reduce((s, r) => s + Number(r.total_purchased_qty || 0), 0);
      return { totalSpend, totalUnits, count: reportRows.length };
    } else if (rType === 'purchase-invoice-detail') {
      const totalSpend = reportRows.reduce((s, r) => s + Number(r.total_amount || 0), 0);
      const totalUnits = reportRows.reduce((s, r) => s + Number(r.total_units || 0), 0);
      return { totalSpend, totalUnits, count: reportRows.length };
    } else {
      const totalSpend = reportRows.reduce((s, r) => s + Number(r.total_amount || 0), 0);
      return { totalSpend, count: reportRows.length };
    }
  }, [reportRows, rType]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className={`w-full bg-white dark:bg-boxdark text-black dark:text-white ${embedded ? 'p-0 min-h-0' : 'p-6 min-h-screen'} space-y-6 text-xs print:p-0 print:m-0 print:bg-white print:text-black print:min-h-0 print:h-auto`}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Modern Classic Embedded Report View Styling */
        .classic-modern-report-container table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 1rem !important;
          overflow: hidden !important;
          background: white !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        }
        .dark .classic-modern-report-container table {
          border-color: #2e3a47 !important;
          background: #1e293b !important;
        }
        .classic-modern-report-container th {
          background-color: #f8fafc !important;
          color: #475569 !important;
          border-color: #e2e8f0 !important;
          border-top: none !important;
          padding: 10px 14px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.025em !important;
          text-transform: uppercase !important;
        }
        .dark .classic-modern-report-container th {
          background-color: #1e293b !important;
          color: #cbd5e1 !important;
          border-color: #2e3a47 !important;
        }
        .classic-modern-report-container td {
          border-color: #f1f5f9 !important;
          color: #1e293b !important;
          padding: 10px 14px !important;
          font-size: 11.5px !important;
          font-weight: 500 !important;
          transition: background-color 0.15s ease !important;
        }
        .dark .classic-modern-report-container td {
          border-color: #2e3a47 !important;
          color: #e2e8f0 !important;
        }
        .classic-modern-report-container tbody tr:hover td {
          background-color: #f1f5f9 !important;
        }
        .dark .classic-modern-report-container tbody tr:hover td {
          background-color: #334155 !important;
        }
        .classic-modern-report-container tfoot td {
          background-color: #f8fafc !important;
          font-weight: 800 !important;
          border-top: 2px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        .dark .classic-modern-report-container tfoot td {
          background-color: #1e293b !important;
          border-top-color: #475569 !important;
          color: #f8fafc !important;
        }

        @media print {
          @page { size: landscape; margin: 6mm 6mm; }
          body, html { height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          .print-root-container, .print-root-container * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-root-container {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            font-size: 15px !important;
            color: #000000 !important;
          }
          aside, header, nav, footer, .print-hidden-element, button { display: none !important; visibility: hidden !important; }
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
      `
        }}
      />

      <div className={`print-root-container ${embedded ? 'classic-modern-report-container w-full bg-transparent p-0 space-y-5' : 'w-full bg-white p-4 space-y-6'} print:p-0 print:space-y-4`}>
        {/* On screen embedded mode: render clean modern toolbar */}
        {embedded && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-boxdark p-3 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs print:hidden">
            <div className="flex items-center gap-2 flex-wrap">
              {(rType === 'category-purchases' ||
                rType === 'product-purchase-history' ||
                rType === 'purchase-invoice-detail') && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-stroke dark:border-strokedark shadow-2xs mr-2">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('summary')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeViewMode === 'summary' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <MdTableChart size={14} /> Summary View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('detailed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeViewMode === 'detailed' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <MdViewList size={14} /> Detailed View
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="purchase-report-export-excel-btn"
                type="button"
                disabled={exporting}
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white py-1.5 px-3.5 rounded-xl font-bold text-xs cursor-pointer transition shadow-2xs border border-stroke dark:border-strokedark disabled:opacity-50"
              >
                <MdFileDownload size={15} /> {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-primary text-white py-1.5 px-4 rounded-xl font-bold text-xs cursor-pointer hover:bg-opacity-90 transition shadow-2xs"
              >
                <MdPrint size={15} /> Print Report
              </button>
            </div>
          </div>
        )}

        {/* Paper Print Header Banner (hidden on screen when embedded) */}
        <div className={embedded ? 'hidden print:block' : ''}>
          {/* ── TOP ACTION BAR ── */}
          <PurchaseReportControls
            onBack={() => navigate(-1)}
            rType={rType}
            activeViewMode={activeViewMode}
            onViewModeChange={handleViewModeChange}
            exporting={exporting}
            onExportExcel={handleExportExcel}
          />

          {/* ── REPORT FORMAL HEADER BANNER ── */}
          <PurchaseReportHeaderBanner
            businessName={businessName}
            rType={rType}
            activeViewMode={activeViewMode}
            filters={filters}
          />
        </div>

        {/* ── HIGH-LEVEL SUMMARY KPIS ── */}
        <PurchaseReportKpiCards rType={rType} summaryMetrics={summaryMetrics} />

        {/* ── APPLIED MULTI-PARAMETER CONSTRAINTS (FOR PARAMETER BUILDER) ── */}
        <PurchaseReportFilterConstraints
          rType={rType}
          filters={filters}
          reportRowsCount={reportRows.length}
        />

        {/* ── PAGINATION ── */}
        <ReportPagination
          totalItems={reportRows.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={newSize => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: CATEGORY-WISE PURCHASES & VOLUME REPORT */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {rType === 'category-purchases' && (
          <PurchaseCategoryVolumeTable
            activeViewMode={activeViewMode}
            paginatedRows={paginatedRows}
            reportRows={reportRows}
            startIndex={startIndex}
            categoryHierarchyTree={categoryHierarchyTree}
            expandedRowKeys={expandedRowKeys}
            toggleRowExpanded={toggleRowExpanded}
            toggleAllExpanded={toggleAllExpanded}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: PRODUCT PURCHASE HISTORY & PRICE TREND */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {rType === 'product-purchase-history' && (
          <PurchaseProductHistoryTable
            activeViewMode={activeViewMode}
            paginatedRows={paginatedRows}
            reportRows={reportRows}
            startIndex={startIndex}
            expandedRowKeys={expandedRowKeys}
            vendorLookupMap={vendorLookupMap}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* VIEW 3: PURCHASE INVOICE ITEMIZED DETAIL REPORT */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {(rType === 'purchase-invoice-detail' || rType === 'invoice') && (
          <PurchaseInvoiceDetailTable
            activeViewMode={activeViewMode}
            paginatedRows={paginatedRows}
            reportRows={reportRows}
            startIndex={startIndex}
            vendorLookupMap={vendorLookupMap}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* VIEW 4: STANDARD PURCHASE REGISTER, RETURNS & QUERY LEDGER */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {(rType === 'purchase' || rType === 'return' || rType === 'purchase-query' || rType === 'vendor-purchase-summary') && (
          <PurchaseRegisterTable
            rType={rType}
            paginatedRows={paginatedRows}
            reportRows={reportRows}
            startIndex={startIndex}
            currentPage={currentPage}
            pageSize={pageSize}
            isPrinting={isPrinting}
            productLookupMap={productLookupMap}
            vendorLookupMap={vendorLookupMap}
          />
        )}

        {/* ── FORMAL MULTI-LEVEL EXECUTIVE SIGNATURE BLOCK & FOOTER ── */}
        <PurchaseReportSignatureBlock businessName={businessName} />
      </div>
    </div>
  );
};

export default PurchaseReportPrint;
