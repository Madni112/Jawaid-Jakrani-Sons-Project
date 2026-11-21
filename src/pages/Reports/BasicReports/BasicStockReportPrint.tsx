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
  MdInventory,
  MdWarehouse,
  MdCategory,
  MdWarning,
  MdHourglassEmpty,
  MdInfoOutline,
  MdCheckCircle
} from 'react-icons/md';
import { BasicStockFilterCriteria } from './BasicStockReport';
import { extractProductColor } from '../../../utils/colorService';

// Helper to format stock quantity so loose tiles and loose items never show in decimal points
export const formatStockQty = (
  qty: number,
  prod?: any,
  short: boolean = false
): string => {
  const num = Number(qty) || 0;
  const isNegative = num < 0;
  const absQty = Math.abs(num);

  const uom = String(prod?.uom || '').toLowerCase().trim();
  const cat = String(prod?.category || prod?.sub_category || prod?.sub_sub_category || '').toLowerCase().trim();

  const rawPcs = Number(
    prod?.loose_conversion_ratio ||
    prod?.pieces_per_box ||
    prod?.pcs_per_box ||
    prod?.pieces_per_packing ||
    0
  );

  const isBoxProduct =
    uom === 'box' ||
    uom === 'boxes' ||
    cat.includes('tile') ||
    rawPcs > 1 ||
    Boolean(prod?.isTileItem);

  let piecesPerBox = rawPcs > 1 ? rawPcs : 0;
  if (piecesPerBox <= 1 && prod?.product_description) {
    const match = String(prod.product_description).match(/Box:\s*(\d+)\s*pcs/i);
    if (match && Number(match[1]) > 0) piecesPerBox = Number(match[1]);
  }

  // Decimal fraction detection if piecesPerBox was not explicit
  if (piecesPerBox <= 1 && isBoxProduct) {
    if (Math.abs(absQty - Math.round(absQty)) > 0.0001) {
      const fraction = absQty - Math.floor(absQty);
      for (const cand of [12, 6, 8, 4, 10, 16, 24, 2]) {
        const pcs = fraction * cand;
        if (Math.abs(pcs - Math.round(pcs)) < 0.01) {
          piecesPerBox = cand;
          break;
        }
      }
    }
  }
  if (piecesPerBox <= 1 && isBoxProduct) {
    piecesPerBox = 4;
  }

  if (isBoxProduct && piecesPerBox > 1) {
    const totalPieces = Math.round(absQty * piecesPerBox);
    const boxes = Math.floor(totalPieces / piecesPerBox);
    const loose = totalPieces % piecesPerBox;

    const boxLabel = short ? 'Bx' : boxes === 1 ? 'Box' : 'Boxes';
    const pcsLabel = short ? 'pc' : 'Pcs';
    const prefix = isNegative ? '-' : '';

    if (boxes > 0 && loose > 0) {
      return `${prefix}${boxes.toLocaleString()} ${boxLabel} + ${loose} ${pcsLabel}`;
    } else if (boxes > 0) {
      return `${prefix}${boxes.toLocaleString()} ${boxLabel}`;
    } else if (loose > 0) {
      return `${prefix}${loose} ${pcsLabel}`;
    } else {
      return `0 ${boxLabel}`;
    }
  }

  // Check if allow_loose_sales product with ratio
  if (prod?.allow_loose_sales && rawPcs > 1) {
    const totalPieces = Math.round(absQty * rawPcs);
    const bulk = Math.floor(totalPieces / rawPcs);
    const loose = totalPieces % rawPcs;
    const bulkLabel = prod?.uom || 'Unit';
    const looseLabel = prod?.loose_uom || 'Pcs';
    const prefix = isNegative ? '-' : '';

    if (bulk > 0 && loose > 0) {
      return `${prefix}${bulk.toLocaleString()} ${bulkLabel} + ${loose} ${looseLabel}`;
    } else if (bulk > 0) {
      return `${prefix}${bulk.toLocaleString()} ${bulkLabel}`;
    } else if (loose > 0) {
      return `${prefix}${loose} ${looseLabel}`;
    } else {
      return `0 ${bulkLabel}`;
    }
  }

  // Standard non-box discrete item: always integer, never points
  const isDiscrete = ['nos', 'pcs', 'unit', 'units', 'each', 'bag', 'bags', 'can', 'tin', 'set'].includes(uom);
  const formattedVal = isDiscrete ? Math.round(num) : (Math.abs(num - Math.round(num)) > 0.001 ? Number(num.toFixed(2)) : Math.round(num));
  return `${formattedVal.toLocaleString()} ${prod?.uom || 'Nos'}`;
};

const STORAGE_CRITERIA_KEY = 'zac_basic_stock_report_criteria_v2';
const META_CACHE_KEY = 'zac_basic_stock_meta_v2';

export const BasicStockReportPrint: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantId } = useAuth();

  // Active filter criteria
  const [criteria, setCriteria] = useState<BasicStockFilterCriteria | null>(() => {
    if (location.state?.criteria) return location.state.criteria;
    try {
      const saved = localStorage.getItem(STORAGE_CRITERIA_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [businessName, setBusinessName] = useState<string>('Zohaib Ali & Company');
  const [productsMaster, setProductsMaster] = useState<any[]>([]);
  const [stockMap, setStockMap] = useState<Map<string, any>>(new Map());
  const [warehouseStockMap, setWarehouseStockMap] = useState<Map<string, Record<string, number>>>(new Map());
  const [warehousesList, setWarehousesList] = useState<string[]>([]);

  // Layout Theme: 'modern' | 'classic'
  const [layoutTheme, setLayoutTheme] = useState<'modern' | 'classic'>(() => {
    try {
      return localStorage.getItem('jakwani_reports_layout') === 'classic' ? 'classic' : 'modern';
    } catch {}
    return 'modern';
  });

  // Modal inspection of product breakdown
  const [inspectedProduct, setInspectedProduct] = useState<any | null>(null);

  const toggleLayout = () => {
    const next = layoutTheme === 'modern' ? 'classic' : 'modern';
    setLayoutTheme(next);
    try {
      localStorage.setItem('jakwani_reports_layout', next);
    } catch {}
  };

  // ── DATA FETCHING & DYNAMIC STOCK CALCULATION ──
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        // 1. Check local cache for master products
        let cachedProducts: any[] | null = null;
        let cachedWarehouses: any[] | null = null;
        try {
          const cached =
            localStorage.getItem(META_CACHE_KEY) ||
            sessionStorage.getItem(META_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed.productsMaster) && parsed.productsMaster.length > 0) {
              cachedProducts = parsed.productsMaster;
            }
            if (Array.isArray(parsed.warehouses) && parsed.warehouses.length > 0) {
              cachedWarehouses = parsed.warehouses;
            }
          }
        } catch {}

        // 2. Fetch master products if not in cache
        const productsPromise = cachedProducts && cachedProducts.length > 0
          ? Promise.resolve({ data: cachedProducts })
          : Promise.all([
              supabase.from('products').select('id, product_name, category, sub_category, sub_sub_category, brand, purchase_price, retail_price, uom, item_sr_no, current_stock').order('id', { ascending: true }).range(0, 999),
              supabase.from('products').select('id, product_name, category, sub_category, sub_sub_category, brand, purchase_price, retail_price, uom, item_sr_no, current_stock').order('id', { ascending: true }).range(1000, 2999)
            ]).then(([p1, p2]) => ({ data: [...(p1.data || []), ...(p2.data || [])] }));

        // 3. Fetch warehouses
        const warehousesPromise = cachedWarehouses && cachedWarehouses.length > 0
          ? Promise.resolve({ data: cachedWarehouses })
          : supabase.from('inventory_locations').select('id, name').order('name');

        // 4. Fetch dynamic stock via Supabase RPC
        const rpcLocation =
          criteria?.warehouse && criteria.warehouse !== 'All'
            ? criteria.warehouse
            : (criteria?.warehouses && criteria.warehouses.length === 1 && criteria.warehouses[0] !== 'All')
            ? criteria.warehouses[0]
            : 'All';

        const effectiveEndDate =
          criteria?.dateMode === 'multi'
            ? (criteria?.dateTo ? String(criteria.dateTo).trim() : null)
            : (criteria?.singleDate ? String(criteria.singleDate).trim() : criteria?.asOfDate ? String(criteria.asOfDate).trim() : null);

        const effectiveStartDate =
          criteria?.dateMode === 'multi'
            ? (criteria?.dateFrom ? String(criteria.dateFrom).trim() : null)
            : null;

        const rpcPromise = supabase.rpc('calculate_dynamic_stock', {
          p_location: String(rpcLocation),
          p_start_date: effectiveStartDate,
          p_end_date: effectiveEndDate
        });

        // 5. Fetch warehouse-wise breakdown from stock_balances
        const balancesPromise = supabase
          .from('stock_balances')
          .select('product_name, warehouse_name, quantity');

        const [prodRes, whRes, rpcRes, balancesRes] = await Promise.all([
          productsPromise,
          warehousesPromise,
          rpcPromise,
          balancesPromise
        ]);

        if (!isMounted) return;

        const loadedProds = prodRes.data || [];
        const loadedWhs = (whRes.data || []).map((w: any) => String(w.name).trim());
        setProductsMaster(loadedProds);
        setWarehousesList(loadedWhs);

        // Build dynamic stock lookup map (normalized product_name -> row)
        const sMap = new Map<string, any>();
        if (rpcRes.data && Array.isArray(rpcRes.data)) {
          rpcRes.data.forEach((r: any) => {
            const key = String(r.product_name || '').trim().toLowerCase();
            if (key) sMap.set(key, r);
          });
        }
        setStockMap(sMap);

        // Build warehouse-specific stock map (normalized product_name -> { [warehouse]: qty })
        const whMap = new Map<string, Record<string, number>>();
        if (balancesRes.data && Array.isArray(balancesRes.data)) {
          balancesRes.data.forEach((b: any) => {
            const pKey = String(b.product_name || '').trim().toLowerCase();
            const wName = String(b.warehouse_name || 'Global').trim();
            const q = Number(b.quantity || 0);
            if (!whMap.has(pKey)) {
              whMap.set(pKey, {});
            }
            const existing = whMap.get(pKey)!;
            existing[wName] = (existing[wName] || 0) + q;
          });
        }
        setWarehouseStockMap(whMap);
      } catch (err) {
        console.error('Failed to load stock report print data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [criteria]);

  // ── FILTER PRODUCTS AND COMPOSE STOCK ROWS ──
  const stockRows = useMemo(() => {
    if (!productsMaster || productsMaster.length === 0) return [];

    // Filter sets
    const targetParentCats = criteria?.parentCategories && criteria.parentCategories.length > 0
      ? new Set(criteria.parentCategories.map((c) => c.toLowerCase().trim()))
      : null;

    const targetSubCats = criteria?.subCategories && criteria.subCategories.length > 0
      ? new Set(criteria.subCategories.map((c) => c.toLowerCase().trim()))
      : null;

    const targetLeafCats = criteria?.categories && criteria.categories.length > 0
      ? new Set(criteria.categories.map((c) => c.toLowerCase().trim()))
      : null;

    const targetProductNames = criteria?.productNames && criteria.productNames.length > 0
      ? new Set(criteria.productNames.map((p) => p.toLowerCase().trim()))
      : criteria?.products && criteria.products.length > 0
      ? new Set(criteria.products.map((p) => p.toLowerCase().trim()))
      : null;

    const targetBrands = criteria?.brands && criteria.brands.length > 0
      ? new Set(criteria.brands.map((b) => b.toLowerCase().trim()))
      : criteria?.brand && criteria.brand !== 'All'
      ? new Set([criteria.brand.toLowerCase().trim()])
      : null;

    const targetColors = criteria?.colors && criteria.colors.length > 0
      ? new Set(criteria.colors.map((c) => c.toLowerCase().trim()))
      : criteria?.color && criteria.color !== 'All'
      ? new Set([criteria.color.toLowerCase().trim()])
      : null;

    const targetWarehouses = criteria?.warehouses && criteria.warehouses.length > 0
      ? new Set(criteria.warehouses.map((w) => w.toLowerCase().trim()))
      : criteria?.warehouse && criteria.warehouse !== 'All'
      ? new Set([criteria.warehouse.toLowerCase().trim()])
      : null;

    // Deduplicate master products by lowercase product_name to ensure clean reporting
    const seenNames = new Set<string>();
    const uniqueProducts: any[] = [];
    productsMaster.forEach((p) => {
      const n = String(p.product_name || '').trim().toLowerCase();
      if (!n || seenNames.has(n)) return;
      seenNames.add(n);
      uniqueProducts.push(p);
    });

    const rows = uniqueProducts.map((p) => {
      const pNameLower = String(p.product_name || '').trim().toLowerCase();
      const parentCat = String(p.sub_sub_category || p.parent_category || '').trim();
      const subCat = String(p.sub_category || '').trim();
      const leafCat = String(p.category || '').trim();
      const brand = String(p.brand || '').trim();
      const color = extractProductColor(p) || 'General';

      // Stock from RPC calculation
      const rpcStock = stockMap.get(pNameLower);
      let calculatedStock = 0;
      let openingStock = 0;
      let totalIn = 0;
      let totalOut = 0;

      if (rpcStock) {
        openingStock = Number(rpcStock.opening_stock || 0);
        totalIn = Number(rpcStock.prior_in || 0) + Number(rpcStock.period_in || 0);
        totalOut = Number(rpcStock.prior_out || 0) + Number(rpcStock.period_out || 0);
        calculatedStock = openingStock + totalIn - totalOut;
      } else {
        // Fallback to product.current_stock or sum of warehouse_balances
        const whObj = warehouseStockMap.get(pNameLower);
        if (whObj) {
          calculatedStock = Object.values(whObj).reduce((acc, q) => acc + q, 0);
        } else {
          calculatedStock = Number(p.current_stock || 0);
        }
      }

      // Warehouse distribution breakdown
      const whBreakdown = warehouseStockMap.get(pNameLower) || {};

      // If warehouse filter is specified, calculate stock specific to selected warehouse(s)
      let effectiveStock = calculatedStock;
      if (targetWarehouses) {
        effectiveStock = 0;
        Object.entries(whBreakdown).forEach(([whName, q]) => {
          if (targetWarehouses.has(whName.toLowerCase().trim())) {
            effectiveStock += q;
          }
        });
      }

      // Price and Valuation calculations
      const costPrice = Number(p.purchase_price || p.cost_price || 0);
      const retailPrice = Number(p.retail_price || 0);
      const totalValuation = Math.round(effectiveStock * costPrice);
      const totalRetailValuation = Math.round(effectiveStock * retailPrice);

      // Status classification
      let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (effectiveStock <= 0) {
        status = 'out_of_stock';
      } else if (effectiveStock <= 5) {
        status = 'low_stock';
      }

      return {
        id: p.id,
        sku: p.item_sr_no || p.sku || '—',
        product_name: p.product_name,
        pNameLower,
        parent_category: parentCat || 'General',
        sub_category: subCat || 'Uncategorized',
        leaf_category: leafCat || 'Default',
        brand: brand || 'Unbranded',
        color,
        uom: p.uom || 'Nos',
        costPrice,
        retailPrice,
        availableStock: effectiveStock,
        totalValuation,
        totalRetailValuation,
        whBreakdown,
        status,
        openingStock,
        totalIn,
        totalOut,
        rawProduct: p
      };
    });

    // Apply Filters
    const filtered = rows.filter((row) => {
      // 1. Parent category filter
      if (targetParentCats && !targetParentCats.has(row.parent_category.toLowerCase())) {
        return false;
      }
      // 2. Sub-category filter
      if (targetSubCats && !targetSubCats.has(row.sub_category.toLowerCase())) {
        return false;
      }
      // 3. Leaf category filter
      if (targetLeafCats && !targetLeafCats.has(row.leaf_category.toLowerCase())) {
        return false;
      }
      // 4. Specific product filter
      if (targetProductNames && !targetProductNames.has(row.pNameLower)) {
        return false;
      }
      // 5. Brand filter
      if (targetBrands && !targetBrands.has(row.brand.toLowerCase())) {
        return false;
      }
      // 6. Color filter
      if (targetColors && !targetColors.has(row.color.toLowerCase())) {
        return false;
      }
      // 7. Hide Zero-Stock Items toggle
      if (criteria?.hideZeroStock && row.availableStock <= 0) {
        return false;
      }
      // 8. Report Type specific constraints
      if (criteria?.reportType === 'reorder' && row.availableStock > 5) {
        return false; // Only show low stock or reorder candidates
      }
      if (criteria?.reportType === 'dead' && row.availableStock > 0) {
        return false; // Only show zero/dead stock
      }

      return true;
    });

    return filtered;
  }, [productsMaster, stockMap, warehouseStockMap, criteria]);

  // ── SORTING ──
  const sortedRows = useMemo(() => {
    const list = [...stockRows];
    if (!criteria?.sortBy) return list;

    switch (criteria.sortBy) {
      case 'stock_desc':
        return list.sort((a, b) => b.availableStock - a.availableStock);
      case 'stock_asc':
        return list.sort((a, b) => a.availableStock - b.availableStock);
      case 'valuation_desc':
        return list.sort((a, b) => b.totalValuation - a.totalValuation);
      case 'name_asc':
        return list.sort((a, b) => a.product_name.localeCompare(b.product_name));
      case 'name_desc':
        return list.sort((a, b) => b.product_name.localeCompare(a.product_name));
      case 'sku_asc':
        return list.sort((a, b) => a.sku.localeCompare(b.sku));
      default:
        return list;
    }
  }, [stockRows, criteria?.sortBy]);

  // ── OVERALL TOP KPI TOTALS ──
  const kpiTotals = useMemo(() => {
    let totalSKUs = sortedRows.length;
    let totalUnits = 0;
    let totalValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    sortedRows.forEach((row) => {
      totalUnits += row.availableStock;
      totalValuation += row.totalValuation;
      totalRetailValuation += row.totalRetailValuation;
      if (row.status === 'low_stock') lowStockCount++;
      if (row.status === 'out_of_stock') outOfStockCount++;
    });

    return {
      totalSKUs,
      totalUnits: Math.round(totalUnits),
      totalValuation: Math.round(totalValuation),
      totalRetailValuation: Math.round(totalRetailValuation),
      lowStockCount,
      outOfStockCount
    };
  }, [sortedRows]);

  // ── PERSPECTIVE GROUPINGS (FOR WAREHOUSE & CATEGORY VIEWS) ──
  const groupedByCategory = useMemo(() => {
    if (criteria?.reportType !== 'category') return [];
    const catMap = new Map<string, { categoryTitle: string; items: typeof sortedRows; totalQty: number; totalVal: number }>();

    sortedRows.forEach((row) => {
      const key = `${row.parent_category} › ${row.sub_category}`;
      if (!catMap.has(key)) {
        catMap.set(key, { categoryTitle: key, items: [], totalQty: 0, totalVal: 0 });
      }
      const grp = catMap.get(key)!;
      grp.items.push(row);
      grp.totalQty += row.availableStock;
      grp.totalVal += row.totalValuation;
    });

    return Array.from(catMap.values()).sort((a, b) => a.categoryTitle.localeCompare(b.categoryTitle));
  }, [sortedRows, criteria?.reportType]);

  const groupedByWarehouse = useMemo(() => {
    if (criteria?.reportType !== 'warehouse') return [];
    const whMap = new Map<string, { warehouseName: string; items: { product: typeof sortedRows[0]; qty: number; valuation: number }[]; totalQty: number; totalVal: number }>();

    // For every warehouse, collect products that have stock in it
    warehousesList.forEach((wh) => {
      whMap.set(wh, { warehouseName: wh, items: [], totalQty: 0, totalVal: 0 });
    });

    sortedRows.forEach((row) => {
      Object.entries(row.whBreakdown).forEach(([wh, q]) => {
        if (q > 0) {
          if (!whMap.has(wh)) {
            whMap.set(wh, { warehouseName: wh, items: [], totalQty: 0, totalVal: 0 });
          }
          const grp = whMap.get(wh)!;
          const val = Math.round(q * row.costPrice);
          grp.items.push({ product: row, qty: q, valuation: val });
          grp.totalQty += q;
          grp.totalVal += val;
        }
      });
    });

    return Array.from(whMap.values()).filter((g) => g.items.length > 0 || (criteria?.warehouses && criteria.warehouses.includes(g.warehouseName)));
  }, [sortedRows, warehousesList, criteria?.reportType, criteria?.warehouses]);

  // ── CSV EXPORT ──
  const handleExportCSV = () => {
    if (sortedRows.length === 0) return;

    const headers = [
      'S#',
      'SKU',
      'Product Title',
      'Parent Category',
      'Sub Category',
      'Leaf Category',
      'Brand',
      'Color',
      'UOM',
      'Cost Price (Rs)',
      'Retail Price (Rs)',
      'Available Stock',
      'Valuation Cost (Rs)',
      'Retail Value (Rs)',
      'Stock Status'
    ];

    const csvRows = sortedRows.map((row, idx) => [
      idx + 1,
      `"${row.sku.replace(/"/g, '""')}"`,
      `"${row.product_name.replace(/"/g, '""')}"`,
      `"${row.parent_category.replace(/"/g, '""')}"`,
      `"${row.sub_category.replace(/"/g, '""')}"`,
      `"${row.leaf_category.replace(/"/g, '""')}"`,
      `"${row.brand.replace(/"/g, '""')}"`,
      `"${row.color.replace(/"/g, '""')}"`,
      `"${row.uom}"`,
      Math.round(row.costPrice),
      Math.round(row.retailPrice),
      row.availableStock,
      Math.round(row.totalValuation),
      Math.round(row.totalRetailValuation),
      `"${row.status.toUpperCase()}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Basic_Stock_Report_${criteria?.reportType || 'balance'}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const reportSubtitle = useMemo(() => {
    switch (criteria?.reportType) {
      case 'balance':
        return 'Current Stock Balance & Inventory Valuation Registry';
      case 'warehouse':
        return 'Warehouse & Multi-Location Stock Breakdown';
      case 'category':
        return 'Category-Wise Stock Volume & Valuation';
      case 'reorder':
        return 'Low Stock & Reorder Alert Register';
      case 'dead':
        return 'Zero & Out-of-Stock Audit Register';
      default:
        return 'Stock Inventory Balance & Valuation';
    }
  }, [criteria?.reportType]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner />
        <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
          Calculating Real-Time Stock &amp; Compiling Audit Register...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        layoutTheme === 'classic'
          ? 'bg-white text-black font-mono'
          : 'bg-[#f8fafc] text-gray-900 font-sans'
      } p-4 sm:p-6 lg:p-8 print:p-2 print:bg-white`}
    >
      {/* ── TOP ACTION BAR (HIDDEN IN PRINT) ── */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => navigate('/basic-stock-report')}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl shadow-2xs hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
        >
          <MdArrowBack size={16} />
          <span>Modify Criteria</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Layout Switcher */}
          <button
            type="button"
            onClick={toggleLayout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl shadow-2xs hover:bg-gray-100 transition cursor-pointer"
            title="Toggle between Modern Slate and Classic Matrix Layouts"
          >
            {layoutTheme === 'modern' ? (
              <>
                <MdFormatListBulleted className="text-primary" size={16} />
                <span>Classic Matrix</span>
              </>
            ) : (
              <>
                <MdViewModule className="text-primary" size={16} />
                <span>Modern Slate</span>
              </>
            )}
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={sortedRows.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl shadow-2xs hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer"
          >
            <MdFileDownload size={16} className="text-success" />
            <span>Export CSV</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl shadow-sm hover:bg-primary/90 transition cursor-pointer"
          >
            <MdPrint size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── REPORT CONTAINER ── */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 print:border-none print:shadow-none print:p-0">
        {/* ── HEADER BANNER ── */}
        <div className="border-b pb-5 mb-6 border-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  CORE INVENTORY DEPARTMENT
                </span>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {reportSubtitle}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
                {businessName}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical Inventory Balances, Warehouse Distribution &amp; Financial Valuation
              </p>
            </div>

            <div className="text-right text-xs space-y-1">
              <div>
                <span className="text-gray-400 font-medium">
                  {criteria?.dateMode === 'multi' ? 'Period: ' : 'As-Of Date: '}
                </span>
                <span className="font-bold text-slate-800">
                  {criteria?.dateMode === 'multi'
                    ? `${criteria?.dateFrom || '—'} to ${criteria?.dateTo || '—'}`
                    : (criteria?.singleDate || criteria?.asOfDate || new Date().toISOString().split('T')[0])}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">Report Type: </span>
                <span className="font-bold text-primary uppercase">
                  {criteria?.reportType || 'balance'}
                </span>
              </div>
              <div className="text-[11px] text-gray-400">
                Printed: {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          {/* Applied Filters Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-slate-100 text-[11px]">
            <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
              Filters Applied:
            </span>
            {criteria?.warehouse && criteria.warehouse !== 'All' && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                Warehouse: {criteria.warehouse}
              </span>
            )}
            {criteria?.warehouses && criteria.warehouses.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                Warehouses: {criteria.warehouses.join(', ')}
              </span>
            )}
            {criteria?.brands && criteria.brands.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                Brands: {criteria.brands.join(', ')}
              </span>
            )}
            {criteria?.colors && criteria.colors.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                Colors: {criteria.colors.join(', ')}
              </span>
            )}
            {criteria?.parentCategories && criteria.parentCategories.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                Parent: {criteria.parentCategories.join(', ')}
              </span>
            )}
            {criteria?.subCategories && criteria.subCategories.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                Sub-Cat: {criteria.subCategories.join(', ')}
              </span>
            )}
            {criteria?.categories && criteria.categories.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                Leaf: {criteria.categories.join(', ')}
              </span>
            )}
            {criteria?.hideZeroStock && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-medium">
                Zero Stock Hidden
              </span>
            )}
            {(!criteria?.warehouses || criteria.warehouses.length === 0) &&
              (!criteria?.brands || criteria.brands.length === 0) &&
              (!criteria?.parentCategories || criteria.parentCategories.length === 0) &&
              !criteria?.warehouse && (
                <span className="text-gray-400 italic">All Items (Global Stock)</span>
              )}
          </div>
        </div>

        {/* ── 6 TOP KPI CARDS (NO NUMERIC CLIPPING) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 mb-6">
          {/* 1. Total Catalog SKUs */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              CATALOG SKUs
            </span>
            <span className="font-black text-slate-900 break-words tracking-tight text-xs sm:text-sm lg:text-[15px] xl:text-base leading-tight block">
              {kpiTotals.totalSKUs.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Unique items
            </span>
          </div>

          {/* 2. Physical Units on Hand */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              UNITS ON HAND
            </span>
            <span className="font-black text-slate-900 break-words tracking-tight text-xs sm:text-sm lg:text-[15px] xl:text-base leading-tight block">
              {Math.round(kpiTotals.totalUnits).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Physical quantity
            </span>
          </div>

          {/* 3. Total Stock Valuation (Rs) */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              TOTAL VALUATION
            </span>
            <span className="font-black text-slate-900 break-words tracking-tight text-xs sm:text-sm lg:text-[15px] xl:text-base leading-tight block">
              Rs. {kpiTotals.totalValuation.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              At cost price
            </span>
          </div>

          {/* 4. Retail Potential Value (Rs) */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              RETAIL VALUE
            </span>
            <span className="font-black text-emerald-700 break-words tracking-tight text-xs sm:text-sm lg:text-[15px] xl:text-base leading-tight block">
              Rs. {kpiTotals.totalRetailValuation.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              At retail price
            </span>
          </div>

          {/* 5. Low Stock Alerts */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              LOW STOCK (≤ 5)
            </span>
            <span className="font-black text-amber-600 break-words tracking-tight text-xs sm:text-sm lg:text-[15px] xl:text-base leading-tight block">
              {kpiTotals.lowStockCount.toLocaleString()} Items
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Reorder alert
            </span>
          </div>

          {/* 6. Out of Stock SKUs */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              OUT OF STOCK
            </span>
            <span className="font-black text-rose-600 break-words tracking-tight text-xs sm:text-sm lg:text-[15px] xl:text-base leading-tight block">
              {kpiTotals.outOfStockCount.toLocaleString()} Items
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Zero quantity
            </span>
          </div>
        </div>

        {/* ── PERSPECTIVE VIEW: CATEGORY-WISE GROUPING ── */}
        {criteria?.reportType === 'category' && (
          <div className="space-y-6 mb-6">
            {groupedByCategory.map((catGrp, gIdx) => (
              <div
                key={gIdx}
                className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
              >
                {/* Category Header */}
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MdCategory className="text-primary" size={16} />
                    <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      {catGrp.categoryTitle}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {catGrp.items.length} SKUs
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                    <span>
                      Total Units: <span className="text-slate-900">{catGrp.totalQty.toLocaleString()}</span>
                    </span>
                    <span>
                      Subtotal Valuation: <span className="text-emerald-700">Rs. {Math.round(catGrp.totalVal).toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                        <th className="py-2 px-3 w-10">S#</th>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Product Title</th>
                        <th className="py-2 px-3">Brand / Color</th>
                        <th className="py-2 px-3 text-right">Cost Price</th>
                        <th className="py-2 px-3 text-right">On Hand</th>
                        <th className="py-2 px-3 text-right">Valuation (Rs)</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {catGrp.items.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/70 transition cursor-pointer"
                          onClick={() => setInspectedProduct(row)}
                        >
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-primary text-[11px]">{row.sku}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {row.product_name}
                            <span className="text-[10px] text-primary ml-1.5 hover:underline">▼ details</span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {row.brand} <span className="text-slate-400">•</span> {row.color}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-slate-700">
                            {row.costPrice > 0 ? Math.round(row.costPrice).toLocaleString() : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatStockQty(row.availableStock, row.rawProduct)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            Rs. {Math.round(row.totalValuation).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                row.status === 'in_stock'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : row.status === 'low_stock'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {row.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PERSPECTIVE VIEW: WAREHOUSE-WISE GROUPING ── */}
        {criteria?.reportType === 'warehouse' && (
          <div className="space-y-6 mb-6">
            {groupedByWarehouse.map((whGrp, wIdx) => (
              <div
                key={wIdx}
                className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
              >
                {/* Warehouse Header */}
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MdWarehouse className="text-primary" size={18} />
                    <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      Location: {whGrp.warehouseName}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {whGrp.items.length} Stocked Items
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                    <span>
                      Total Units: <span className="text-slate-900">{whGrp.totalQty.toLocaleString()}</span>
                    </span>
                    <span>
                      Location Valuation: <span className="text-emerald-700">Rs. {Math.round(whGrp.totalVal).toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                        <th className="py-2 px-3 w-10">S#</th>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Product Title</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Cost Price</th>
                        <th className="py-2 px-3 text-right">Warehouse Qty</th>
                        <th className="py-2 px-3 text-right">Valuation (Rs)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {whGrp.items.map((it, idx) => (
                        <tr
                          key={it.product.id}
                          className="hover:bg-slate-50/70 transition cursor-pointer"
                          onClick={() => setInspectedProduct(it.product)}
                        >
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-primary text-[11px]">{it.product.sku}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {it.product.product_name}
                            <span className="text-[10px] text-primary ml-1.5 hover:underline">▼ details</span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{it.product.parent_category} › {it.product.sub_category}</td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-slate-700">
                            {it.product.costPrice > 0 ? Math.round(it.product.costPrice).toLocaleString() : '—'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {it.qty.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{it.product.uom}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            Rs. {Math.round(it.valuation).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STANDARD ITEMIZED AUDIT REGISTER (BALANCE, REORDER, DEAD) ── */}
        {(criteria?.reportType === 'balance' ||
          criteria?.reportType === 'reorder' ||
          criteria?.reportType === 'dead' ||
          !criteria?.reportType) && (
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`${
                    layoutTheme === 'classic'
                      ? 'bg-black text-white'
                      : 'bg-slate-100 text-slate-700'
                  } text-[11px] font-extrabold uppercase border-b border-slate-200 tracking-wider`}
                >
                  <th className="py-2.5 px-3 w-10">S#</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Product Title</th>
                  <th className="py-2.5 px-3">Category Hierarchy</th>
                  <th className="py-2.5 px-3">Brand &amp; Color</th>
                  <th className="py-2.5 px-3">Warehouses Breakdown</th>
                  <th className="py-2.5 px-3 text-right">Cost Rate</th>
                  <th className="py-2.5 px-3 text-right">On Hand</th>
                  <th className="py-2.5 px-3 text-right">Valuation (Rs)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400 italic">
                      No stock records match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                      }`}
                      onClick={() => setInspectedProduct(row)}
                    >
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-primary text-[11px] whitespace-nowrap">
                        {row.sku}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{row.product_name}</span>
                        <span className="text-[10px] text-primary hover:underline font-semibold cursor-pointer">
                          ▼ view movement audit
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="font-medium text-[11px] text-slate-800">{row.parent_category}</div>
                        <div className="text-[10px] text-slate-400">{row.sub_category} › {row.leaf_category}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{row.brand}</span>
                        <span className="text-slate-400 text-[10px] block">{row.color}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {Object.keys(row.whBreakdown).length === 0 ? (
                            <span className="text-slate-400 text-[10px] italic">Global Pool</span>
                          ) : (
                            Object.entries(row.whBreakdown).map(([wh, qty]) => (
                              <span
                                key={wh}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                  qty > 0
                                    ? 'bg-slate-100 text-slate-800 font-bold border border-slate-200'
                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}
                              >
                                {wh}: {formatStockQty(qty, row.rawProduct, true)}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                        {row.costPrice > 0 ? `Rs. ${Math.round(row.costPrice).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                        {formatStockQty(row.availableStock, row.rawProduct)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                        Rs. {Math.round(row.totalValuation).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            row.status === 'in_stock'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : row.status === 'low_stock'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {row.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Grand Total Footer */}
              {sortedRows.length > 0 && (
                <tfoot className="border-t-2 border-slate-300 bg-slate-100/90 font-bold text-xs text-slate-900">
                  <tr>
                    <td colSpan={7} className="py-3 px-3 text-right uppercase tracking-wider font-extrabold">
                      Grand Totals ({kpiTotals.totalSKUs} SKUs):
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm whitespace-nowrap">
                      {Math.round(kpiTotals.totalUnits).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-800 text-sm whitespace-nowrap">
                      Rs. {kpiTotals.totalValuation.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* ── AUDIT SIGNATURE BLOCK ── */}
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-8 text-center text-xs">
          <div>
            <div className="border-b border-slate-300 pb-1 mb-2 font-mono text-[11px] text-slate-500">
              {new Date().toISOString().split('T')[0]}
            </div>
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
              Store Manager / In-Charge
            </span>
            <span className="text-[10px] text-slate-400">Physical Count Verification</span>
          </div>

          <div>
            <div className="border-b border-slate-300 pb-1 mb-2 font-mono text-[11px] text-slate-500">
              System Audited
            </div>
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
              Internal Auditor
            </span>
            <span className="text-[10px] text-slate-400">Valuation &amp; Reconciliation</span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <div className="border-b border-slate-300 pb-1 mb-2 font-mono text-[11px] text-slate-500">
              Authorized
            </div>
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
              Director / General Management
            </span>
            <span className="text-[10px] text-slate-400">Final Financial Approval</span>
          </div>
        </div>
      </div>

      {/* ── PRODUCT BREAKDOWN & LEDGER MOVEMENT MODAL ── */}
      {inspectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Product Stock Audit &amp; Ledger Movement
                </span>
                <h3 className="font-black text-base text-white">
                  {inspectedProduct.product_name}
                </h3>
                <span className="text-xs font-mono text-emerald-400">
                  SKU: {inspectedProduct.sku}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectedProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <MdClose size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              {/* Product Key Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                  <span className="font-bold text-slate-800">{inspectedProduct.parent_category}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Brand</span>
                  <span className="font-bold text-slate-800">{inspectedProduct.brand}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cost Price</span>
                  <span className="font-mono font-bold text-slate-800">
                    Rs. {Math.round(inspectedProduct.costPrice).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Retail Price</span>
                  <span className="font-mono font-bold text-emerald-700">
                    Rs. {Math.round(inspectedProduct.retailPrice).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Movement Summary Cards */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Inventory Flow Ledger
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">Opening</span>
                    <span className="font-mono font-black text-sm text-slate-800">
                      {inspectedProduct.openingStock.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-emerald-50/50 text-center">
                    <span className="text-[10px] text-emerald-600 font-bold block">Total Inward</span>
                    <span className="font-mono font-black text-sm text-emerald-700">
                      +{inspectedProduct.totalIn.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-rose-50/50 text-center">
                    <span className="text-[10px] text-rose-600 font-bold block">Total Outward</span>
                    <span className="font-mono font-black text-sm text-rose-700">
                      -{inspectedProduct.totalOut.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-100 text-center">
                    <span className="text-[10px] text-slate-600 font-bold block">Net Available</span>
                    <span className="font-mono font-black text-sm text-slate-900">
                      {formatStockQty(inspectedProduct.availableStock, inspectedProduct.rawProduct)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location / Warehouse Breakdown */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Warehouse Location Distribution
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                        <th className="py-2 px-3">Warehouse / Store</th>
                        <th className="py-2 px-3 text-right">Physical Quantity</th>
                        <th className="py-2 px-3 text-right">Valuation (Cost)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.keys(inspectedProduct.whBreakdown).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-3 px-3 text-center text-gray-400 italic">
                            No warehouse specific split recorded (Global balance: {formatStockQty(inspectedProduct.availableStock, inspectedProduct.rawProduct)})
                          </td>
                        </tr>
                      ) : (
                        Object.entries(inspectedProduct.whBreakdown).map(([whName, q]: any) => (
                          <tr key={whName} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{whName}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              {formatStockQty(Number(q), inspectedProduct.rawProduct)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              Rs. {Math.round(Number(q) * inspectedProduct.costPrice).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedProduct(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasicStockReportPrint;
