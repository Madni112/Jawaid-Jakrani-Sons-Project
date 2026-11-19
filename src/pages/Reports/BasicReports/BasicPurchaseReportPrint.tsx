import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { useAuth } from '../../../Context/Auth';
import Spinner from '../../../ui/Spinner';
import {
  MdArrowBack,
  MdPrint,
  MdFileDownload,
  MdViewModule,
  MdFormatListBulleted,
  MdClose,
  MdStore,
  MdReceipt,
  MdCheckCircle,
  MdInfoOutline
} from 'react-icons/md';
import { BasicPurchaseFilterCriteria } from './BasicPurchaseReport';
import { extractProductColor } from '../../../utils/colorService';

const STORAGE_CRITERIA_KEY = 'zac_basic_purchase_report_criteria';

export const BasicPurchaseReportPrint: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantId } = useAuth();

  // Active filter criteria
  const [criteria, setCriteria] = useState<BasicPurchaseFilterCriteria | null>(() => {
    if (location.state?.criteria) return location.state.criteria;
    try {
      const saved = localStorage.getItem(STORAGE_CRITERIA_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [businessName, setBusinessName] = useState<string>('Zohaib Ali & Company');
  const [rawPurchases, setRawPurchases] = useState<any[]>([]);
  const [vendorsMap, setVendorsMap] = useState<Record<string, any>>({});
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});

  // Layout Theme: 'modern' | 'classic'
  const [layoutTheme, setLayoutTheme] = useState<'modern' | 'classic'>(() => {
    try {
      return localStorage.getItem('jakwani_reports_layout') === 'classic' ? 'classic' : 'modern';
    } catch {}
    return 'modern';
  });

  // Modal inspection of invoice items
  const [inspectedBill, setInspectedBill] = useState<any | null>(null);

  const toggleLayout = () => {
    const next = layoutTheme === 'modern' ? 'classic' : 'modern';
    setLayoutTheme(next);
    try {
      localStorage.setItem('jakwani_reports_layout', next);
    } catch {}
  };

  // ── DATA FETCHING & LOCAL CACHE REUSE ──
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        // 1. Try reading cached products & vendors for instant display
        let cachedVendors: any[] | null = null;
        let cachedProducts: any[] | null = null;
        try {
          const cached =
            localStorage.getItem('zac_basic_purchase_meta_v1') ||
            sessionStorage.getItem('zac_basic_purchase_meta_v1');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed.vendors) && Array.isArray(parsed.productsMaster)) {
              cachedVendors = parsed.vendors;
              cachedProducts = parsed.productsMaster;
            }
          }
        } catch {}

        // 2. Fetch parallel range chunks for purchases
        const [p1, p2, venRes, prodRes] = await Promise.all([
          supabase
            .from('supplier_purchases')
            .select('*')
            .order('id', { ascending: false })
            .range(0, 999),
          supabase
            .from('supplier_purchases')
            .select('*')
            .order('id', { ascending: false })
            .range(1000, 2999),
          cachedVendors ? Promise.resolve({ data: cachedVendors }) : supabase.from('vendors').select('*'),
          cachedProducts ? Promise.resolve({ data: cachedProducts }) : supabase.from('products').select('*')
        ]);

        if (!isMounted) return;

        const combinedPurchases = [...(p1.data || []), ...(p2.data || [])];
        const loadedVendors = venRes.data || [];
        const loadedProducts = prodRes.data || [];

        // Build quick lookup maps
        const vMap: Record<string, any> = {};
        loadedVendors.forEach((v: any) => {
          if (v.id) vMap[String(v.id)] = v;
          if (v.vendor_name) vMap[v.vendor_name.trim().toLowerCase()] = v;
          if (v.name) vMap[v.name.trim().toLowerCase()] = v;
        });

        const prMap: Record<string, any> = {};
        loadedProducts.forEach((p: any) => {
          if (p.product_name) prMap[p.product_name.trim().toLowerCase()] = p;
          if (p.id) prMap[String(p.id)] = p;
        });

        setRawPurchases(combinedPurchases);
        setVendorsMap(vMap);
        setProductsMap(prMap);
      } catch (err) {
        console.error('Failed to load purchase report print data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── FILTER PURCHASES AGAINST USER CRITERIA ──
  const filteredPurchases = useMemo(() => {
    if (!criteria || rawPurchases.length === 0) return [];

    return rawPurchases.filter((p) => {
      // 1. Target Purchase Bills Filter
      if (criteria.purchaseIds && criteria.purchaseIds.length > 0) {
        const idMatches = criteria.purchaseIds.includes(String(p.id));
        const noMatches = p.purchase_no && criteria.purchaseIds.includes(p.purchase_no);
        if (!idMatches && !noMatches) return false;
      } else if (criteria.purchaseId) {
        const idMatches = String(p.id) === criteria.purchaseId;
        const noMatches = p.purchase_no && p.purchase_no === criteria.purchaseId;
        if (!idMatches && !noMatches) return false;
      }

      // 2. Date Filter
      const rawDate = p.purchase_date || p.created_at;
      if (rawDate) {
        const dateOnly = String(rawDate).split('T')[0];
        if (criteria.dateMode === 'single') {
          if (criteria.singleDate && dateOnly !== criteria.singleDate) return false;
        } else {
          if (criteria.dateFrom && dateOnly < criteria.dateFrom) return false;
          if (criteria.dateTo && dateOnly > criteria.dateTo) return false;
        }
      }

      // 3. Vendor Filter
      const pVendor = String(p.supplier_name || p.vendor_name || '').trim().toLowerCase();
      if (criteria.vendors && criteria.vendors.length > 0) {
        const vList = criteria.vendors.map((v) => v.trim().toLowerCase());
        if (!vList.includes(pVendor)) return false;
      } else if (criteria.vendor) {
        if (pVendor !== criteria.vendor.trim().toLowerCase()) return false;
      }

      // 4. Warehouse Filter
      const pWarehouse = String(p.target_warehouse || p.warehouse || '').trim().toLowerCase();
      if (criteria.warehouses && criteria.warehouses.length > 0) {
        const wList = criteria.warehouses.map((w) => w.trim().toLowerCase());
        if (!wList.includes(pWarehouse)) return false;
      } else if (criteria.warehouse) {
        if (pWarehouse !== criteria.warehouse.trim().toLowerCase()) return false;
      }

      // 5. Items parsing & product matching
      let itemsList: any[] = [];
      if (Array.isArray(p.items)) itemsList = p.items;
      else if (typeof p.items === 'string') {
        try {
          itemsList = JSON.parse(p.items);
        } catch {}
      }

      const hasCategoryFilter =
        (criteria.parentCategories && criteria.parentCategories.length > 0) ||
        (criteria.subCategories && criteria.subCategories.length > 0) ||
        (criteria.categories && criteria.categories.length > 0);
      const hasProductFilter = criteria.products && criteria.products.length > 0;
      const hasBrandFilter = criteria.brands && criteria.brands.length > 0;
      const hasColorFilter = criteria.colors && criteria.colors.length > 0;

      if (hasCategoryFilter || hasProductFilter || hasBrandFilter || hasColorFilter) {
        const parentSet = criteria.parentCategories
          ? new Set(criteria.parentCategories.map((x) => x.toLowerCase().trim()))
          : null;
        const subSet = criteria.subCategories
          ? new Set(criteria.subCategories.map((x) => x.toLowerCase().trim()))
          : null;
        const leafSet = criteria.categories
          ? new Set(criteria.categories.map((x) => x.toLowerCase().trim()))
          : null;
        const prodSet = criteria.products
          ? new Set(criteria.products.map((x) => x.toLowerCase().trim()))
          : null;
        const brandSet = criteria.brands
          ? new Set(criteria.brands.map((x) => x.toLowerCase().trim()))
          : null;
        const colorSet = criteria.colors
          ? new Set(criteria.colors.map((x) => x.toLowerCase().trim()))
          : null;

        const matchesAnyItem = itemsList.some((item) => {
          const itName = String(item.product_name || item.itemName || item.name || '').trim();
          const itLower = itName.toLowerCase();

          if (prodSet && !prodSet.has(itLower)) return false;

          const metaProd = productsMap[itLower] || {};
          const itBrand = String(metaProd.brand || item.brand || '').toLowerCase().trim();
          if (brandSet && !brandSet.has(itBrand)) return false;

          const itColor = String(extractProductColor(metaProd) || '').toLowerCase().trim();
          if (colorSet && !colorSet.has(itColor)) return false;

          const itParent = String(metaProd.parent_category || metaProd.sub_sub_category || '').toLowerCase().trim();
          if (parentSet && !parentSet.has(itParent)) return false;

          const itSub = String(metaProd.sub_category || '').toLowerCase().trim();
          if (subSet && !subSet.has(itSub)) return false;

          const itLeaf = String(metaProd.category || '').toLowerCase().trim();
          if (leafSet && !leafSet.has(itLeaf)) return false;

          return true;
        });

        if (!matchesAnyItem) return false;
      }

      return true;
    });
  }, [criteria, rawPurchases, productsMap]);

  // ── PARSE PURCHASES INTO UNIFIED AUDITED ROWS ──
  const parsedPurchaseRows = useMemo(() => {
    return filteredPurchases.map((p) => {
      let itemsList: any[] = [];
      if (Array.isArray(p.items)) itemsList = p.items;
      else if (typeof p.items === 'string') {
        try {
          itemsList = JSON.parse(p.items);
        } catch {}
      }

      // Check item-level filter constraints
      const hasSpecificFilter =
        (criteria?.products && criteria.products.length > 0) ||
        (criteria?.parentCategories && criteria.parentCategories.length > 0) ||
        (criteria?.subCategories && criteria.subCategories.length > 0) ||
        (criteria?.categories && criteria.categories.length > 0) ||
        (criteria?.brands && criteria.brands.length > 0) ||
        (criteria?.colors && criteria.colors.length > 0);

      let effectiveItems = itemsList;

      if (hasSpecificFilter) {
        const prodSet = criteria?.products
          ? new Set(criteria.products.map((x) => x.toLowerCase().trim()))
          : null;
        const brandSet = criteria?.brands
          ? new Set(criteria.brands.map((x) => x.toLowerCase().trim()))
          : null;
        const colorSet = criteria?.colors
          ? new Set(criteria.colors.map((x) => x.toLowerCase().trim()))
          : null;
        const parentSet = criteria?.parentCategories
          ? new Set(criteria.parentCategories.map((x) => x.toLowerCase().trim()))
          : null;
        const subSet = criteria?.subCategories
          ? new Set(criteria.subCategories.map((x) => x.toLowerCase().trim()))
          : null;
        const leafSet = criteria?.categories
          ? new Set(criteria.categories.map((x) => x.toLowerCase().trim()))
          : null;

        effectiveItems = itemsList.filter((item) => {
          const itName = String(item.product_name || item.itemName || item.name || '').trim();
          const itLower = itName.toLowerCase();

          if (prodSet && !prodSet.has(itLower)) return false;

          const metaProd = productsMap[itLower] || {};
          const itBrand = String(metaProd.brand || item.brand || '').toLowerCase().trim();
          if (brandSet && !brandSet.has(itBrand)) return false;

          const itColor = String(extractProductColor(metaProd) || '').toLowerCase().trim();
          if (colorSet && !colorSet.has(itColor)) return false;

          const itParent = String(metaProd.parent_category || metaProd.sub_sub_category || '').toLowerCase().trim();
          if (parentSet && !parentSet.has(itParent)) return false;

          const itSub = String(metaProd.sub_category || '').toLowerCase().trim();
          if (subSet && !subSet.has(itSub)) return false;

          const itLeaf = String(metaProd.category || '').toLowerCase().trim();
          if (leafSet && !leafSet.has(itLeaf)) return false;

          return true;
        });
      }

      // Compute item-level gross & quantity
      const calculatedGross = effectiveItems.reduce((sum, it) => {
        const q = Number(it.quantity || it.qty || 0);
        const r = Number(it.rate || it.cost_price || it.purchase_price || 0);
        const lineTotal = Number(it.total || it.total_amount || q * r);
        return sum + lineTotal;
      }, 0);

      const totalItemQty = effectiveItems.reduce((sum, it) => {
        return sum + Number(it.quantity || it.qty || 0);
      }, 0);

      const vInfo = vendorsMap[String(p.vendor_id)] || vendorsMap[String(p.supplier_name || '').trim().toLowerCase()];

      const rawGross = Number(p.total_amount || 0);
      const grossPurchaseAmount = hasSpecificFilter ? calculatedGross : rawGross;
      const discountAmount = Number(p.discount || 0);
      const freightAmount = Number(p.additional_charges || p.transport_charges || 0);
      const netTotalAmount = hasSpecificFilter ? calculatedGross - discountAmount + freightAmount : rawGross;

      const dateStr = p.purchase_date || String(p.created_at || '').split('T')[0];
      const purchaseNo = p.purchase_no || `PUR-${p.id}`;

      return {
        id: p.id,
        purchase_no: purchaseNo,
        bill_number: p.bill_number || '—',
        date: dateStr,
        vendor_name: p.supplier_name || p.vendor_name || 'Cash Vendor',
        vendorCode: vInfo?.vendor_code || vInfo?.vendorCode || '—',
        warehouse: p.target_warehouse || p.warehouse || 'Main Warehouse',
        terms: p.payment_term || 'Credit',
        grossPurchaseAmount,
        discountAmount,
        freightAmount,
        netTotalAmount,
        totalItemsCount: effectiveItems.length,
        totalItemQty,
        parsedItems: effectiveItems.map((it: any) => {
          const itName = it.product_name || it.itemName || it.name || 'Unnamed Product';
          const meta = productsMap[itName.toLowerCase().trim()] || {};
          return {
            product_name: itName,
            sku: it.sku || it.skuCode || it.item_sr_no || meta.sku || '—',
            brand: meta.brand || it.brand || '—',
            color: extractProductColor(meta) || 'General',
            qty: Number(it.quantity || it.qty || 0),
            uom: it.uom || meta.uom || 'Nos',
            rate: Number(it.rate || it.cost_price || it.purchase_price || 0),
            total: Number(it.total || it.total_amount || Number(it.quantity || it.qty || 0) * Number(it.rate || it.cost_price || it.purchase_price || 0))
          };
        })
      };
    });
  }, [filteredPurchases, productsMap, vendorsMap, criteria]);

  // ── SORTING ──
  const sortedPurchaseRows = useMemo(() => {
    const list = [...parsedPurchaseRows];
    if (!criteria?.sortBy) return list;

    switch (criteria.sortBy) {
      case 'date_desc':
        return list.sort((a, b) => b.date.localeCompare(a.date));
      case 'date_asc':
        return list.sort((a, b) => a.date.localeCompare(b.date));
      case 'bill_desc':
        return list.sort((a, b) => b.purchase_no.localeCompare(a.purchase_no));
      case 'bill_asc':
        return list.sort((a, b) => a.purchase_no.localeCompare(b.purchase_no));
      case 'vendor_asc':
        return list.sort((a, b) => a.vendor_name.localeCompare(b.vendor_name));
      case 'vendor_desc':
        return list.sort((a, b) => b.vendor_name.localeCompare(a.vendor_name));
      default:
        return list;
    }
  }, [parsedPurchaseRows, criteria?.sortBy]);

  // ── OVERALL TOP KPI TOTALS ──
  const kpiTotals = useMemo(() => {
    let totalBills = sortedPurchaseRows.length;
    let totalVendorsSet = new Set<string>();
    let totalItemsBought = 0;
    let totalQuantityBought = 0;
    let totalGrossPurchases = 0;
    let totalFreight = 0;
    let totalDiscounts = 0;
    let totalNetCost = 0;

    sortedPurchaseRows.forEach((row) => {
      if (row.vendor_name) totalVendorsSet.add(row.vendor_name.trim().toLowerCase());
      totalItemsBought += row.totalItemsCount;
      totalQuantityBought += row.totalItemQty;
      totalGrossPurchases += row.grossPurchaseAmount;
      totalFreight += row.freightAmount;
      totalDiscounts += row.discountAmount;
      totalNetCost += row.netTotalAmount;
    });

    return {
      totalBills,
      totalVendors: totalVendorsSet.size,
      totalItemsBought,
      totalQuantityBought,
      totalGrossPurchases,
      totalFreight,
      totalDiscounts,
      totalNetCost
    };
  }, [sortedPurchaseRows]);

  // ── HIERARCHICAL GROUPING FOR VENDOR / PRODUCT / BRAND / COLOR ──
  const groupedHierarchyData = useMemo(() => {
    if (!criteria || criteria.reportType === 'bill') return null;

    if (criteria.reportType === 'product') {
      const productMap: Record<string, { groupName: string; rows: any[] }> = {};

      sortedPurchaseRows.forEach((row) => {
        row.parsedItems.forEach((item: any) => {
          const pName = item.product_name || 'General Product';
          if (!productMap[pName]) {
            productMap[pName] = { groupName: pName, rows: [] };
          }
          productMap[pName].rows.push({
            date: row.date,
            purchase_no: row.purchase_no,
            vendor_name: row.vendor_name,
            vendorCode: row.vendorCode,
            warehouse: row.warehouse,
            terms: row.terms,
            qty: item.qty,
            uom: item.uom,
            rate: item.rate,
            discountAmount: 0,
            lineTotal: item.total
          });
        });
      });

      return Object.values(productMap).map((grp) => {
        const subQty = grp.rows.reduce((sum, r) => sum + r.qty, 0);
        const subGross = grp.rows.reduce((sum, r) => sum + r.lineTotal, 0);
        const subDiscounts = grp.rows.reduce((sum, r) => sum + r.discountAmount, 0);
        const subTotal = subGross - subDiscounts;
        return {
          groupName: grp.groupName,
          rows: grp.rows,
          subQty,
          subGross,
          subDiscounts,
          subFreight: 0,
          subTotal
        };
      });
    }

    // Group by Vendor, Brand, or Color
    const groupKeyMap: Record<string, { groupName: string; rows: any[] }> = {};

    sortedPurchaseRows.forEach((row) => {
      let key = 'General';
      if (criteria.reportType === 'vendor') key = row.vendor_name || 'Unknown Vendor';
      else if (criteria.reportType === 'brand') key = row.parsedItems[0]?.brand || 'Unbranded';
      else if (criteria.reportType === 'color') key = row.parsedItems[0]?.color || 'General';

      if (!groupKeyMap[key]) {
        groupKeyMap[key] = { groupName: key, rows: [] };
      }
      groupKeyMap[key].rows.push(row);
    });

    return Object.values(groupKeyMap).map((grp) => {
      const subGross = grp.rows.reduce((sum, r) => sum + r.grossPurchaseAmount, 0);
      const subDiscounts = grp.rows.reduce((sum, r) => sum + r.discountAmount, 0);
      const subFreight = grp.rows.reduce((sum, r) => sum + r.freightAmount, 0);
      const subTotal = grp.rows.reduce((sum, r) => sum + r.netTotalAmount, 0);
      return {
        groupName: grp.groupName,
        rows: grp.rows,
        subGross,
        subDiscounts,
        subFreight,
        subTotal
      };
    });
  }, [criteria, sortedPurchaseRows]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Basic Purchase Report - ${businessName}\r\n`;
    csvContent += `Report Type: ${criteria?.reportType?.toUpperCase()}\r\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\r\n\r\n`;

    if (criteria?.reportType === 'bill') {
      csvContent += 'S#,Date,Bill #,Vendor,Warehouse,Items Count,Terms,Gross Amount,Freight,Discount,Net Total\r\n';
      sortedPurchaseRows.forEach((r, idx) => {
        csvContent += `${idx + 1},${r.date},"${r.purchase_no}","${r.vendor_name}","${r.warehouse}",${r.totalItemsCount},"${r.terms}",${Math.round(r.grossPurchaseAmount)},${Math.round(r.freightAmount)},${Math.round(r.discountAmount)},${Math.round(r.netTotalAmount)}\r\n`;
      });
    } else {
      csvContent += 'Group,Date,Bill #,Vendor,Qty,Rate,Net Total\r\n';
      groupedHierarchyData?.forEach((grp) => {
        grp.rows.forEach((r) => {
          csvContent += `"${grp.groupName}",${r.date},"${r.purchase_no}","${r.vendor_name}",${r.qty || r.totalItemQty || 0},${r.rate || 0},${Math.round(r.lineTotal || r.netTotalAmount || 0)}\r\n`;
        });
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchase_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isClassic = layoutTheme === 'classic';

  if (!criteria) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <MdInfoOutline size={36} className="text-amber-500" />
        <h2 className="text-lg font-bold">No Purchase Filter Criteria Found</h2>
        <p className="text-sm text-gray-500">
          Please select your criteria on the Basic Purchase Report filter page first.
        </p>
        <button
          onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/basic-purchase-report`)}
          className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
        >
          Go to Purchase Filters
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Generating Basic Purchase Report...
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isClassic ? 'bg-white text-black font-serif' : 'bg-gray-50 dark:bg-boxdark-2 text-black dark:text-white font-sans'}`}>
      {/* ── TOP ACTION BAR (HIDDEN IN PRINT) ── */}
      <div className="print:hidden sticky top-0 z-40 bg-white/90 dark:bg-boxdark/90 backdrop-blur border-b border-stroke dark:border-strokedark px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/basic-purchase-report`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-100 dark:hover:bg-meta-4 transition shadow-xs cursor-pointer"
          >
            <MdArrowBack size={16} />
            <span>Back to Filters</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-100 dark:hover:bg-meta-4 transition shadow-xs cursor-pointer"
              title="Toggle Modern / Classic Print Layout"
            >
              {isClassic ? <MdViewModule size={16} /> : <MdFormatListBulleted size={16} />}
              <span>{isClassic ? 'Switch to Modern' : 'Switch to Classic'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark hover:bg-gray-100 dark:hover:bg-meta-4 transition shadow-xs cursor-pointer text-emerald-600"
            >
              <MdFileDownload size={16} />
              <span>Export CSV</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition shadow-sm cursor-pointer"
            >
              <MdPrint size={16} />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── PRINT CONTENT WRAPPER ── */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 print:p-0 print:max-w-none">
        {/* ── 1. REPORT HEADER ── */}
        <div className={`pb-4 border-b ${isClassic ? 'border-black text-center' : 'border-stroke dark:border-strokedark flex flex-wrap items-center justify-between gap-4'}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-primary/10 text-primary dark:text-white border border-primary/20">
                BASIC PURCHASE DEPARTMENT
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-bold text-gray-500 uppercase">
                {criteria.reportType.toUpperCase()} WISE REGISTER
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-black dark:text-white uppercase">
              {businessName || 'Zohaib Ali & Company'}
            </h1>
          </div>

          <div className={`text-xs ${isClassic ? 'mt-2' : 'text-right text-gray-500 dark:text-gray-400'}`}>
            <p>
              Period:{' '}
              <strong className="text-black dark:text-white">
                {criteria.dateMode === 'single'
                  ? criteria.singleDate
                  : `${criteria.dateFrom} → ${criteria.dateTo}`}
              </strong>
            </p>
            <p className="text-[11px] mt-0.5">Print Date: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        {/* ── 2. TOP KPI SUMMARY METRIC CARDS (ROUNDED WITH NO "..." CLIPPING) ── */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 ${isClassic ? 'border-b border-black pb-3 mb-4 text-center' : 'mb-6'}`}>
          {[
            {
              label: 'Total Bills',
              value: kpiTotals.totalBills.toLocaleString(),
              note: `${kpiTotals.totalVendors} Unique Vendors`
            },
            {
              label: 'Items Bought',
              value: `${kpiTotals.totalItemsBought.toLocaleString()} Items`,
              note: `Qty: ${Math.round(kpiTotals.totalQuantityBought).toLocaleString()} Total`
            },
            {
              label: 'Gross Purchases',
              value: `Rs. ${Math.round(kpiTotals.totalGrossPurchases).toLocaleString()}`,
              note: 'Before adjustments'
            },
            {
              label: 'Total Discounts',
              value: kpiTotals.totalDiscounts > 0 ? `-Rs. ${Math.round(kpiTotals.totalDiscounts).toLocaleString()}` : 'Rs. 0',
              note: 'Vendor discounts',
              textColor: 'text-red-600 dark:text-red-400'
            },
            {
              label: 'Total Freight',
              value: kpiTotals.totalFreight > 0 ? `Rs. ${Math.round(kpiTotals.totalFreight).toLocaleString()}` : 'Rs. 0',
              note: 'Inward carriage',
              textColor: 'text-blue-600 dark:text-blue-400'
            },
            {
              label: 'Net Procurement Cost',
              value: `Rs. ${Math.round(kpiTotals.totalNetCost).toLocaleString()}`,
              note: 'Final audited spend',
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

        {/* ── 3. MODE 1: PURCHASE BILL WISE REPORT TABLE ── */}
        {criteria.reportType === 'bill' && (
          <div className="overflow-x-auto">
            <table className={`w-full text-left border-collapse ${isClassic ? 'border border-black text-xs' : 'text-xs'}`}>
              <thead>
                <tr className={`${isClassic ? 'border-b-2 border-black bg-gray-100 font-bold' : 'border-b border-stroke dark:border-strokedark bg-gray-100/70 dark:bg-meta-4/40 text-gray-600 dark:text-gray-300 font-bold'}`}>
                  <th className="py-2.5 px-2 text-center w-10">S#</th>
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-2">Bill #</th>
                  <th className="py-2.5 px-2">Vendor Name & Code</th>
                  <th className="py-2.5 px-2">Warehouse</th>
                  <th className="py-2.5 px-2">Products Summary</th>
                  <th className="py-2.5 px-2">Terms</th>
                  <th className="py-2.5 px-2 text-right">Gross Amount</th>
                  <th className="py-2.5 px-2 text-right">Freight</th>
                  <th className="py-2.5 px-2 text-right">Discount</th>
                  <th className="py-2.5 px-2 text-right">Total Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark">
                {sortedPurchaseRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-400">
                      No purchase records found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  sortedPurchaseRows.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50/80 dark:hover:bg-meta-4/20 transition ${
                        isClassic ? (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50') : ''
                      }`}
                    >
                      <td className="py-2 px-2 text-center text-gray-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap font-mono text-gray-600 dark:text-gray-300 text-[11px]">
                        {r.date}
                      </td>
                      <td className="py-2 px-2 font-mono font-bold text-primary">
                        {r.purchase_no}
                      </td>
                      <td className="py-2 px-2 font-medium">
                        {r.vendor_name}{' '}
                        <span className="text-[10px] text-gray-400 font-mono">({r.vendorCode})</span>
                      </td>
                      <td className="py-2 px-2 text-gray-500">
                        {r.warehouse}
                      </td>
                      <td className="py-2 px-2">
                        <button
                          type="button"
                          onClick={() => setInspectedBill(r)}
                          className="text-left group cursor-pointer inline-flex items-center gap-1"
                        >
                          <span className="font-semibold text-black dark:text-white group-hover:text-primary transition">
                            {r.totalItemsCount} {r.totalItemsCount === 1 ? 'item' : 'items'} ({r.totalItemQty} qty)
                          </span>
                          <span className="text-[10px] text-primary underline">▼ items</span>
                        </button>
                      </td>
                      <td className="py-2 px-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-gray-300">
                          {r.terms}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-semibold">
                        {Math.round(r.grossPurchaseAmount).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-gray-500">
                        {r.freightAmount > 0 ? Math.round(r.freightAmount).toLocaleString() : '—'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-red-600">
                        {r.discountAmount > 0 ? `-${Math.round(r.discountAmount).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-black dark:text-white">
                        {Math.round(r.netTotalAmount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className={`${isClassic ? 'border-t-2 border-b-4 border-double border-black font-black bg-gray-100' : 'border-t-2 border-stroke dark:border-strokedark font-black bg-gray-50 dark:bg-meta-4/40 text-black dark:text-white'}`}>
                  <td colSpan={7} className="py-3 px-2 text-right uppercase tracking-wider text-xs">
                    Grand Total ({kpiTotals.totalBills} Bills):
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-xs">
                    Rs. {Math.round(kpiTotals.totalGrossPurchases).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-xs text-gray-600 dark:text-gray-300">
                    Rs. {Math.round(kpiTotals.totalFreight).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-xs text-red-600">
                    -Rs. {Math.round(kpiTotals.totalDiscounts).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-xs text-primary font-black">
                    Rs. {Math.round(kpiTotals.totalNetCost).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── 4. MODES 2, 3, 4, 5: HIERARCHICAL GROUPED TABLES (Vendor / Product / Brand / Color) ── */}
        {criteria.reportType !== 'bill' && groupedHierarchyData && (
          <div className="space-y-6">
            {groupedHierarchyData.length === 0 ? (
              <div className="py-8 text-center text-gray-400 border border-stroke dark:border-strokedark rounded-xl">
                No purchase transactions found for this perspective.
              </div>
            ) : (
              groupedHierarchyData.map((group, gIdx) => (
                <div
                  key={gIdx}
                  className={`overflow-hidden rounded-xl ${
                    isClassic
                      ? 'border border-black'
                      : 'border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-xs'
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
                        {criteria.reportType === 'product' && '📦 PRODUCT: '}
                        {criteria.reportType === 'vendor' && '🏢 VENDOR: '}
                        {criteria.reportType === 'brand' && '🏷️ BRAND: '}
                        {criteria.reportType === 'color' && '🎨 COLOR: '}
                        <strong>{group.groupName}</strong>
                      </span>
                      <span className="text-[10px] font-normal opacity-80">
                        ({group.rows.length} transactions)
                      </span>
                    </span>
                    <span className="font-mono text-xs font-bold">
                      Group Total: Rs. {Math.round(group.subTotal).toLocaleString()}
                    </span>
                  </div>

                  {/* Group Transactions Table */}
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`${isClassic ? 'border-b border-black bg-gray-50 font-bold' : 'border-b border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 text-gray-600 dark:text-gray-300 font-semibold'}`}>
                        <th className="py-2 px-2 text-center w-10">S#</th>
                        <th className="py-2 px-2">Date</th>
                        <th className="py-2 px-2">Bill #</th>
                        <th className="py-2 px-2">Vendor</th>
                        {criteria.reportType === 'product' ? (
                          <>
                            <th className="py-2 px-2 text-center">Qty Bought</th>
                            <th className="py-2 px-2 text-right">Unit Rate</th>
                            <th className="py-2 px-2 text-right">Discounts</th>
                            <th className="py-2 px-2 text-right">Line Total</th>
                          </>
                        ) : (
                          <>
                            <th className="py-2 px-2">Warehouse</th>
                            <th className="py-2 px-2 text-right">Gross Amount</th>
                            <th className="py-2 px-2 text-right">Discount</th>
                            <th className="py-2 px-2 text-right">Freight</th>
                            <th className="py-2 px-2 text-right">Net Total</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stroke dark:divide-strokedark">
                      {group.rows.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-gray-50/50 dark:hover:bg-meta-4/10">
                          <td className="py-1.5 px-2 text-center text-gray-400 font-mono text-[11px]">
                            {rIdx + 1}
                          </td>
                          <td className="py-1.5 px-2 font-mono text-[11px] whitespace-nowrap text-gray-600 dark:text-gray-300">
                            {r.date}
                          </td>
                          <td className="py-1.5 px-2 font-mono font-bold text-primary">
                            {r.purchase_no}
                          </td>
                          <td className="py-1.5 px-2">
                            {r.vendor_name}{' '}
                            <span className="text-[10px] text-gray-400 font-mono">({r.vendorCode})</span>
                          </td>
                          {criteria.reportType === 'product' ? (
                            <>
                              <td className="py-1.5 px-2 text-center font-bold font-mono">
                                {r.qty} {r.uom}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono">
                                Rs. {Number(r.rate).toLocaleString()}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-red-600">
                                {r.discountAmount > 0 ? `-Rs. ${Math.round(r.discountAmount).toLocaleString()}` : '—'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-bold text-black dark:text-white">
                                Rs. {Math.round(r.lineTotal).toLocaleString()}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-1.5 px-2 text-gray-500">
                                {r.warehouse}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-semibold">
                                {Math.round(r.grossPurchaseAmount).toLocaleString()}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-red-600">
                                {r.discountAmount > 0 ? `-${Math.round(r.discountAmount).toLocaleString()}` : '—'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-gray-500">
                                {r.freightAmount > 0 ? Math.round(r.freightAmount).toLocaleString() : '—'}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono font-bold text-black dark:text-white">
                                {Math.round(r.netTotalAmount).toLocaleString()}
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
                Grand Total ({kpiTotals.totalBills} Bills across {groupedHierarchyData.length} {criteria.reportType}s):
              </span>
              <span className="font-mono text-base">
                Rs. {Math.round(kpiTotals.totalNetCost).toLocaleString()}
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

      {/* ── ITEM DETAILS INSPECTION DRAWER / MODAL ── */}
      {inspectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-boxdark rounded-2xl max-w-2xl w-full border border-stroke dark:border-strokedark shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4/30">
              <div className="flex items-center gap-2">
                <MdReceipt className="text-primary" size={20} />
                <div>
                  <h3 className="text-sm font-black text-black dark:text-white">
                    Bill Items Breakdown: {inspectedBill.purchase_no}
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    Vendor: {inspectedBill.vendor_name} • Date: {inspectedBill.date} • {inspectedBill.warehouse}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedBill(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-black dark:hover:text-white"
              >
                <MdClose size={20} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-stroke dark:border-strokedark text-gray-500 font-bold">
                    <th className="py-2 px-1 text-center w-8">#</th>
                    <th className="py-2 px-2">Product Title</th>
                    <th className="py-2 px-2">SKU</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Unit Rate</th>
                    <th className="py-2 px-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke/60 dark:divide-strokedark/60">
                  {inspectedBill.parsedItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-400">
                        No product items stored on this bill.
                      </td>
                    </tr>
                  ) : (
                    inspectedBill.parsedItems.map((it: any, iIdx: number) => (
                      <tr key={iIdx} className="hover:bg-gray-50 dark:hover:bg-meta-4/10">
                        <td className="py-2 px-1 text-center font-mono text-gray-400">{iIdx + 1}</td>
                        <td className="py-2 px-2 font-medium">{it.product_name}</td>
                        <td className="py-2 px-2 font-mono text-gray-400">{it.sku}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold">
                          {it.qty} {it.uom}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">
                          Rs. {it.rate.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-black text-black dark:text-white">
                          Rs. {it.total.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stroke dark:border-strokedark font-black text-black dark:text-white">
                    <td colSpan={3} className="py-2 px-2 text-right uppercase text-[11px]">
                      Bill Total:
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-blue-600">
                      {inspectedBill.totalItemQty} Total
                    </td>
                    <td className="py-2 px-2"></td>
                    <td className="py-2 px-2 text-right font-mono text-primary">
                      Rs. {Math.round(inspectedBill.netTotalAmount).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedBill(null)}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gray-200 dark:bg-meta-4 text-black dark:text-white hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicPurchaseReportPrint;
