import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';

import type {
  ViewPerspective,
  HoldingItemRow,
  HoldingKpis,
  SalesmanSummaryItem,
  CustomerSummaryItem,
  GatepassSummaryItem,
  InvoiceSummaryItem
} from './interactive/types/holdingTypes';
import { exportHoldingReportToExcel } from './interactive/utils/holdingExport';
import { HoldingHeaderCard } from './interactive/components/HoldingHeaderCard';
import { HoldingKpiCards } from './interactive/components/HoldingKpiCards';
import { HoldingPerspectiveTabs } from './interactive/components/HoldingPerspectiveTabs';
import { HoldingFiltersSection } from './interactive/components/HoldingFiltersSection';
import { DetailedHoldingView } from './interactive/views/DetailedHoldingView';
import { SalesmanHoldingAccordion } from './interactive/views/SalesmanHoldingAccordion';
import { CustomerHoldingAccordion } from './interactive/views/CustomerHoldingAccordion';
import { GatepassHoldingAccordion } from './interactive/views/GatepassHoldingAccordion';
import { InvoiceHoldingAccordion } from './interactive/views/InvoiceHoldingAccordion';

const HoldingReport: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId, businessName } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const initialPerspective = (location.state?.activePerspective ||
    location.state?.perspective ||
    location.state?.tab ||
    'detailed') as ViewPerspective;
  const [activePerspective, setActivePerspective] = useState<ViewPerspective>(initialPerspective);

  // Raw fetched data
  const [holdingRows, setHoldingRows] = useState<HoldingItemRow[]>([]);
  const [salesmenList, setSalesmenList] = useState<string[]>([]);
  const [customersList, setCustomersList] = useState<string[]>([]);
  const [gatepassesList, setGatepassesList] = useState<string[]>([]);
  const [invoicesList, setInvoicesList] = useState<string[]>([]);

  // Search & Filter Criteria
  const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || '');
  const [selectedSalesman, setSelectedSalesman] = useState(
    location.state?.selectedSalesman || location.state?.salesman || 'All'
  );
  const [selectedCustomer, setSelectedCustomer] = useState(
    location.state?.selectedCustomer || location.state?.customer || 'All'
  );
  const [selectedGatepass, setSelectedGatepass] = useState(
    location.state?.selectedGatepass || location.state?.gatepass || 'All'
  );
  const [selectedInvoice, setSelectedInvoice] = useState(
    location.state?.selectedInvoice || location.state?.invoice || 'All'
  );
  const [holdingStatusFilter, setHoldingStatusFilter] = useState<'holding_only' | 'all' | 'zero_holding'>(
    'holding_only'
  );
  const [minAmount, setMinAmount] = useState<number | string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'qty_desc'>(
    'amount_desc'
  );

  // Collapsible Advanced Filters Drawer State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Accordion Expand State for Grouped Tabs
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Record<string, boolean>>({});

  // Date Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const toggleGroupExpand = (key: string) => {
    setExpandedGroupKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadHoldingData = async () => {
    try {
      setLoading(true);

      const [dcRes, invRes, smRes, custRes] = await Promise.all([
        fetchAllPages(supabase.from('delivery_challans').select('*').order('created_at', { ascending: false })),
        fetchAllPages(supabase.from('sales_invoices').select('*')),
        fetchAllPages(supabase.from('salesmen').select('id, name')),
        fetchAllPages(supabase.from('customers').select('id, customerName, customer_code, customerCode'))
      ]);

      if (dcRes.error) throw dcRes.error;

      const dcs = dcRes.data || [];
      const invoices = invRes.data || [];
      const salesmen = (smRes.data || []).map((s: any) => s.name).filter(Boolean);
      const customers = (custRes.data || [])
        .map((c: any) => {
          const code = c.customer_code || c.customerCode;
          return code ? `[${code}] ${c.customerName}` : c.customerName;
        })
        .filter(Boolean);

      // Create lookup map for invoices
      const invMap: Record<string, any> = {};
      invoices.forEach((inv) => {
        const key1 = String(inv.id).trim().toLowerCase();
        const key2 = `inv-${key1}`;
        invMap[key1] = inv;
        invMap[key2] = inv;
      });

      const extractedRows: HoldingItemRow[] = [];
      const uniqueGPs = new Set<string>();
      const uniqueInvs = new Set<string>();
      const uniqueSMs = new Set<string>(salesmen);
      const uniqueCusts = new Set<string>(customers);

      dcs.forEach((dc) => {
        const rawInvCode = String(dc.invoice_no || '').trim().replace(/^inv-/i, '').toLowerCase();
        const linkedInv = invMap[rawInvCode] || invMap[String(dc.invoice_no || '').trim().toLowerCase()];

        const gatepassCode = dc.challan_no || `DC-${String(dc.id).padStart(4, '0')}`;
        const invoiceCode =
          dc.invoice_no || (linkedInv?.id ? `INV-${String(linkedInv.id).padStart(4, '0')}` : 'Direct');
        const custName = dc.customer_name || linkedInv?.customer_name || 'Counter Buyer';
        const smName = linkedInv?.salesman || dc.salesman || 'Direct';
        const docDate =
          dc.challan_date || dc.dc_date || linkedInv?.sale_date || String(dc.created_at || '').split('T')[0];

        if (gatepassCode) uniqueGPs.add(gatepassCode);
        if (invoiceCode && invoiceCode !== 'Direct') uniqueInvs.add(invoiceCode);
        if (custName) uniqueCusts.add(custName);
        if (smName) uniqueSMs.add(smName);

        let items: any[] = [];
        if (Array.isArray(dc.items)) {
          items = dc.items;
        } else if (typeof dc.items === 'string') {
          try {
            items = JSON.parse(dc.items);
          } catch (_) {
            items = [];
          }
        }

        items.forEach((item, idx) => {
          const orderQty = Number(item.orderQty ?? item.qty ?? 0);
          const dispatchedQty = Number(
            item.dispatchedQty ?? (dc.status === 'Approved' || dc.status === 'Dispatched' ? orderQty : 0)
          );
          const holdQty = Number(
            item.holdQty !== undefined ? item.holdQty : Math.max(0, orderQty - dispatchedQty)
          );
          const rate = Number(item.rate || item.rp || 0);
          const totalOrderAmt = orderQty * rate;
          const heldAmt = holdQty * rate;

          extractedRows.push({
            id: `${dc.id}-${idx}`,
            dcId: dc.id,
            gatepassNo: gatepassCode,
            invoiceNo: invoiceCode,
            customerName: custName,
            salesman: smName,
            productName: item.pDescription || item.itemName || item.product_name || 'Item',
            skuCode: item.skuCode || item.sku || '',
            warehouse: item.location || dc.dispatch_warehouse || 'Main Warehouse',
            orderQty,
            dispatchedQty,
            holdQty,
            rate,
            totalOrderAmount: totalOrderAmt,
            heldAmount: heldAmt,
            date: docDate,
            status: dc.status || (holdQty > 0 ? 'Holding' : 'Completed'),
            uom: item.uom || item.unit || ''
          });
        });
      });

      setHoldingRows(extractedRows);
      setGatepassesList(Array.from(uniqueGPs).sort());
      setInvoicesList(Array.from(uniqueInvs).sort());
      setSalesmenList(Array.from(uniqueSMs).sort());
      setCustomersList(Array.from(uniqueCusts).sort());
    } catch (err: any) {
      console.error('Error fetching holding data:', err);
      toast.error('Failed to load holding items: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHoldingData();
  }, []);

  // Active Advanced Filters Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedGatepass !== 'All') count++;
    if (selectedInvoice !== 'All') count++;
    if (holdingStatusFilter !== 'holding_only') count++;
    if (minAmount !== '') count++;
    if (dateFrom || dateTo) count++;
    if (sortBy !== 'amount_desc') count++;
    return count;
  }, [selectedGatepass, selectedInvoice, holdingStatusFilter, minAmount, dateFrom, dateTo, sortBy]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedSalesman('All');
    setSelectedCustomer('All');
    setSelectedGatepass('All');
    setSelectedInvoice('All');
    setHoldingStatusFilter('holding_only');
    setMinAmount('');
    setSortBy('amount_desc');
    setDateFrom('');
    setDateTo('');
  };

  // Filtered Rows
  const filteredHoldingRows = useMemo(() => {
    return holdingRows
      .filter((row) => {
        // 1. Holding status
        if (holdingStatusFilter === 'holding_only' && row.holdQty <= 0) return false;
        if (holdingStatusFilter === 'zero_holding' && row.holdQty > 0) return false;

        // 2. Salesman
        if (selectedSalesman !== 'All' && row.salesman.toLowerCase() !== selectedSalesman.toLowerCase()) return false;

        // 3. Customer
        if (selectedCustomer !== 'All') {
          const cleanCust = selectedCustomer.replace(/^\[.*?\]\s*/, '').trim().toLowerCase();
          if (
            row.customerName.toLowerCase() !== cleanCust &&
            row.customerName.toLowerCase() !== selectedCustomer.toLowerCase()
          )
            return false;
        }

        // 4. Gatepass
        if (selectedGatepass !== 'All' && row.gatepassNo.toLowerCase() !== selectedGatepass.toLowerCase()) return false;

        // 5. Invoice
        if (selectedInvoice !== 'All' && row.invoiceNo.toLowerCase() !== selectedInvoice.toLowerCase()) return false;

        // 6. Date Range
        if (dateFrom && row.date < dateFrom) return false;
        if (dateTo && row.date > dateTo) return false;

        // 7. Min Amount
        if (minAmount !== '' && Number(minAmount) > 0) {
          if (row.heldAmount < Number(minAmount)) return false;
        }

        // 8. Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const match =
            row.productName.toLowerCase().includes(query) ||
            row.skuCode.toLowerCase().includes(query) ||
            row.customerName.toLowerCase().includes(query) ||
            row.salesman.toLowerCase().includes(query) ||
            row.gatepassNo.toLowerCase().includes(query) ||
            row.invoiceNo.toLowerCase().includes(query) ||
            row.warehouse.toLowerCase().includes(query);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'amount_desc') return b.heldAmount - a.heldAmount;
        if (sortBy === 'amount_asc') return a.heldAmount - b.heldAmount;
        if (sortBy === 'qty_desc') return b.holdQty - a.holdQty;
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        return 0;
      });
  }, [
    holdingRows,
    holdingStatusFilter,
    selectedSalesman,
    selectedCustomer,
    selectedGatepass,
    selectedInvoice,
    dateFrom,
    dateTo,
    minAmount,
    searchQuery,
    sortBy
  ]);

  // Aggregations for KPI Cards
  const kpis: HoldingKpis = useMemo(() => {
    let totalHeldQty = 0;
    let totalHeldValue = 0;
    let totalOrderQty = 0;
    let totalOrderValue = 0;
    const affectedGPs = new Set<string>();
    const affectedInvs = new Set<string>();
    const affectedCusts = new Set<string>();
    const affectedSMs = new Set<string>();

    filteredHoldingRows.forEach((row) => {
      totalHeldQty += row.holdQty;
      totalHeldValue += row.heldAmount;
      totalOrderQty += row.orderQty;
      totalOrderValue += row.totalOrderAmount;
      if (row.gatepassNo) affectedGPs.add(row.gatepassNo);
      if (row.invoiceNo && row.invoiceNo !== 'Direct') affectedInvs.add(row.invoiceNo);
      if (row.customerName) affectedCusts.add(row.customerName);
      if (row.salesman) affectedSMs.add(row.salesman);
    });

    return {
      totalItems: filteredHoldingRows.length,
      totalHeldQty,
      totalHeldValue,
      totalOrderQty,
      totalOrderValue,
      uniqueGatepasses: affectedGPs.size,
      uniqueInvoices: affectedInvs.size,
      uniqueCustomers: affectedCusts.size,
      uniqueSalesmen: affectedSMs.size
    };
  }, [filteredHoldingRows]);

  // Grouped Summaries for alternative tabs
  const salesmanSummary: SalesmanSummaryItem[] = useMemo(() => {
    const map: Record<
      string,
      {
        salesman: string;
        itemsCount: number;
        totalHeldQty: number;
        totalHeldValue: number;
        custSet: Set<string>;
        invSet: Set<string>;
        items: HoldingItemRow[];
      }
    > = {};

    filteredHoldingRows.forEach((row) => {
      const smKey = row.salesman || 'Unassigned';
      if (!map[smKey]) {
        map[smKey] = {
          salesman: smKey,
          itemsCount: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          custSet: new Set(),
          invSet: new Set(),
          items: []
        };
      }
      map[smKey].itemsCount += 1;
      map[smKey].totalHeldQty += Number(row.holdQty || 0);
      map[smKey].totalHeldValue += Number(row.heldAmount || 0);
      if (row.customerName) map[smKey].custSet.add(row.customerName);
      if (row.invoiceNo) map[smKey].invSet.add(row.invoiceNo);
      map[smKey].items.push(row);
    });

    return Object.values(map)
      .map((s) => ({
        salesman: s.salesman,
        itemsCount: s.itemsCount,
        totalHeldQty: s.totalHeldQty,
        totalHeldValue: s.totalHeldValue,
        custCount: s.custSet.size,
        invCount: s.invSet.size,
        items: s.items
      }))
      .sort((a, b) => b.totalHeldValue - a.totalHeldValue);
  }, [filteredHoldingRows]);

  const customerSummary: CustomerSummaryItem[] = useMemo(() => {
    const map: Record<
      string,
      {
        customer: string;
        itemsCount: number;
        totalHeldQty: number;
        totalHeldValue: number;
        gpSet: Set<string>;
        invSet: Set<string>;
        items: HoldingItemRow[];
      }
    > = {};

    filteredHoldingRows.forEach((row) => {
      const cKey = row.customerName || 'Counter Buyer';
      if (!map[cKey]) {
        map[cKey] = {
          customer: cKey,
          itemsCount: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          gpSet: new Set(),
          invSet: new Set(),
          items: []
        };
      }
      map[cKey].itemsCount += 1;
      map[cKey].totalHeldQty += Number(row.holdQty || 0);
      map[cKey].totalHeldValue += Number(row.heldAmount || 0);
      if (row.gatepassNo) map[cKey].gpSet.add(row.gatepassNo);
      if (row.invoiceNo) map[cKey].invSet.add(row.invoiceNo);
      map[cKey].items.push(row);
    });

    return Object.values(map)
      .map((c) => ({
        customer: c.customer,
        itemsCount: c.itemsCount,
        totalHeldQty: c.totalHeldQty,
        totalHeldValue: c.totalHeldValue,
        gpCount: c.gpSet.size,
        invCount: c.invSet.size,
        items: c.items
      }))
      .sort((a, b) => b.totalHeldValue - a.totalHeldValue);
  }, [filteredHoldingRows]);

  const gatepassSummary: GatepassSummaryItem[] = useMemo(() => {
    const map: Record<
      string,
      {
        gatepassNo: string;
        customer: string;
        salesman: string;
        date: string;
        itemsCount: number;
        totalOrderQty: number;
        totalDispatchedQty: number;
        totalHeldQty: number;
        totalHeldValue: number;
        status: string;
        items: HoldingItemRow[];
      }
    > = {};

    filteredHoldingRows.forEach((row) => {
      const gpKey = row.gatepassNo || 'Direct';
      if (!map[gpKey]) {
        map[gpKey] = {
          gatepassNo: gpKey,
          customer: row.customerName,
          salesman: row.salesman,
          date: row.date,
          itemsCount: 0,
          totalOrderQty: 0,
          totalDispatchedQty: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          status: row.status,
          items: []
        };
      }
      map[gpKey].itemsCount += 1;
      map[gpKey].totalOrderQty += Number(row.orderQty || 0);
      map[gpKey].totalDispatchedQty += Number(row.dispatchedQty || 0);
      map[gpKey].totalHeldQty += Number(row.holdQty || 0);
      map[gpKey].totalHeldValue += Number(row.heldAmount || 0);
      map[gpKey].items.push(row);
    });

    return Object.values(map).sort((a, b) => b.totalHeldValue - a.totalHeldValue);
  }, [filteredHoldingRows]);

  const invoiceSummary: InvoiceSummaryItem[] = useMemo(() => {
    const map: Record<
      string,
      {
        invoiceNo: string;
        customer: string;
        salesman: string;
        date: string;
        itemsCount: number;
        totalHeldQty: number;
        totalHeldValue: number;
        totalOrderAmount: number;
        items: HoldingItemRow[];
      }
    > = {};

    filteredHoldingRows.forEach((row) => {
      const invKey = row.invoiceNo || 'Direct';
      if (!map[invKey]) {
        map[invKey] = {
          invoiceNo: invKey,
          customer: row.customerName,
          salesman: row.salesman,
          date: row.date,
          itemsCount: 0,
          totalHeldQty: 0,
          totalHeldValue: 0,
          totalOrderAmount: 0,
          items: []
        };
      }
      map[invKey].itemsCount += 1;
      map[invKey].totalHeldQty += Number(row.holdQty || 0);
      map[invKey].totalHeldValue += Number(row.heldAmount || 0);
      map[invKey].totalOrderAmount += Number(row.totalOrderAmount || 0);
      map[invKey].items.push(row);
    });

    return Object.values(map).sort((a, b) => b.totalHeldValue - a.totalHeldValue);
  }, [filteredHoldingRows]);

  // Export to Excel Handler
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await exportHoldingReportToExcel({
        activePerspective,
        businessName,
        selectedSalesman,
        selectedCustomer,
        selectedGatepass,
        selectedInvoice,
        holdingStatusFilter,
        dateFrom,
        dateTo,
        filteredHoldingRows,
        salesmanSummary,
        customerSummary,
        gatepassSummary,
        invoiceSummary
      });
      toast.success('Excel workbook exported successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    navigate(`${tenantId ? `/${tenantId}` : ''}/Reports/Holding-Report/Print`, {
      state: {
        perspective: activePerspective,
        filters: {
          salesman: selectedSalesman,
          customer: selectedCustomer,
          gatepass: selectedGatepass,
          invoice: selectedInvoice,
          holdingStatus: holdingStatusFilter,
          dateFrom,
          dateTo,
          minAmount,
          sortBy
        },
        rows:
          activePerspective === 'detailed'
            ? filteredHoldingRows
            : activePerspective === 'salesman'
            ? salesmanSummary
            : activePerspective === 'customer'
            ? customerSummary
            : activePerspective === 'gatepass'
            ? gatepassSummary
            : invoiceSummary,
        kpis
      }
    });
  };

  // Paginated Data
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredHoldingRows.slice(startIndex, startIndex + pageSize);
  }, [filteredHoldingRows, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredHoldingRows.length / pageSize) || 1;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs antialiased font-sans pb-12">
      {/* ── TOP HEADER WITH FLOATING ACTION BUTTONS ── */}
      <HoldingHeaderCard
        onRefresh={loadHoldingData}
        onExportExcel={handleExportExcel}
        onPrint={handlePrint}
        exporting={exporting}
        hasRows={filteredHoldingRows.length > 0}
      />

      {/* ── TOP 4 EXECUTIVE KPI SUMMARY CARDS ── */}
      <HoldingKpiCards kpis={kpis} />

      {/* ── 5 PERSPECTIVE TAB HEADERS ── */}
      <HoldingPerspectiveTabs
        activePerspective={activePerspective}
        onSelectPerspective={(p) => {
          setActivePerspective(p);
          setCurrentPage(1);
        }}
        detailedCount={filteredHoldingRows.length}
        salesmanCount={salesmanSummary.length}
        customerCount={customerSummary.length}
        gatepassCount={gatepassSummary.length}
        invoiceCount={invoiceSummary.length}
      />

      {/* ── SMART COMPACT FILTER SYSTEM WITH SEARCHABLE TYPE-AHEAD DROPDOWNS ── */}
      <HoldingFiltersSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSalesman={selectedSalesman}
        setSelectedSalesman={setSelectedSalesman}
        salesmenList={salesmenList}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        customersList={customersList}
        selectedGatepass={selectedGatepass}
        setSelectedGatepass={setSelectedGatepass}
        gatepassesList={gatepassesList}
        selectedInvoice={selectedInvoice}
        setSelectedInvoice={setSelectedInvoice}
        invoicesList={invoicesList}
        holdingStatusFilter={holdingStatusFilter}
        setHoldingStatusFilter={setHoldingStatusFilter}
        minAmount={minAmount}
        setMinAmount={setMinAmount}
        sortBy={sortBy}
        setSortBy={setSortBy}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        showAdvancedFilters={showAdvancedFilters}
        setShowAdvancedFilters={setShowAdvancedFilters}
        activeFilterCount={activeFilterCount}
        onResetFilters={resetAllFilters}
      />

      {/* ── MAIN AUDIT DATATABLE / GROUPED VIEWS CONTAINER ── */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm p-5 space-y-4">
        {/* Results summary bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            Showing <strong className="text-emerald-600 font-mono">{filteredHoldingRows.length}</strong> holding records
            matching search criteria
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-bold text-xs outline-none"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* 1. DETAILED ITEMS VIEW */}
        {activePerspective === 'detailed' && (
          <DetailedHoldingView
            paginatedRows={paginatedRows}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

        {/* 2. SALESMAN-WISE ACCORDION SUMMARY VIEW */}
        {activePerspective === 'salesman' && (
          <SalesmanHoldingAccordion
            salesmanSummary={salesmanSummary}
            expandedGroupKeys={expandedGroupKeys}
            onToggleGroup={toggleGroupExpand}
          />
        )}

        {/* 3. CUSTOMER-WISE ACCORDION SUMMARY VIEW */}
        {activePerspective === 'customer' && (
          <CustomerHoldingAccordion
            customerSummary={customerSummary}
            expandedGroupKeys={expandedGroupKeys}
            onToggleGroup={toggleGroupExpand}
          />
        )}

        {/* 4. GATEPASS-WISE ACCORDION SUMMARY VIEW */}
        {activePerspective === 'gatepass' && (
          <GatepassHoldingAccordion
            gatepassSummary={gatepassSummary}
            expandedGroupKeys={expandedGroupKeys}
            onToggleGroup={toggleGroupExpand}
          />
        )}

        {/* 5. INVOICE-WISE ACCORDION SUMMARY VIEW */}
        {activePerspective === 'invoice' && (
          <InvoiceHoldingAccordion
            invoiceSummary={invoiceSummary}
            expandedGroupKeys={expandedGroupKeys}
            onToggleGroup={toggleGroupExpand}
          />
        )}
      </div>
    </div>
  );
};

export default HoldingReport;
