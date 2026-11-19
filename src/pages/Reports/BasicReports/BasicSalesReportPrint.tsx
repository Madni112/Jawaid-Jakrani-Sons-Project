import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { useAuth } from '../../../Context/Auth';
import Spinner from '../../../ui/Spinner';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  MdPrint,
  MdArrowBack,
  MdFileDownload,
  MdChevronRight,
  MdExpandMore,
  MdUnfoldMore,
  MdUnfoldLess,
  MdTableChart,
  MdLayers,
  MdCheckCircle,
  MdTune
} from 'react-icons/md';
import { BasicSalesFilterCriteria } from './BasicSalesReport';
import { extractProductColor } from '../../../utils/colorService';

const STORAGE_CRITERIA_KEY = 'zac_basic_sales_report_criteria';

export const BasicSalesReportPrint: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { businessName } = useAuth();

  // Load Criteria from location.state or fallback to sessionStorage
  const criteria: BasicSalesFilterCriteria = useMemo(() => {
    if (location.state?.criteria) return location.state.criteria;
    try {
      const saved = sessionStorage.getItem(STORAGE_CRITERIA_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      reportType: 'invoice',
      dateMode: 'multi',
      sortBy: 'date_desc'
    };
  }, [location.state]);

  const [loading, setLoading] = useState(true);
  const [rawInvoices, setRawInvoices] = useState<any[]>([]);
  const [customersMap, setCustomersMap] = useState<Record<string, any>>({});
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});

  // Layout Theme: 'modern' | 'classic'
  const [layoutTheme, setLayoutTheme] = useState<'modern' | 'classic'>(() => {
    try {
      return localStorage.getItem('jakwani_reports_layout') === 'classic' ? 'classic' : 'modern';
    } catch {
      return 'modern';
    }
  });

  // Global & Per-Row Breakdown Expansion (High-Speed O(1) State)
  const [expandAllBreakdown, setExpandAllBreakdown] = useState(false);
  const [individualToggledIds, setIndividualToggledIds] = useState<Set<string>>(new Set());

  // Check if a row is expanded: O(1) instant lookup
  const isRowExpanded = (invId: string | number) => {
    const idStr = String(invId);
    if (expandAllBreakdown) {
      return !individualToggledIds.has(idStr); // Expanded unless individually collapsed
    }
    return individualToggledIds.has(idStr); // Collapsed unless individually expanded
  };

  // Toggle layout theme and save to localStorage
  const handleToggleLayoutTheme = (theme: 'modern' | 'classic') => {
    setLayoutTheme(theme);
    try {
      localStorage.setItem('jakwani_reports_layout', theme);
    } catch {}
  };

  // Toggle breakdown for a specific invoice (instant O(1))
  const toggleInvoiceBreakdown = (invId: string) => {
    setIndividualToggledIds((prev) => {
      const next = new Set(prev);
      if (next.has(invId)) {
        next.delete(invId);
      } else {
        next.add(invId);
      }
      return next;
    });
  };

  // Toggle all breakdowns (Instant 0ms flip without looping 1,600+ items)
  const handleToggleAllBreakdowns = () => {
    setExpandAllBreakdown((prev) => !prev);
    setIndividualToggledIds(new Set()); // Reset individual overrides
  };

  // Load Database Records with fetchAllPages
  useEffect(() => {
    let isMounted = true;
    const fetchReportData = async () => {
      try {
        setLoading(true);

        // Build targeted SQL query with criteria pushed down to Supabase
        let invQuery = supabase
          .from('sales_invoices')
          .select(
            'id, invoice_no, customer_name, sale_date, payment_term, dispatch_warehouse, salesman, transport_name, transport_charges, additional_charges, total_amount, items, created_at, receipt_status, sale_status'
          )
          .order('id', { ascending: false });

        // 1. Target Invoice(s)
        if (criteria.reportType === 'invoice') {
          if (criteria.invoiceIds && criteria.invoiceIds.length > 0) {
            invQuery = invQuery.in('id', criteria.invoiceIds);
          } else if (criteria.invoiceId) {
            invQuery = invQuery.eq('id', criteria.invoiceId);
          }
        } else {
          // 2. Date Filtering directly in SQL
          if (criteria.dateMode === 'single' && criteria.singleDate) {
            invQuery = invQuery.eq('sale_date', criteria.singleDate);
          } else if (criteria.dateMode === 'multi') {
            if (criteria.dateFrom) invQuery = invQuery.gte('sale_date', criteria.dateFrom);
            if (criteria.dateTo) invQuery = invQuery.lte('sale_date', criteria.dateTo);
          }

          // 3. Customer filtering directly in SQL
          if (criteria.customers && criteria.customers.length > 0 && !criteria.customers.includes('All')) {
            invQuery = invQuery.in('customer_name', criteria.customers);
          } else if (criteria.customer && criteria.customer !== 'All') {
            invQuery = invQuery.eq('customer_name', criteria.customer);
          }

          // 4. Salesman filtering directly in SQL
          if (criteria.reportType === 'salesmen') {
            if (criteria.salesmen && criteria.salesmen.length > 0 && !criteria.salesmen.includes('All')) {
              invQuery = invQuery.in('salesman', criteria.salesmen);
            } else if (criteria.salesman && criteria.salesman !== 'All') {
              invQuery = invQuery.eq('salesman', criteria.salesman);
            }
          }
        }

        let cachedCustomers: any[] | null = null;
        let cachedProducts: any[] | null = null;
        try {
          const cached =
            localStorage.getItem('zac_basic_sales_meta_v3') ||
            sessionStorage.getItem('zac_basic_sales_meta_v3') ||
            sessionStorage.getItem('zac_basic_sales_meta_v2');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed.customers) && Array.isArray(parsed.productsMaster)) {
              cachedCustomers = parsed.customers;
              cachedProducts = parsed.productsMaster;
            }
          }
        } catch {}

        const promises: Promise<any>[] = [fetchAllPages(invQuery)];

        if (!cachedCustomers) {
          promises.push(
            fetchAllPages(
              supabase
                .from('customers')
                .select('id, customerName, customer_code, customerCode, city, address, primaryPhone')
            )
          );
        }

        if (!cachedProducts) {
          promises.push(
            fetchAllPages(
              supabase
                .from('products')
                .select('id, product_name, category, sub_category, sub_sub_category, brand, item_sr_no, retail_price, uom, product_description')
            )
          );
        }

        const results = await Promise.all(promises);
        if (!isMounted) return;

        const invRes = results[0];
        const custData = cachedCustomers || results[1]?.data || [];
        const prodData = cachedProducts || (cachedCustomers ? results[1]?.data : results[2]?.data) || [];

        // Build Quick Lookup Dictionaries
        const cMap: Record<string, any> = {};
        custData.forEach((c: any) => {
          const nameKey = (c.customerName || '').trim().toLowerCase();
          if (nameKey) cMap[nameKey] = c;
        });
        setCustomersMap(cMap);

        const pMap: Record<string, any> = {};
        prodData.forEach((p: any) => {
          const nameKey = (p.product_name || '').trim().toLowerCase();
          if (nameKey) pMap[nameKey] = p;
        });
        setProductsMap(pMap);

        setRawInvoices(invRes.data || []);
      } catch (err: any) {
        toast.error('Failed to load report invoices: ' + err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReportData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & Normalize Raw Invoices according to Criteria
  const filteredInvoices = useMemo(() => {
    if (!rawInvoices || rawInvoices.length === 0) return [];

    let pool = [...rawInvoices];

    // 1. Report Mode Specific Primary Constraint (Supports Multi-Select)
    if (criteria.reportType === 'invoice') {
      if (criteria.invoiceIds && criteria.invoiceIds.length > 0) {
        const idSet = new Set(criteria.invoiceIds.map(String));
        pool = pool.filter((inv) => idSet.has(String(inv.id)));
      } else if (criteria.invoiceId) {
        pool = pool.filter((inv) => String(inv.id) === String(criteria.invoiceId));
      }
    } else if (criteria.reportType === 'salesmen') {
      const activeSalesmen = criteria.salesmen && criteria.salesmen.length > 0
        ? criteria.salesmen.filter((s) => s && s !== 'All').map((s) => s.trim().toLowerCase())
        : criteria.salesman && criteria.salesman !== 'All'
        ? [criteria.salesman.trim().toLowerCase()]
        : [];
      if (activeSalesmen.length > 0) {
        pool = pool.filter((inv) => activeSalesmen.includes((inv.salesman || '').trim().toLowerCase()));
      }
    }

    // 2. Customer Constraint (Supports Multi-Select)
    const activeCustomers = criteria.customers && criteria.customers.length > 0
      ? criteria.customers.filter((c) => c && c !== 'All').map((c) => c.trim().toLowerCase())
      : criteria.customer && criteria.customer !== 'All'
      ? [criteria.customer.trim().toLowerCase()]
      : [];
    if (activeCustomers.length > 0) {
      pool = pool.filter((inv) => activeCustomers.includes((inv.customer_name || '').trim().toLowerCase()));
    }

    // 3. Date Constraint
    if (criteria.dateMode === 'single' && criteria.singleDate) {
      pool = pool.filter((inv) => {
        const d = inv.sale_date || (inv.created_at ? inv.created_at.split('T')[0] : '');
        return d === criteria.singleDate;
      });
    } else if (criteria.dateMode === 'multi' && (criteria.dateFrom || criteria.dateTo)) {
      pool = pool.filter((inv) => {
        const d = inv.sale_date || (inv.created_at ? inv.created_at.split('T')[0] : '');
        if (!d) return false;
        if (criteria.dateFrom && d < criteria.dateFrom) return false;
        if (criteria.dateTo && d > criteria.dateTo) return false;
        return true;
      });
    }

    // 4. Item-Level Constraints (Categories, Products, Brand, Color - Supports Multi-Select)
    const activeBrands = criteria.brands && criteria.brands.length > 0
      ? criteria.brands.filter((b) => b && b !== 'All').map((b) => b.trim().toLowerCase())
      : criteria.brand && criteria.brand !== 'All'
      ? [criteria.brand.trim().toLowerCase()]
      : [];

    const activeColors = criteria.colors && criteria.colors.length > 0
      ? criteria.colors.filter((c) => c && c !== 'All').map((c) => c.trim().toLowerCase())
      : criteria.color && criteria.color !== 'All'
      ? [criteria.color.trim().toLowerCase()]
      : [];

    const hasCategoryFilter = Boolean(
      (criteria.parentCategories && criteria.parentCategories.length > 0) ||
      (criteria.subCategories && criteria.subCategories.length > 0) ||
      (criteria.categories && criteria.categories.length > 0) ||
      (criteria.products && criteria.products.length > 0) ||
      activeBrands.length > 0 ||
      activeColors.length > 0
    );

    if (hasCategoryFilter) {
      pool = pool.filter((inv) => {
        const items = Array.isArray(inv.items)
          ? inv.items
          : (typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : []);
        if (!items || items.length === 0) return false;

        return items.some((it: any) => {
          const itemName = (it.itemName || it.product_name || it.name || '').trim().toLowerCase();
          const prodMeta = productsMap[itemName];

          // Specific Product filter
          if (criteria.products && criteria.products.length > 0) {
            const matchesProd = criteria.products.some((p) => p.trim().toLowerCase() === itemName);
            if (!matchesProd) return false;
          }

          // Parent Category filter
          if (criteria.parentCategories && criteria.parentCategories.length > 0) {
            const parent = (prodMeta?.sub_sub_category || '').trim();
            if (!criteria.parentCategories.includes(parent)) return false;
          }

          // Sub Category filter
          if (criteria.subCategories && criteria.subCategories.length > 0) {
            const sub = (prodMeta?.sub_category || '').trim();
            if (!criteria.subCategories.includes(sub)) return false;
          }

          // Leaf Category filter
          if (criteria.categories && criteria.categories.length > 0) {
            const leaf = (prodMeta?.category || '').trim();
            if (!criteria.categories.includes(leaf)) return false;
          }

          // Brand filter (Multi-Select)
          if (activeBrands.length > 0) {
            const b1 = (prodMeta?.brand || '').trim().toLowerCase();
            const b2 = (prodMeta?.sub_category || '').trim().toLowerCase();
            const b3 = (prodMeta?.sub_sub_category || '').trim().toLowerCase();
            if (!activeBrands.includes(b1) && !activeBrands.includes(b2) && !activeBrands.includes(b3)) {
              return false;
            }
          }

          // Color filter (Multi-Select)
          if (activeColors.length > 0) {
            const itemColor = extractProductColor(prodMeta || { product_description: itemName }).toLowerCase();
            const matches = activeColors.some((c) => itemColor.includes(c) || itemName.includes(c));
            if (!matches) return false;
          }

          return true;
        });
      });
    }

    // 5. Sorting (Includes Customer A-Z and Customer Z-A)
    pool.sort((a, b) => {
      const dateA = a.sale_date || a.created_at || '';
      const dateB = b.sale_date || b.created_at || '';
      const idA = Number(a.id || 0);
      const idB = Number(b.id || 0);
      const custA = (a.customer_name || '').trim().toLowerCase();
      const custB = (b.customer_name || '').trim().toLowerCase();

      switch (criteria.sortBy) {
        case 'date_asc':
          return dateA.localeCompare(dateB) || idA - idB;
        case 'date_desc':
          return dateB.localeCompare(dateA) || idB - idA;
        case 'invoice_asc':
          return idA - idB;
        case 'customer_asc':
          return custA.localeCompare(custB) || idB - idA;
        case 'customer_desc':
          return custB.localeCompare(custA) || idB - idA;
        case 'invoice_desc':
        default:
          return idB - idA;
      }
    });

    return pool;
  }, [rawInvoices, criteria, productsMap]);

  // Aggregate Helper Calculations per Invoice
  const parsedInvoiceRows = useMemo(() => {
    return filteredInvoices.map((inv) => {
      const items = Array.isArray(inv.items)
        ? inv.items
        : (typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : []);

      let totalItemQty = 0;
      let grossItemAmount = 0;
      let lineDiscounts = 0;

      const detailedItems = items.map((it: any) => {
        const qty = Number(it.qty || it.quantity || it.boxQty || 0);
        const rate = Number(it.pricePerBox || it.rp || it.rate || it.pricePerPiece || 0);
        const disc = Number(it.discountAmt || it.discount_amount || 0);
        const lineTotal = Number(it.amount || it.netTotal || qty * rate - disc);

        totalItemQty += qty;
        grossItemAmount += qty * rate;
        lineDiscounts += disc;

        const prodMeta = productsMap[(it.itemName || it.product_name || '').trim().toLowerCase()];

        return {
          code: it.skuCode || it.sku || prodMeta?.item_sr_no || '—',
          name: it.itemName || it.product_name || 'Standard Item',
          uom: it.uom || prodMeta?.uom || 'Box',
          qty,
          rate,
          discount: disc,
          lineTotal
        };
      });

      const freight = Number(inv.transport_charges || 0) + Number(inv.additional_charges || 0);
      const overallDisc = Number(inv.discount_amount || items[0]?._overallDiscount || lineDiscounts || 0);
      const netTotal = Number(inv.total_amount || grossItemAmount + freight - overallDisc);

      const custDetails = customersMap[(inv.customer_name || '').trim().toLowerCase()];
      const customerCode = custDetails?.customer_code || custDetails?.customerCode || '—';

      return {
        ...inv,
        parsedItems: detailedItems,
        totalItemsCount: detailedItems.length,
        totalItemQty,
        grossSaleAmount: grossItemAmount > 0 ? grossItemAmount : netTotal - freight + overallDisc,
        freightAmount: freight,
        discountAmount: overallDisc,
        netTotalAmount: netTotal,
        customerCode,
        customerAddress: custDetails?.city || custDetails?.address || ''
      };
    });
  }, [filteredInvoices, productsMap, customersMap]);

  // Overall KPI Card Totals
  const kpiTotals = useMemo(() => {
    let totalInvoices = parsedInvoiceRows.length;
    let totalCustomersSet = new Set<string>();
    let totalItemsSold = 0;
    let totalQuantitySold = 0;
    let totalGrossSales = 0;
    let totalFreight = 0;
    let totalDiscounts = 0;
    let totalNetRevenue = 0;

    parsedInvoiceRows.forEach((row) => {
      if (row.customer_name) totalCustomersSet.add(row.customer_name.trim().toLowerCase());
      totalItemsSold += row.totalItemsCount || (row.parsedItems?.length || 0);
      totalQuantitySold += row.totalItemQty;
      totalGrossSales += row.grossSaleAmount;
      totalFreight += row.freightAmount;
      totalDiscounts += row.discountAmount;
      totalNetRevenue += row.netTotalAmount;
    });

    return {
      totalInvoices,
      totalCustomers: totalCustomersSet.size,
      totalItemsSold,
      totalQuantitySold,
      totalGrossSales,
      totalFreight,
      totalDiscounts,
      totalNetRevenue
    };
  }, [parsedInvoiceRows]);

  // Grouped Hierarchies for Modes 2, 3, 4, 5 (Salesmen / Brand / Color / Product)
  const groupedHierarchyData = useMemo(() => {
    if (criteria.reportType === 'invoice') return null;

    // ── MODE: PRODUCT WISE HIERARCHY ──
    if (criteria.reportType === 'product') {
      const prodGroupMap: Record<string, any[]> = {};

      parsedInvoiceRows.forEach((inv) => {
        inv.parsedItems.forEach((it: any) => {
          // If specific products filter is active, only include matching products
          if (criteria.products && criteria.products.length > 0) {
            const matches = criteria.products.some(
              (p) => p.trim().toLowerCase() === it.name.trim().toLowerCase()
            );
            if (!matches) return;
          }

          const prodKey = it.name || 'Standard Item';
          if (!prodGroupMap[prodKey]) prodGroupMap[prodKey] = [];

          prodGroupMap[prodKey].push({
            id: `${inv.id}-${it.code}-${Math.random()}`,
            sale_date: inv.sale_date || inv.created_at?.split('T')[0] || '—',
            invoice_no: inv.invoice_no || inv.id,
            customer_name: inv.customer_name || 'Cash Customer',
            customerCode: inv.customerCode,
            product_code: it.code,
            product_name: it.name,
            uom: it.uom,
            qty: it.qty,
            rate: it.rate,
            discount: it.discount,
            grossSaleAmount: it.qty * it.rate,
            discountAmount: it.discount,
            freightAmount: 0,
            netTotalAmount: it.lineTotal
          });
        });
      });

      return Object.keys(prodGroupMap)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => {
          const rows = prodGroupMap[key];
          const subQty = rows.reduce((s, r) => s + r.qty, 0);
          const subGross = rows.reduce((s, r) => s + r.grossSaleAmount, 0);
          const subDiscounts = rows.reduce((s, r) => s + r.discountAmount, 0);
          const subFreight = 0;
          const subTotal = rows.reduce((s, r) => s + r.netTotalAmount, 0);
          const uom = rows[0]?.uom || 'Qty';

          return {
            groupName: key,
            groupMeta: `Total Sold: ${subQty.toLocaleString()} ${uom}`,
            rows,
            subQty,
            subGross,
            subDiscounts,
            subFreight,
            subTotal
          };
        });
    }

    const groupMap: Record<string, any[]> = {};

    parsedInvoiceRows.forEach((inv) => {
      let groupKey = 'Unassigned';

      if (criteria.reportType === 'salesmen') {
        groupKey = (inv.salesman || 'Direct House Sales').trim();
      } else if (criteria.reportType === 'brand') {
        const firstItem = inv.parsedItems[0];
        const prod = firstItem ? productsMap[firstItem.name.trim().toLowerCase()] : null;
        groupKey = (prod?.brand || prod?.sub_category || prod?.sub_sub_category || criteria.brands?.join(', ') || criteria.brand || 'General Brand').trim();
      } else if (criteria.reportType === 'color') {
        const firstItem = inv.parsedItems[0];
        const prod = firstItem ? productsMap[firstItem.name.trim().toLowerCase()] : null;
        groupKey = extractProductColor(prod || { product_description: firstItem?.name || '' }) || criteria.colors?.join(', ') || criteria.color || 'Standard';
      }

      if (!groupMap[groupKey]) groupMap[groupKey] = [];
      groupMap[groupKey].push(inv);
    });

    // Sort Groups A to Z
    return Object.keys(groupMap)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => {
        const rows = groupMap[key];
        const subGross = rows.reduce((s, r) => s + r.grossSaleAmount, 0);
        const subDiscounts = rows.reduce((s, r) => s + r.discountAmount, 0);
        const subFreight = rows.reduce((s, r) => s + r.freightAmount, 0);
        const subTotal = rows.reduce((s, r) => s + r.netTotalAmount, 0);

        return {
          groupName: key,
          rows,
          subGross,
          subDiscounts,
          subFreight,
          subTotal
        };
      });
  }, [parsedInvoiceRows, criteria.reportType, criteria.brand, criteria.brands, criteria.color, criteria.colors, criteria.products, productsMap]);

  // Export Table Data directly to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const sheetRows: any[] = [];

      if (criteria.reportType === 'invoice') {
        parsedInvoiceRows.forEach((r, idx) => {
          sheetRows.push({
            'S.No': idx + 1,
            'Date': r.sale_date || r.created_at?.split('T')[0] || '—',
            'Invoice #': r.invoice_no || `#${r.id}`,
            'Customer Name': r.customer_name || 'Cash',
            'Customer Code': r.customerCode,
            'Products Summary': `${r.totalItemsCount} items (${r.totalItemQty} qty)`,
            'Payment Terms': r.payment_term || 'Cash',
            'Gross Sale (Rs)': r.grossSaleAmount,
            'Freight Charges (Rs)': r.freightAmount,
            'Discounts (Rs)': r.discountAmount,
            'Net Invoice Total (Rs)': r.netTotalAmount
          });
        });
      } else if (groupedHierarchyData) {
        groupedHierarchyData.forEach((grp) => {
          grp.rows.forEach((r, idx) => {
            sheetRows.push({
              'Group / Header': grp.groupName,
              'S.No': idx + 1,
              'Date': r.sale_date || r.created_at?.split('T')[0] || '—',
              'Invoice #': r.invoice_no || `#${r.id}`,
              'Customer Name': r.customer_name || 'Cash',
              'Customer Code': r.customerCode,
              'Gross Sale (Rs)': r.grossSaleAmount,
              'Discounts (Rs)': r.discountAmount,
              'Freight Charges (Rs)': r.freightAmount,
              'Net Total (Rs)': r.netTotalAmount
            });
          });
          sheetRows.push({
            'Group / Header': `SUBTOTAL: ${grp.groupName}`,
            'S.No': '',
            'Date': '',
            'Invoice #': '',
            'Customer Name': '',
            'Customer Code': '',
            'Gross Sale (Rs)': grp.subGross,
            'Discounts (Rs)': grp.subDiscounts,
            'Freight Charges (Rs)': grp.subFreight,
            'Net Total (Rs)': grp.subTotal
          });
        });
      }

      const ws = XLSX.utils.json_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Basic_Sales_Report');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(
        new Blob([wbout], { type: 'application/octet-stream' }),
        `Basic_Sales_Report_${criteria.reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success('Sales report exported to Excel!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Generating Basic Sales Report ledger...
        </p>
      </div>
    );
  }

  const isClassic = layoutTheme === 'classic';

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-boxdark-2 py-4 px-2 md:px-6 print:bg-white print:p-0">
      
      {/* ── ON-SCREEN STICKY CONTROLS TOOLBAR (Hidden in Print) ── */}
      <div className="print:hidden max-w-7xl mx-auto mb-5 p-3 rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-md flex flex-wrap items-center justify-between gap-3 sticky top-2 z-50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/basic-sales-report`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stroke dark:border-strokedark text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 transition"
          >
            <MdArrowBack size={16} />
            <span>Edit Filters</span>
          </button>

          <span className="text-gray-300 dark:text-gray-600">|</span>

          {/* Modern vs Classic Layout Switcher Pill */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-gray-100 dark:bg-meta-4 border border-stroke dark:border-strokedark">
            <button
              type="button"
              onClick={() => handleToggleLayoutTheme('modern')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                !isClassic
                  ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <span>🎨 Modern Layout</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleLayoutTheme('classic')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                isClassic
                  ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                  : 'text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <span>📜 Classic Ledger</span>
            </button>
          </div>

          {/* Breakdown Toggle (for Invoice Wise) */}
          {criteria.reportType === 'invoice' && (
            <button
              type="button"
              onClick={handleToggleAllBreakdowns}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                expandAllBreakdown
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-700 dark:text-blue-300'
                  : 'border-stroke dark:border-strokedark text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4'
              }`}
            >
              {expandAllBreakdown ? <MdUnfoldLess size={16} /> : <MdUnfoldMore size={16} />}
              <span>{expandAllBreakdown ? 'Collapse All Items' : 'Expand All Items'}</span>
            </button>
          )}
        </div>

        {/* Print & Excel Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <MdFileDownload size={16} />
            <span>Excel Export</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black shadow-md transition cursor-pointer active:scale-98"
          >
            <MdPrint size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── REPORT CANVAS SHEET ── */}
      <div className={`max-w-7xl mx-auto ${isClassic ? 'bg-white text-black p-4 border border-black shadow-none font-serif' : 'bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm p-5 md:p-8 space-y-6 text-black dark:text-white font-sans'} print:p-0 print:border-none print:shadow-none print:bg-white print:text-black`}>

        {/* ── 1. REPORT HEADER BLOCK ── */}
        {isClassic ? (
          /* CLASSIC FORMAL ACCOUNTING HEADER */
          <div className="border-b-2 border-black pb-3 mb-4 text-center">
            <h1 className="text-xl font-black uppercase tracking-wider">{businessName || 'ZOHAIB ALI AND COMPANY'}</h1>
            <h2 className="text-sm font-bold uppercase underline mt-0.5">
              BASIC SALES REPORT — {criteria.reportType.toUpperCase()} REGISTER
            </h2>
            <div className="flex items-center justify-between text-[11px] font-mono mt-2 pt-1 border-t border-black">
              <span>Date Window: {criteria.dateMode === 'single' ? criteria.singleDate : `${criteria.dateFrom || 'Start'} to ${criteria.dateTo || 'End'}`}</span>
              <span>Sorted: {criteria.sortBy.replace('_', ' ').toUpperCase()}</span>
              <span>Generated: {new Date().toLocaleString('en-PK')}</span>
            </div>
          </div>
        ) : (
          /* MODERN BRANDED HEADER WITH GLASS BADGE */
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stroke dark:border-strokedark">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Basic Sales Department
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {criteria.reportType === 'invoice'
                    ? 'Invoice Wise Audit Register'
                    : criteria.reportType === 'product'
                    ? 'Product Wise Turnover & SKU Hierarchy'
                    : criteria.reportType === 'salesmen'
                    ? 'Salesmen Sales Performance'
                    : criteria.reportType === 'brand'
                    ? 'Brand Wise Turnover'
                    : 'Color & Surface Shade Analysis'}
                </span>
              </div>
              <h1 className="text-2xl font-black text-black dark:text-white tracking-tight mt-1">
                {businessName || 'Zohaib Ali & Company'}
              </h1>
            </div>

            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
              <p>Period: <strong className="text-black dark:text-white">{criteria.dateMode === 'single' ? criteria.singleDate : `${criteria.dateFrom} → ${criteria.dateTo}`}</strong></p>
              <p className="text-[11px] mt-0.5">Print Date: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        )}

        {/* ── 2. TOP KPI SUMMARY METRIC CARDS ── */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 ${isClassic ? 'border-b border-black pb-3 mb-4 text-center' : 'mb-6'}`}>
          {[
            {
              label: 'Total Invoices',
              value: kpiTotals.totalInvoices.toLocaleString(),
              note: `${kpiTotals.totalCustomers} Unique Customers`
            },
            {
              label: 'Items Sold',
              value: `${kpiTotals.totalItemsSold.toLocaleString()} Items`,
              note: `Qty: ${Math.round(kpiTotals.totalQuantitySold).toLocaleString()} Total`
            },
            {
              label: 'Gross Sale Amount',
              value: `Rs. ${Math.round(kpiTotals.totalGrossSales).toLocaleString()}`,
              note: 'Before adjustments'
            },
            {
              label: 'Total Discounts',
              value: kpiTotals.totalDiscounts > 0 ? `-Rs. ${Math.round(kpiTotals.totalDiscounts).toLocaleString()}` : 'Rs. 0',
              note: 'Trade & invoice discounts',
              textColor: 'text-red-600 dark:text-red-400'
            },
            {
              label: 'Total Freight',
              value: kpiTotals.totalFreight > 0 ? `Rs. ${Math.round(kpiTotals.totalFreight).toLocaleString()}` : 'Rs. 0',
              note: 'Transport & carriage',
              textColor: 'text-blue-600 dark:text-blue-400'
            },
            {
              label: 'Net Sales Revenue',
              value: `Rs. ${Math.round(kpiTotals.totalNetRevenue).toLocaleString()}`,
              note: 'Final audited turnover',
              highlight: true
            }
          ].map((kpi, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl min-w-0 ${
                isClassic
                  ? 'border border-black bg-white'
                  : kpi.highlight
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-gray-50 dark:bg-meta-4/30 border border-stroke dark:border-strokedark'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-500 dark:text-gray-400 truncate">
                {kpi.label}
              </span>
              <span className={`text-xs sm:text-sm lg:text-[15px] xl:text-base font-black block mt-0.5 leading-tight tracking-tight break-words ${kpi.textColor || ''}`}>
                {kpi.value}
              </span>
              <span className="text-[9px] text-gray-400 block mt-0.5 truncate">{kpi.note}</span>
            </div>
          ))}
        </div>

        {/* ── 3. MODE 1: INVOICE WISE REPORT TABLE ── */}
        {criteria.reportType === 'invoice' && (
          <div className="overflow-x-auto">
            <table className={`w-full text-left border-collapse ${isClassic ? 'border border-black text-xs' : 'text-xs'}`}>
              <thead>
                <tr className={`${isClassic ? 'border-b-2 border-black bg-gray-100 font-bold' : 'border-b border-stroke dark:border-strokedark bg-gray-100/70 dark:bg-meta-4/40 text-gray-600 dark:text-gray-300 font-bold'}`}>
                  <th className="py-2.5 px-2 text-center w-10">S#</th>
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-2">Invoice #</th>
                  <th className="py-2.5 px-2">Customer Name & Code</th>
                  <th className="py-2.5 px-2">Products Summary</th>
                  <th className="py-2.5 px-2">Terms</th>
                  <th className="py-2.5 px-2 text-right">Sale Amount</th>
                  <th className="py-2.5 px-2 text-right">Freight</th>
                  <th className="py-2.5 px-2 text-right">Discount</th>
                  <th className="py-2.5 px-2 text-right">Total Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark">
                {parsedInvoiceRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-400">
                      No invoices found matching selected criteria.
                    </td>
                  </tr>
                ) : (
                  parsedInvoiceRows.map((inv, idx) => {
                    const isExpanded = isRowExpanded(inv.id);

                    return (
                      <React.Fragment key={inv.id}>
                        {/* Master Row with content-visibility for ultra-fast rendering */}
                        <tr
                          onClick={() => toggleInvoiceBreakdown(String(inv.id))}
                          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 38px' }}
                          className={`cursor-pointer transition select-none ${
                            isClassic
                              ? 'hover:bg-gray-50 border-b border-black/40'
                              : 'hover:bg-blue-50/40 dark:hover:bg-meta-4/20'
                          } ${isExpanded ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}`}
                        >
                          <td className="py-2 px-2 text-center font-mono">{idx + 1}</td>
                          <td className="py-2 px-2 whitespace-nowrap">
                            {inv.sale_date || inv.created_at?.split('T')[0] || '—'}
                          </td>
                          <td className="py-2 px-2 font-bold whitespace-nowrap text-primary">
                            #{inv.invoice_no || inv.id}
                          </td>
                          <td className="py-2 px-2">
                            <div className="font-bold leading-tight">{inv.customer_name || 'Cash Customer'}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              Code: {inv.customerCode} {inv.customerAddress ? `• ${inv.customerAddress}` : ''}
                            </div>
                          </td>
                          <td className="py-2 px-2 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                              <span>{inv.totalItemsCount} item{inv.totalItemsCount !== 1 ? 's' : ''} ({inv.totalItemQty} qty)</span>
                              <span className="text-[10px] text-primary underline">
                                {isExpanded ? '▲ hide' : '▼ items'}
                              </span>
                            </span>
                          </td>
                          <td className="py-2 px-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              inv.payment_term === 'Cash'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            }`}>
                              {inv.payment_term || 'Cash'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-mono">
                            {inv.grossSaleAmount.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-gray-500">
                            {inv.freightAmount > 0 ? inv.freightAmount.toLocaleString() : '—'}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-red-500">
                            {inv.discountAmount > 0 ? `-${inv.discountAmount.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2 px-2 text-right font-bold font-mono text-black dark:text-white">
                            {inv.netTotalAmount.toLocaleString()}
                          </td>
                        </tr>

                        {/* Breakdown Sub-Table Drawer */}
                        {isExpanded && (
                          <tr
                            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 90px' }}
                            className="bg-slate-50/80 dark:bg-meta-4/20 print:bg-transparent"
                          >
                            <td colSpan={10} className="p-3 pl-8">
                              <div className={`p-3 rounded-xl ${isClassic ? 'border border-black bg-white' : 'border border-blue-200 dark:border-blue-900 bg-white dark:bg-boxdark shadow-xs'}`}>
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                                  <MdTableChart size={14} />
                                  <span>Invoice Line Items Breakdown (#{inv.invoice_no || inv.id})</span>
                                </h4>
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-stroke dark:border-strokedark text-gray-500 text-[10px] font-bold uppercase">
                                      <th className="py-1 px-1.5 text-left">Code / SKU</th>
                                      <th className="py-1 px-1.5 text-left">Product Description</th>
                                      <th className="py-1 px-1.5 text-center">Qty (UOM)</th>
                                      <th className="py-1 px-1.5 text-right">Unit Rate</th>
                                      <th className="py-1 px-1.5 text-right">Discount</th>
                                      <th className="py-1 px-1.5 text-right">Line Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-stroke/60 dark:divide-strokedark/60 font-mono">
                                    {inv.parsedItems.map((it: any, itemIdx: number) => (
                                      <tr key={itemIdx} className="hover:bg-gray-50/50">
                                        <td className="py-1 px-1.5 font-bold text-gray-600 dark:text-gray-300">{it.code}</td>
                                        <td className="py-1 px-1.5 font-sans font-medium">{it.name}</td>
                                        <td className="py-1 px-1.5 text-center font-bold">{it.qty} {it.uom}</td>
                                        <td className="py-1 px-1.5 text-right">Rs. {it.rate.toLocaleString()}</td>
                                        <td className="py-1 px-1.5 text-right text-red-500">
                                          {it.discount > 0 ? `-Rs. ${it.discount.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="py-1 px-1.5 text-right font-bold text-black dark:text-white">
                                          Rs. {it.lineTotal.toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>

              {/* Grand Total Footer */}
              <tfoot>
                <tr className={`${isClassic ? 'border-t-2 border-b-4 border-double border-black font-black bg-gray-100' : 'border-t-2 border-stroke dark:border-strokedark font-black bg-gray-50 dark:bg-meta-4/40 text-black dark:text-white'}`}>
                  <td colSpan={6} className="py-3 px-2 text-right uppercase tracking-wider text-xs">
                    Grand Total ({kpiTotals.totalInvoices} Invoices):
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-xs">
                    Rs. {Math.round(kpiTotals.totalGrossSales).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-xs text-gray-600 dark:text-gray-300">
                    Rs. {Math.round(kpiTotals.totalFreight).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-xs text-red-600">
                    -Rs. {Math.round(kpiTotals.totalDiscounts).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-xs text-primary font-black">
                    Rs. {Math.round(kpiTotals.totalNetRevenue).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── 4. MODES 2, 3, 4: HIERARCHICAL GROUPED TABLES (Salesmen / Brand / Color) ── */}
        {criteria.reportType !== 'invoice' && groupedHierarchyData && (
          <div className="space-y-6">
            {groupedHierarchyData.length === 0 ? (
              <div className="p-8 text-center text-gray-400 border border-dashed rounded-xl">
                No matching transactions found for this grouping.
              </div>
            ) : (
              groupedHierarchyData.map((group, grpIdx) => (
                <div
                  key={grpIdx}
                  className={`overflow-hidden rounded-xl ${
                    isClassic
                      ? 'border border-black mb-4'
                      : 'border border-stroke dark:border-strokedark mb-5 bg-white dark:bg-boxdark shadow-2xs'
                  }`}
                >
                  {/* Group Header Banner */}
                  <div
                    className={`py-2 px-3 flex items-center justify-between font-bold text-xs ${
                      isClassic
                        ? 'bg-black text-white'
                        : 'bg-gradient-to-r from-slate-100 to-gray-50 dark:from-meta-4 dark:to-boxdark border-b border-stroke dark:border-strokedark text-black dark:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm uppercase tracking-wide">
                      <span>
                        {criteria.reportType === 'product' ? '📦 PRODUCT' : `🏷️ ${criteria.reportType.toUpperCase()}`}:{' '}
                        <strong>{group.groupName}</strong>
                      </span>
                      {group.groupMeta && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold normal-case">
                          {group.groupMeta}
                        </span>
                      )}
                      <span className="text-[10px] font-normal opacity-80">
                        ({group.rows.length} {criteria.reportType === 'product' ? 'sales lines' : 'transactions'})
                      </span>
                    </span>
                    <span className="font-mono text-xs font-bold">
                      Group Total: Rs. {group.subTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Group Transactions Table */}
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`${isClassic ? 'border-b border-black bg-gray-50 font-bold' : 'border-b border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 text-gray-600 dark:text-gray-300 font-semibold'}`}>
                        <th className="py-2 px-2 text-center w-10">S#</th>
                        <th className="py-2 px-2">Date</th>
                        <th className="py-2 px-2">Invoice #</th>
                        <th className="py-2 px-2">Customer</th>
                        {criteria.reportType === 'product' ? (
                          <>
                            <th className="py-2 px-2 text-center">Qty Sold</th>
                            <th className="py-2 px-2 text-right">Unit Rate</th>
                            <th className="py-2 px-2 text-right">Discounts</th>
                            <th className="py-2 px-2 text-right">Line Total</th>
                          </>
                        ) : (
                          <>
                            <th className="py-2 px-2 text-right">Sale Amount</th>
                            <th className="py-2 px-2 text-right">Discounts</th>
                            <th className="py-2 px-2 text-right">Freight</th>
                            <th className="py-2 px-2 text-right">Total Net</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stroke/70 dark:divide-strokedark/70">
                      {group.rows.map((r, rIdx) => (
                        <tr
                          key={r.id}
                          className={isClassic ? 'hover:bg-gray-50' : 'hover:bg-blue-50/30 dark:hover:bg-meta-4/20'}
                        >
                          <td className="py-1.5 px-2 text-center font-mono">{rIdx + 1}</td>
                          <td className="py-1.5 px-2 whitespace-nowrap">{r.sale_date || r.created_at?.split('T')[0] || '—'}</td>
                          <td className="py-1.5 px-2 font-bold font-mono text-primary">#{r.invoice_no || r.id}</td>
                          <td className="py-1.5 px-2 font-semibold">
                            {r.customer_name} <span className="text-[10px] text-gray-400 font-mono">({r.customerCode})</span>
                          </td>
                          {criteria.reportType === 'product' ? (
                            <>
                              <td className="py-1.5 px-2 text-center font-bold font-mono">
                                {r.qty} {r.uom}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono">Rs. {Number(r.rate).toLocaleString()}</td>
                              <td className="py-1.5 px-2 text-right font-mono text-red-500">
                                {r.discountAmount > 0 ? `-Rs. ${r.discountAmount.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-bold text-black dark:text-white">
                                Rs. {r.netTotalAmount.toLocaleString()}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-1.5 px-2 text-right font-mono">{r.grossSaleAmount.toLocaleString()}</td>
                              <td className="py-1.5 px-2 text-right font-mono text-red-500">
                                {r.discountAmount > 0 ? `-${r.discountAmount.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-gray-500">
                                {r.freightAmount > 0 ? r.freightAmount.toLocaleString() : '—'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-bold text-black dark:text-white">
                                {r.netTotalAmount.toLocaleString()}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>

                    {/* Group Subtotal Row */}
                    <tfoot>
                      <tr className={`${isClassic ? 'border-t-2 border-black font-black bg-gray-100' : 'border-t border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/30 font-black text-black dark:text-white'}`}>
                        <td colSpan={4} className="py-2 px-2 text-right uppercase tracking-wider text-[11px]">
                          Subtotal ({group.groupName}):
                        </td>
                        {criteria.reportType === 'product' ? (
                          <>
                            <td className="py-2 px-2 text-center font-mono text-[11px] font-black text-blue-600">
                              {group.subQty?.toLocaleString()} {group.rows[0]?.uom}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-[11px] text-gray-400">
                              Avg: Rs. {group.subQty > 0 ? Math.round(group.subGross / group.subQty).toLocaleString() : 0}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-[11px] text-red-600">
                              {group.subDiscounts > 0 ? `-Rs. ${Math.round(group.subDiscounts).toLocaleString()}` : '—'}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-[11px] text-primary font-black">
                              Rs. {Math.round(group.subTotal).toLocaleString()}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-2 text-right font-mono text-[11px]">
                              Rs. {Math.round(group.subGross).toLocaleString()}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-[11px] text-red-600">
                              -Rs. {Math.round(group.subDiscounts).toLocaleString()}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-[11px] text-gray-600">
                              Rs. {Math.round(group.subFreight).toLocaleString()}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-[11px] text-primary">
                              Rs. {Math.round(group.subTotal).toLocaleString()}
                            </td>
                          </>
                        )}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))
            )}

            {/* Overall Grand Summary for Grouped Views */}
            <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-black ${
              isClassic
                ? 'border-t-2 border-b-4 border-double border-black bg-gray-100'
                : 'bg-primary/10 border border-primary/20 text-primary dark:text-white'
            }`}>
              <span className="uppercase tracking-wider">
                Grand Total ({kpiTotals.totalInvoices} Invoices across {groupedHierarchyData.length} {criteria.reportType}s):
              </span>
              <span className="font-mono text-base">
                Rs. {Math.round(kpiTotals.totalNetRevenue).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* ── 5. FORMAL REPORT SIGNATURE / AUDIT FOOTER ── */}
        <div className={`pt-6 mt-8 flex items-center justify-between text-[11px] text-gray-500 border-t ${isClassic ? 'border-black' : 'border-stroke dark:border-strokedark'}`}>
          <div>
            <span>Audited Electronic Statement • System Master ID: {businessName || 'ZAC-ERP'}</span>
          </div>
          <div className="flex items-center gap-12 text-center">
            <div>
              <div className="w-28 border-b border-gray-400 mb-1"></div>
              <span>Prepared By</span>
            </div>
            <div>
              <div className="w-28 border-b border-gray-400 mb-1"></div>
              <span>Verified / Approved</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BasicSalesReportPrint;
