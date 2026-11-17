import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../Context/Auth';
import ReportPagination from '../../../components/ReportPagination';
import { supabase } from '../../../Context/supabaseClient';
import Spinner from '../../../ui/Spinner';

import { HoldingItemRow } from './types/holdingReportTypes';
import HoldingReportControls from './components/HoldingReportControls';
import HoldingReportKpiCards from './components/HoldingReportKpiCards';
import DetailedPerspectiveTable from './perspectives/DetailedPerspectiveTable';
import SalesmanPerspectiveTable from './perspectives/SalesmanPerspectiveTable';
import CustomerPerspectiveTable from './perspectives/CustomerPerspectiveTable';
import GatepassPerspectiveTable from './perspectives/GatepassPerspectiveTable';
import InvoicePerspectiveTable from './perspectives/InvoicePerspectiveTable';
import { computeHoldingPerspectives } from './utils/holdingPerspectiveCalculator';
import { exportHoldingReportToExcel } from './utils/holdingReportExport';
import { fetchHoldingPrintRows } from './services/holdingReportPrintService';
import { HoldingReportPrintFooter } from './components/HoldingReportPrintFooter';

const HoldingReportPrint: React.FC = () => {
  const location = useLocation();
  const { businessName } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(25);
  const [isPrinting, setIsPrinting] = useState(false);
  const [loading, setLoading] = useState(false);

  const stateData = location.state || {};
  const initialPerspective = stateData.perspective || 'detailed';
  const rawFilters = stateData.filters || stateData.criteria || {};

  const [activePerspective, setActivePerspective] = useState<string>(initialPerspective);
  const [fetchedRows, setFetchedRows] = useState<HoldingItemRow[]>(stateData.rows || []);
  const [customerLookupMap, setCustomerLookupMap] = useState<Record<string, { code: string; pageNo: string }>>({});

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, customerName, customer_code, customerCode, page_no, pageNo');
        if (data && !error) {
          const map: Record<string, { code: string; pageNo: string }> = {};
          data.forEach((c: any) => {
            const code = c.customer_code || c.customerCode || (c.id ? `CUST-${String(c.id).padStart(3, '0')}` : '');
            const pageNo = c.page_no || c.pageNo || '';
            if (c.customerName) map[c.customerName.trim().toLowerCase()] = { code, pageNo };
          });
          setCustomerLookupMap(map);
        }
      } catch (e) {
        console.warn('Failed to fetch customers for lookup in holding report:', e);
      }
    };
    fetchCustomers();
  }, []);

  const getCustomerDetails = (name: string) => {
    if (!name) return { code: '', pageNo: '' };
    return customerLookupMap[name.trim().toLowerCase()] || { code: '', pageNo: '' };
  };

  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'NHT ENTERPRISES (Noor Horizon Technologies)';

    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      document.title = originalTitle;
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Self-fetch holding data if not provided in location.state
  useEffect(() => {
    if (stateData.rows && stateData.rows.length > 0) {
      setFetchedRows(stateData.rows);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const filtered = await fetchHoldingPrintRows(rawFilters, setCustomerLookupMap);
        setFetchedRows(filtered);
      } catch (err: any) {
        console.error('Error fetching holding data in print view:', err);
        toast.error('Failed to load holding items: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Compute perspectives dynamically
  const { displayRows, kpis } = useMemo(() => {
    return computeHoldingPerspectives(fetchedRows, activePerspective);
  }, [fetchedRows, activePerspective]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activePerspective]);

  const paginatedRows = useMemo(() => {
    if (isPrinting || pageSize === 'all') return displayRows || [];
    const start = (currentPage - 1) * (pageSize as number);
    return (displayRows || []).slice(start, start + (pageSize as number));
  }, [displayRows, currentPage, pageSize, isPrinting]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await exportHoldingReportToExcel(
        activePerspective,
        displayRows,
        rawFilters,
        businessName,
        getCustomerDetails
      );
      toast.success('Excel workbook exported successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-white min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full bg-white text-black p-6 space-y-6 text-xs min-h-screen print:p-0 print:m-0 print:bg-white print:text-black print:min-h-0 print:h-auto">
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
      `,
        }}
      />

      <div className="print-root-container w-full bg-white p-4 space-y-6 print:p-0 print:space-y-4">
        <HoldingReportControls
          activePerspective={activePerspective}
          setActivePerspective={setActivePerspective}
          setCurrentPage={setCurrentPage}
          handlePrint={handlePrint}
          handleExportExcel={handleExportExcel}
          exporting={exporting}
          businessName={businessName}
          rawFilters={rawFilters}
        />

        <HoldingReportKpiCards kpis={kpis} />

        <ReportPagination
          totalCount={(displayRows || []).length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />

        {/* 1. Itemized Detailed View */}
        {activePerspective === 'detailed' && (
          <DetailedPerspectiveTable
            displayRows={displayRows}
            paginatedRows={paginatedRows}
            kpis={kpis}
            currentPage={currentPage}
            pageSize={pageSize}
            customerLookupMap={customerLookupMap}
          />
        )}

        {/* 2. Salesman-Wise View */}
        {activePerspective === 'salesman' && (
          <SalesmanPerspectiveTable
            displayRows={displayRows}
            paginatedRows={paginatedRows}
            kpis={kpis}
            customerLookupMap={customerLookupMap}
          />
        )}

        {/* 3. Customer-Wise View */}
        {activePerspective === 'customer' && (
          <CustomerPerspectiveTable
            displayRows={displayRows}
            paginatedRows={paginatedRows}
            kpis={kpis}
            customerLookupMap={customerLookupMap}
          />
        )}

        {/* 4. Gatepass-Wise View */}
        {activePerspective === 'gatepass' && (
          <GatepassPerspectiveTable
            displayRows={displayRows}
            paginatedRows={paginatedRows}
            kpis={kpis}
            customerLookupMap={customerLookupMap}
          />
        )}

        {/* 5. Invoice-Wise View */}
        {activePerspective === 'invoice' && (
          <InvoicePerspectiveTable
            displayRows={displayRows}
            paginatedRows={paginatedRows}
            kpis={kpis}
            customerLookupMap={customerLookupMap}
          />
        )}

        {/* Verification & Signature Block + Corporate Footer */}
        <HoldingReportPrintFooter businessName={businessName} />
      </div>
    </div>
  );
};

export default HoldingReportPrint;
