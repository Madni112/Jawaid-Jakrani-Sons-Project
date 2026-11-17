import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdPrint, MdArrowBack, MdFileDownload, MdViewList, MdTableChart } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../../../Context/Auth';
import { exportToExcel, ExcelColumn } from '../../../utils/excelExport';
import { getBrandConfig } from '../../../utils/brand';
import ReportPagination from '../../../components/ReportPagination';
import { exportSaleReportToExcel } from './services/saleReportExport';
import { fetchSaleReportDataset } from './services/saleReportFetch';
import { extractItemNames, extractItemDetails, extractRowDiscounts } from './services/saleReportHelpers';
import { SaleReportHeader } from './components/SaleReportHeader';
import { SaleReportMetrics } from './components/SaleReportMetrics';
import { CategorySalesTable } from './tables/CategorySalesTable';
import { ProductSalesHistoryTable } from './tables/ProductSalesHistoryTable';
import { LoyaltyReportTable } from './tables/LoyaltyReportTable';
import { CustomerSalesTable } from './tables/CustomerSalesTable';
import { SaleCommercialTable } from './tables/SaleCommercialTable';
import { ReturnReportTable } from './tables/ReturnReportTable';
import { SalesQueryTable } from './tables/SalesQueryTable';

export interface SaleReportPrintProps {
  embedded?: boolean;
  typeOverride?: string;
  filtersOverride?: any;
}

const SaleReportPrint: React.FC<SaleReportPrintProps> = ({
  embedded,
  typeOverride,
  filtersOverride
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { businessName, tenantId } = useAuth();
  const [loading, setLoading] = useState(true);

  const [reportRows, setReportRows] = useState<any[]>([]);
  const [categoryHierarchyTree, setCategoryHierarchyTree] = useState<any[]>([]);
  const [productUomMap, setProductUomMap] = useState<Record<string, string>>({});
  const [customerLookup, setCustomerLookup] = useState<Record<string, { code: string; pageNo: string }>>({});

  const resolveCustomerMeta = (custName?: string) => {
    const raw = String(custName || '').trim().toLowerCase();
    const clean = raw.replace(/\s+/g, ' ');
    if (!clean) return { code: '', pageNo: '' };

    if (customerLookup[clean]) return customerLookup[clean];
    if (customerLookup[raw]) return customerLookup[raw];

    if (clean === 'cash') {
      if (customerLookup['walk-in customer']) return customerLookup['walk-in customer'];
      if (customerLookup['cash customer']) return customerLookup['cash customer'];
    }

    const entry = Object.entries(customerLookup).find(([k]) => k === clean || k.includes(clean) || clean.includes(k));
    if (entry) return entry[1];

    return { code: '', pageNo: '' };
  };

  const config = useMemo(() => {
    if (typeOverride && filtersOverride) {
      return { type: typeOverride, filters: filtersOverride };
    }
    return location.state || { type: 'sale', filters: {} };
  }, [typeOverride, filtersOverride, location.state]);

  const { type: rType, filters = {} } = config;

  // View mode for Product Sales History ('summary' | 'detailed')
  const [activeViewMode, setActiveViewMode] = useState<'summary' | 'detailed'>(
    filters.viewMode === 'detailed' ? 'detailed' : 'summary'
  );

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(activeViewMode === 'detailed' ? 10 : 25);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [reportWarehouses, setReportWarehouses] = useState<string[]>([]);

  useEffect(() => {
    const handleBefore = () => setIsPrinting(true);
    const handleAfter = () => setIsPrinting(false);
    window.addEventListener('beforeprint', handleBefore);
    window.addEventListener('afterprint', handleAfter);
    return () => {
      window.removeEventListener('beforeprint', handleBefore);
      window.removeEventListener('afterprint', handleAfter);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [rType, activeViewMode]);

  useEffect(() => {
    const originalTitle = document.title;
    const bName = businessName || getBrandConfig().fullName;
    if (rType === 'category-sales') {
      document.title = `Category-Wise Sales & Volume Report - ${bName}`;
    } else if (rType === 'product-sales-history') {
      document.title = `Product Sales History Report - ${bName}`;
    } else if (rType === 'sales-query') {
      document.title = `Sales Parameter Transaction Register - ${bName}`;
    } else if (rType === 'customer-sales') {
      document.title = `Customer Sales & Volume Analysis - ${bName}`;
    } else if (rType === 'return') {
      document.title = `Sales Return & Credit Ledger - ${bName}`;
    } else if (rType === 'invoice') {
      document.title = `Sales Invoice Detail Audit - ${bName}`;
    } else if (rType === 'loyalty') {
      document.title = `Customer Financial Statement & Invoice Ledger - ${bName}`;
    } else {
      document.title = `Commercial Sales Audit Statement - ${bName}`;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [rType]);

  useEffect(() => {
    fetchSaleReportDataset({
      rType,
      filters,
      setReportRows,
      setCategoryHierarchyTree,
      setReportWarehouses,
      setCustomerLookup,
      setProductUomMap,
      setLoading,
    });
  }, [rType, JSON.stringify(filters)]);

  const [exporting, setExporting] = useState(false);

  // ── 📥 EXCEL WORKBOOK EXPORT ──
  const handleExportExcel = () => {
    exportSaleReportToExcel({
      reportRows,
      rType,
      activeViewMode,
      filters,
      businessName,
      resolveCustomerMeta,
      setExporting,
    });
  };

  // Summary Metrics calculations
  const totalGrossAmount = useMemo(() => {
    if (rType === 'category-sales') {
      return reportRows.reduce((acc, c) => acc + Number(c.net_revenue || 0), 0);
    }
    if (rType === 'product-sales-history') {
      return reportRows.reduce((acc, r) => acc + Number(r.final_net_sales || 0), 0);
    }
    if (rType === 'loyalty') {
      return reportRows.reduce((acc, r) => acc + Number(r.total_sales_amount || 0), 0);
    }
    if (rType === 'sale' || rType === 'customer-sales') {
      return reportRows.reduce((acc, s) => acc + Number(s.total_sales || 0), 0);
    }
    if (rType === 'return') {
      return reportRows.reduce((acc, r) => acc + Number(r.total_return_amount || 0), 0);
    }
    return reportRows.reduce((acc, row) => acc + Number(row.total_amount || 0), 0);
  }, [reportRows, rType]);

  const totalSoldUnits = useMemo(() => {
    if (rType === 'category-sales') {
      return reportRows.reduce((acc, c) => acc + Number(c.gross_units || 0), 0);
    }
    if (rType === 'product-sales-history') {
      return reportRows.reduce((acc, r) => acc + Number(r.sold_qty || 0), 0);
    }
    if (rType === 'customer-sales') {
      return reportRows.reduce((acc, c) => acc + Number(c.gross_units || c.total_units || 0), 0);
    }
    return 0;
  }, [reportRows, rType]);

  const totalReturnedUnits = useMemo(() => {
    if (rType === 'category-sales') {
      return reportRows.reduce((acc, c) => acc + Number(c.returned_units || 0), 0);
    }
    if (rType === 'product-sales-history') {
      return reportRows.reduce((acc, r) => acc + Number(r.returned_qty || 0), 0);
    }
    if (rType === 'return') {
      return reportRows.reduce((acc, r) => acc + Number(r.total_returned_qty || 0), 0);
    }
    if (rType === 'customer-sales') {
      return reportRows.reduce((acc, c) => acc + Number(c.returned_units || 0), 0);
    }
    return 0;
  }, [reportRows, rType]);

  const totalNetUnits = useMemo(() => {
    if (rType === 'category-sales') {
      return reportRows.reduce((acc, c) => acc + Number(c.net_units || 0), 0);
    }
    if (rType === 'product-sales-history') {
      return reportRows.reduce((acc, r) => acc + Number(r.net_qty || 0), 0);
    }
    if (rType === 'customer-sales') {
      return reportRows.reduce((acc, c) => acc + Number(c.net_units || (c.gross_units || 0) - (c.returned_units || 0)), 0);
    }
    return 0;
  }, [reportRows, rType]);

  const totalReturnsCount = useMemo(() => {
    if (rType === 'return') {
      return reportRows.reduce((acc, r) => acc + Number(r.returns_count || 0), 0);
    }
    if (rType === 'customer-sales' || rType === 'sale') {
      return reportRows.reduce((acc, c) => acc + Number(c.returns_count || 0), 0);
    }
    return 0;
  }, [reportRows, rType]);

  const totalReturnAmount = useMemo(() => {
    if (rType === 'category-sales') {
      return reportRows.reduce((acc, c) => acc + Number(c.returned_amount || 0), 0);
    }
    if (rType === 'return') {
      return reportRows.reduce((acc, r) => acc + Number(r.total_return_amount || 0), 0);
    }
    if (rType === 'customer-sales' || rType === 'sale') {
      return reportRows.reduce((acc, c) => acc + Number(c.return_amount || c.returned_amount || 0), 0);
    }
    return 0;
  }, [reportRows, rType]);

  const totalCustomerGrossSales = useMemo(() => {
    if (rType === 'category-sales') {
      return reportRows.reduce((acc, c) => acc + Number(c.gross_sales || 0), 0);
    }
    if (rType === 'customer-sales' || rType === 'sale') {
      return reportRows.reduce((acc, c) => acc + Number(c.gross_sales || c.total_sales || 0), 0);
    }
    return totalGrossAmount;
  }, [reportRows, rType, totalGrossAmount]);

  const cashAmount = useMemo(() => {
    if (rType === 'sale' || rType === 'customer-sales') {
      return reportRows.reduce((acc, s) => acc + Number(s.cash_sales || 0), 0);
    }
    return reportRows.filter(r => String(r.payment_term || '').toLowerCase() === 'cash').reduce((acc, r) => acc + Number(r.total_amount || 0), 0);
  }, [reportRows, rType]);

  const creditAmount = useMemo(() => {
    if (rType === 'sale' || rType === 'customer-sales') {
      return reportRows.reduce((acc, s) => acc + Number(s.credit_sales || 0), 0);
    }
    return totalGrossAmount - cashAmount;
  }, [reportRows, rType, totalGrossAmount, cashAmount]);

  const totalInvoicesCount = useMemo(() => {
    if (rType === 'category-sales') {
      return reportRows.reduce((acc, c) => acc + Number(c.invoices_count || 0), 0);
    }
    if (rType === 'sale' || rType === 'customer-sales') {
      return reportRows.reduce((acc, s) => acc + Number(s.invoices_count || 0), 0);
    }
    if (rType === 'return') {
      return reportRows.reduce((acc, r) => acc + Number(r.returns_count || 0), 0);
    }
    if (rType === 'loyalty') {
      return reportRows.reduce((acc, c) => acc + Number(c.invoices_count || 0), 0);
    }
    return reportRows.length;
  }, [reportRows, rType]);

  const avgOrder = totalInvoicesCount > 0 ? totalGrossAmount / totalInvoicesCount : 0;

  const totalAllDiscounts = useMemo(() => {
    return reportRows.reduce((acc, row) => {
      const disc = extractRowDiscounts(row);
      return acc + disc.grandTotalDiscount;
    }, 0);
  }, [reportRows]);

  const paginatedRows = useMemo(() => {
    if (isPrinting || pageSize >= 10000 || pageSize === 'all') return reportRows;
    const pSize = typeof pageSize === 'number' ? pageSize : 25;
    const start = (currentPage - 1) * pSize;
    return reportRows.slice(start, start + pSize);
  }, [reportRows, currentPage, pageSize, isPrinting]);

  const displayedRows = isPrinting ? reportRows : paginatedRows;

  const totalAllFreight = useMemo(() => {
    return reportRows.reduce((acc, row) => {
      const fr = Number(row.transport_charges || row.freight_charges || row.freight || 0) + Number(row.additional_charges || 0);
      return acc + fr;
    }, 0);
  }, [reportRows]);

  const pageAllFreight = useMemo(() => {
    return displayedRows.reduce((acc, row) => {
      const fr = Number(row.transport_charges || row.freight_charges || row.freight || 0) + Number(row.additional_charges || 0);
      return acc + fr;
    }, 0);
  }, [displayedRows]);

  const displayedHierarchy = useMemo(() => {
    if (isPrinting || pageSize >= 10000 || pageSize === 'all') return categoryHierarchyTree;
    const pSize = typeof pageSize === 'number' ? pageSize : 10;
    const start = (currentPage - 1) * pSize;
    return categoryHierarchyTree.slice(start, start + pSize);
  }, [categoryHierarchyTree, currentPage, pageSize, isPrinting]);

  const isMultiWarehouse = useMemo(() => {
    if (Array.isArray(filters.location)) {
      const locs = filters.location.filter((l: string) => l && l !== 'All');
      if (locs.length === 1) return false;
      if (locs.length > 1) return true;
    } else if (typeof filters.location === 'string' && filters.location && filters.location !== 'All') {
      return false;
    }
    return reportWarehouses.length > 1;
  }, [filters.location, reportWarehouses]);

  const renderWhBreakdown = (whMap: Record<string, number> | undefined, colorType: 'sold' | 'return' | 'net') => {
    if (!isMultiWarehouse || !whMap) return null;

    let targetWarehouses: string[] = [];
    if (Array.isArray(filters.location)) {
      const sel = filters.location.filter((l: string) => l && l !== 'All');
      if (sel.length > 1) {
        targetWarehouses = sel;
      }
    }
    if (targetWarehouses.length === 0) {
      targetWarehouses = reportWarehouses.length > 0 ? reportWarehouses : Object.keys(whMap);
    }

    // Only include warehouses that actually have non-zero quantity
    const activeWarehouses = targetWarehouses.filter(w => Number(whMap[w] || 0) !== 0);
    // If only 1 warehouse (or 0) has transactions, no multi-warehouse breakdown is needed
    if (activeWarehouses.length <= 1) return null;

    const colorStyles = {
      sold: 'text-slate-800 bg-slate-100/90 border-slate-300',
      return: 'text-rose-700 bg-rose-50 border-rose-300',
      net: 'text-primary bg-indigo-50/90 border-indigo-200'
    }[colorType];

    return (
      <div className="flex flex-col items-end gap-1 mt-1 pt-1 border-t border-dashed border-gray-300 print:mt-0.5 print:pt-0.5 w-full">
        {activeWarehouses.map((wh) => {
          const qty = Number(whMap[wh] || 0);
          return (
            <span
              key={wh}
              className={`inline-flex items-center justify-between gap-1 px-1 py-0.5 rounded text-[9.5px] font-mono font-bold border ${colorStyles} leading-tight max-w-full`}
              title={`${wh}: ${qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            >
              <span className="font-sans font-bold uppercase text-[8.5px] opacity-75 truncate max-w-[55px]">{wh}:</span>
              <span>{qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className={`w-full bg-white dark:bg-boxdark text-black dark:text-white ${embedded ? 'p-0 min-h-0' : 'p-6 min-h-screen'} space-y-6 text-xs print:p-0 print:m-0 print:bg-white print:text-black print:min-h-0 print:h-auto`}>
      <style dangerouslySetInnerHTML={{
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
          @page { size: auto; margin: 6mm 6mm; }
          body, html, #root, main, .flex {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .overflow-x-auto, div {
            overflow: visible !important;
          }
          body * { visibility: hidden !important; }
          .print-root-container, .print-root-container * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-root-container {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            font-size: 11px !important;
            color: #000000 !important;
          }
          aside, header, nav, footer, .print-hidden-element, button {
            display: none !important;
            visibility: hidden !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            box-sizing: border-box !important;
            border-collapse: collapse !important;
            border: 1.5px solid black !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          th {
            font-size: 11px !important;
            font-weight: 800 !important;
            padding: 4px 3px !important;
            color: #000000 !important;
            background-color: #f3f4f6 !important;
            border: 1px solid #000000 !important;
            white-space: normal !important;
            word-break: normal !important;
            line-height: 1.2 !important;
            vertical-align: middle !important;
          }
          td {
            font-size: 10.5px !important;
            font-weight: 600 !important;
            padding: 4px 3px !important;
            color: #000000 !important;
            border: 1px solid #374151 !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
          }
          tfoot td {
            font-size: 11px !important;
            font-weight: 900 !important;
            padding: 4px 3px !important;
            color: #000000 !important;
            border: 1.5px solid #000000 !important;
            white-space: normal !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }
          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}} />

      <div className={`print-root-container ${embedded ? 'classic-modern-report-container w-full bg-transparent p-0 space-y-5' : 'w-full bg-white p-4 space-y-6'} print:p-0 print:space-y-4`}>
        {/* On screen embedded mode: render clean modern toolbar */}
        {embedded && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-boxdark p-3 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs print:hidden">
            <div className="flex items-center gap-2 flex-wrap">
              {(rType === 'category-sales' || rType === 'product-sales-history' || rType === 'sale' || rType === 'customer-sales' || rType === 'return') && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-stroke dark:border-strokedark shadow-2xs mr-2">
                  <button
                    type="button"
                    onClick={() => setActiveViewMode('summary')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeViewMode === 'summary' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <MdTableChart size={14} /> Summary View
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveViewMode('detailed')}
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
                id="sales-report-export-excel-btn"
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
          <SaleReportHeader
            onBack={() => navigate(-1)}
            rType={rType}
            activeViewMode={activeViewMode}
            setActiveViewMode={setActiveViewMode}
            printOrientation={printOrientation}
            setPrintOrientation={setPrintOrientation}
            exporting={exporting}
            onExportExcel={handleExportExcel}
            businessName={businessName}
            filters={filters}
          />
        </div>

        <SaleReportMetrics
          rType={rType}
          reportRows={reportRows}
          filters={filters}
          totalNetUnits={totalNetUnits}
          totalGrossAmount={totalGrossAmount}
          totalSoldUnits={totalSoldUnits}
          totalReturnedUnits={totalReturnedUnits}
          totalInvoicesCount={totalInvoicesCount}
          totalReturnsCount={totalReturnsCount}
          totalCustomerGrossSales={totalCustomerGrossSales}
          totalReturnAmount={totalReturnAmount}
          totalAllDiscounts={totalAllDiscounts}
          cashAmount={cashAmount}
          creditAmount={creditAmount}
          avgOrder={avgOrder}
        />

        {/* ── TOP PAGINATION CONTROL ── */}
        <ReportPagination
          currentPage={currentPage}
          totalItems={rType === 'category-sales' && activeViewMode === 'detailed' ? categoryHierarchyTree.length : reportRows.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel={rType === 'category-sales' ? (activeViewMode === 'detailed' ? 'parent categories' : 'categories') : rType === 'product-sales-history' ? 'products' : (rType === 'loyalty' || rType === 'customer-sales' || rType === 'return') ? 'customers' : rType === 'sale' ? 'salesmen' : 'records'}
        />

        {/* ── MAIN AUDIT TABLE SECTION ── */}
        <div className="w-full overflow-x-auto">
          {rType === 'category-sales' ? (
            <CategorySalesTable
              activeViewMode={activeViewMode}
              displayedRows={displayedRows}
              isPrinting={isPrinting}
              pageSize={pageSize}
              currentPage={currentPage}
              reportRows={reportRows}
              isMultiWarehouse={isMultiWarehouse}
              renderWhBreakdown={renderWhBreakdown}
              totalSoldUnits={totalSoldUnits}
              totalReturnedUnits={totalReturnedUnits}
              totalNetUnits={totalNetUnits}
              totalGrossAmount={totalGrossAmount}
              displayedHierarchy={displayedHierarchy}
              resolveCustomerMeta={resolveCustomerMeta}
            />
          ) : rType === 'product-sales-history' ? (
            <ProductSalesHistoryTable
              activeViewMode={activeViewMode}
              displayedRows={displayedRows}
              isPrinting={isPrinting}
              pageSize={pageSize}
              currentPage={currentPage}
              reportRows={reportRows}
              totalSoldUnits={totalSoldUnits}
              totalReturnedUnits={totalReturnedUnits}
              totalNetUnits={totalNetUnits}
              totalGrossAmount={totalGrossAmount}
              resolveCustomerMeta={resolveCustomerMeta}
            />
          ) : rType === 'loyalty' ? (
            <LoyaltyReportTable
              displayedRows={displayedRows}
              isPrinting={isPrinting}
              pageSize={pageSize}
              currentPage={currentPage}
              reportRows={reportRows}
              resolveCustomerMeta={resolveCustomerMeta}
            />
          ) : rType === 'customer-sales' ? (
            <CustomerSalesTable
              activeViewMode={activeViewMode}
              displayedRows={displayedRows}
              isPrinting={isPrinting}
              pageSize={pageSize}
              currentPage={currentPage}
              reportRows={reportRows}
              resolveCustomerMeta={resolveCustomerMeta}
              totalSoldUnits={totalSoldUnits}
              totalReturnedUnits={totalReturnedUnits}
              totalNetUnits={totalNetUnits}
              totalGrossAmount={totalGrossAmount}
              totalCustomerGrossSales={totalCustomerGrossSales}
              totalReturnAmount={totalReturnAmount}
              totalInvoicesCount={totalInvoicesCount}
              totalReturnsCount={totalReturnsCount}
            />
          ) : rType === 'sale' ? (
            <SaleCommercialTable
              activeViewMode={activeViewMode}
              displayedRows={displayedRows}
              isPrinting={isPrinting}
              pageSize={pageSize}
              currentPage={currentPage}
              reportRows={reportRows}
              resolveCustomerMeta={resolveCustomerMeta}
              totalGrossAmount={totalGrossAmount}
              totalCustomerGrossSales={totalCustomerGrossSales}
              totalReturnAmount={totalReturnAmount}
              totalInvoicesCount={totalInvoicesCount}
              totalReturnsCount={totalReturnsCount}
              cashAmount={cashAmount}
              creditAmount={creditAmount}
            />
          ) : rType === 'return' ? (
            <ReturnReportTable
              activeViewMode={activeViewMode}
              displayedRows={displayedRows}
              isPrinting={isPrinting}
              pageSize={pageSize}
              currentPage={currentPage}
              reportRows={reportRows}
              resolveCustomerMeta={resolveCustomerMeta}
              totalReturnedUnits={totalReturnedUnits}
              totalGrossAmount={totalGrossAmount}
              totalInvoicesCount={totalInvoicesCount}
            />
          ) : (
            <SalesQueryTable
              rType={rType}
              displayedRows={displayedRows}
              isPrinting={isPrinting}
              pageSize={pageSize}
              currentPage={currentPage}
              reportRows={reportRows}
              customerLookup={customerLookup}
              resolveCustomerMeta={resolveCustomerMeta}
              totalGrossAmount={totalGrossAmount}
              totalAllDiscounts={totalAllDiscounts}
              totalAllFreight={totalAllFreight}
            />
          )}
        </div>

        {/* ── BOTTOM PAGINATION CONTROL ── */}
        <ReportPagination
          currentPage={currentPage}
          totalItems={rType === 'category-sales' && activeViewMode === 'detailed' ? categoryHierarchyTree.length : reportRows.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel={rType === 'category-sales' ? (activeViewMode === 'detailed' ? 'parent categories' : 'categories') : rType === 'product-sales-history' ? 'products' : (rType === 'loyalty' || rType === 'customer-sales' || rType === 'return') ? 'customers' : rType === 'sale' ? 'salesmen' : 'records'}
        />

        {/* ✍️ Formal Multi-Level Executive Verification & Signature Block */}
        <div className="mt-16 grid grid-cols-3 gap-10 text-center text-[10px] font-sans font-black uppercase tracking-wider text-slate-800 break-inside-avoid">
          <div className="flex flex-col justify-end">
            <div className="signature-spacer h-20 min-h-[80px]" style={{ height: '80px', minHeight: '80px' }}></div>
            <div className="border-t-2 border-black pt-2">
              <div className="text-black font-extrabold text-[10px]">PREPARED BY</div>
              <div className="text-[8.5px] font-semibold text-gray-500 normal-case">Sales Operations &amp; Audit Officer</div>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <div className="signature-spacer h-20 min-h-[80px]" style={{ height: '80px', minHeight: '80px' }}></div>
            <div className="border-t-2 border-black pt-2">
              <div className="text-black font-extrabold text-[10px]">VERIFIED BY</div>
              <div className="text-[8.5px] font-semibold text-gray-500 normal-case">Corporate Accounts Auditor &amp; Billing Lead</div>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <div className="signature-spacer h-20 min-h-[80px]" style={{ height: '80px', minHeight: '80px' }}></div>
            <div className="border-t-2 border-black pt-2">
              <div className="text-black font-extrabold text-[10px]">AUTHORIZED BY</div>
              <div className="text-[8.5px] font-semibold text-gray-500 normal-case">Managing Executive Director &amp; Official Seal</div>
            </div>
          </div>
        </div>

        {/* 🏢 Software & Corporate Provider Footer */}
        <div className="mt-8 pt-3 border-t border-gray-300 flex justify-between items-center text-[10px] text-gray-600 font-sans print:border-gray-400 break-inside-avoid">
          <div className="flex items-center gap-2 font-bold">
            <span className="text-black font-black uppercase">{businessName || getBrandConfig().fullName}</span>
          </div>
          <div className="text-[9.5px] text-gray-600 font-mono font-medium text-right">
            Software Solution &amp; Cloud Infrastructure by <b className="text-black font-bold">NHT ENTERPRISES (Noor Horizon Technologies)</b>
            <span className="text-gray-400 mx-1.5">•</span>
            <span>Contact: <b className="text-black font-bold">03128039911</b></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleReportPrint;
