import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { useAuth } from '../../../Context/Auth';
import Spinner from '../../../ui/Spinner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  MdArrowBack,
  MdPrint,
  MdFileDownload,
  MdTableChart,
  MdUnfoldMore,
  MdUnfoldLess,
  MdInfoOutline
} from 'react-icons/md';
import { BasicPurchaseFilterCriteria } from './BasicPurchaseReport';
import { extractProductColor } from '../../../utils/colorService';
import { fetchSystemMasterConfig } from '../../../utils/systemPermissions';

const STORAGE_CRITERIA_KEY = 'zac_basic_purchase_report_criteria';

export const BasicPurchaseReportPrint: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantId } = useAuth();

  // Active filter criteria
  const criteria: BasicPurchaseFilterCriteria | null = useMemo(() => {
    if (location.state?.criteria) return location.state.criteria;
    try {
      const saved = localStorage.getItem(STORAGE_CRITERIA_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  }, [location.state]);

  const [loading, setLoading] = useState<boolean>(true);
  const [businessName, setBusinessName] = useState<string>('Zohaib Ali & Company');
  const [rawPurchases, setRawPurchases] = useState<any[]>([]);
  const [vendorsMap, setVendorsMap] = useState<Record<string, any>>({});
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
  const [isTogglingExpand, setIsTogglingExpand] = useState(false);
  const [individualToggledIds, setIndividualToggledIds] = useState<Set<string>>(new Set());

  // Check if a row is expanded: O(1) instant lookup
  const isRowExpanded = (billId: string | number) => {
    const idStr = String(billId);
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

  // Toggle breakdown for a specific purchase bill (instant O(1))
  const toggleBillBreakdown = (billId: string) => {
    setIndividualToggledIds((prev) => {
      const next = new Set(prev);
      if (next.has(billId)) {
        next.delete(billId);
      } else {
        next.add(billId);
      }
      return next;
    });
  };

  // Toggle all breakdowns with asynchronous loader to prevent UI freeze
  const handleToggleAllBreakdowns = () => {
    if (isTogglingExpand) return;
    setIsTogglingExpand(true);
    // Yield execution to the browser thread so the spinner paints immediately
    setTimeout(() => {
      setExpandAllBreakdown((prev) => !prev);
      setIndividualToggledIds(new Set()); // Reset individual overrides
      // Allow browser to render the updated DOM before hiding the spinner
      setTimeout(() => {
        setIsTogglingExpand(false);
      }, 120);
    }, 50);
  };

  // ── DATA FETCHING & LOCAL CACHE REUSE ──
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        const sysCfg = await fetchSystemMasterConfig();
        if (sysCfg?.business_name && isMounted) {
          setBusinessName(sysCfg.business_name);
        }

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
      const rawNo = p.purchase_no || `PUR-${p.id}`;
      const purchaseNo = String(rawNo).toUpperCase().startsWith('PUR-') ? rawNo : `PUR-${rawNo}`;

      return {
        id: p.id,
        purchase_no: purchaseNo,
        bill_number: p.bill_number || p.bill_no || '—',
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

  // ── SMART PRINTING: ATOMIC BLOCKS, ADAPTIVE HEIGHT BUDGETS & GIANT PURCHASE SLICING ──
  interface PurchasePageItem {
    bill: any;
    serialNum: number;
    isExpanded: boolean;
    itemsSlice?: {
      items: any[];
      partIndex: number;
      totalParts: number;
      isFirstPart: boolean;
      isLastPart: boolean;
    };
  }

  interface ChunkedPage {
    pageIndex: number;
    items: PurchasePageItem[];
    pageGross: number;
    pageFreight: number;
    pageDiscounts: number;
    pageNet: number;
    billsCount: number;
  }

  // Calculate row height weight (units) for atomic block checking
  const getBillUnits = (b: any, expanded: boolean): number => {
    if (!expanded) return 1;
    const itemsCount = b.parsedItems?.length || 1;
    // 1 unit for master row + 1 unit for drawer header/padding + 0.65 units per item line
    return 2 + Math.ceil(itemsCount * 0.65);
  };

  // Chunk parsed purchases into printable page sheets with per-page subtotal tracking
  const chunkedPurchasePages = useMemo<ChunkedPage[]>(() => {
    if (sortedPurchaseRows.length === 0) return [];

    // Adaptive page capacity: Page 1 accommodates header + KPI cards (24 units); Page 2+ takes full capacity (28 units)
    const firstCap = 24;
    const subsequentCap = 28;

    const pages: ChunkedPage[] = [];
    let currentPageItems: PurchasePageItem[] = [];
    let currentUsedUnits = 0;
    let currentCap = firstCap;
    let runningSerial = 1;

    const commitPage = () => {
      if (currentPageItems.length === 0) return;

      let pageGross = 0;
      let pageFreight = 0;
      let pageDiscounts = 0;
      let pageNet = 0;
      const uniqueBillsOnPage = new Set<string>();

      currentPageItems.forEach((item) => {
        const b = item.bill;
        uniqueBillsOnPage.add(String(b.id));

        // Avoid double-counting financial sums if a giant bill spans multiple pages
        if (item.itemsSlice && !item.itemsSlice.isFirstPart) {
          return;
        }

        pageGross += Number(b.grossPurchaseAmount || 0);
        pageFreight += Number(b.freightAmount || 0);
        pageDiscounts += Number(b.discountAmount || 0);
        pageNet += Number(b.netTotalAmount || 0);
      });

      pages.push({
        pageIndex: pages.length,
        items: currentPageItems,
        pageGross,
        pageFreight,
        pageDiscounts,
        pageNet,
        billsCount: uniqueBillsOnPage.size
      });

      currentPageItems = [];
      currentUsedUnits = 0;
      currentCap = subsequentCap;
    };

    sortedPurchaseRows.forEach((bill) => {
      const isExpanded = isRowExpanded(bill.id);
      const billUnits = getBillUnits(bill, isExpanded);
      const itemsList = bill.parsedItems || [];

      // ── CASE 1: Standard Purchase Bill (Fits within single page capacity) ──
      // Treats master row + items as an ATOMIC BLOCK
      if (billUnits <= subsequentCap) {
        // If it doesn't fit in remaining space on this page, push whole block to start fresh on next page
        if (currentUsedUnits + billUnits > currentCap && currentPageItems.length > 0) {
          commitPage();
        }

        currentPageItems.push({
          bill,
          serialNum: runningSerial++,
          isExpanded
        });
        currentUsedUnits += billUnits;
        return;
      }

      // ── CASE 2: Giant Purchase Bill (Exceeds an entire page's height by itself) ──
      // Starts fresh at the top of a new page, then paginates item lines with continuation tags
      if (currentPageItems.length > 0) {
        commitPage();
      }

      const itemsPerPage = Math.max(8, Math.floor((currentCap - 2) / 0.65));
      const totalParts = Math.ceil(itemsList.length / itemsPerPage);

      for (let part = 0; part < totalParts; part++) {
        const sliceStart = part * itemsPerPage;
        const sliceItems = itemsList.slice(sliceStart, sliceStart + itemsPerPage);
        const isFirstPart = part === 0;
        const isLastPart = part === totalParts - 1;

        if (part > 0) {
          commitPage();
        }

        currentPageItems.push({
          bill,
          serialNum: isFirstPart ? runningSerial++ : runningSerial - 1,
          isExpanded: true,
          itemsSlice: {
            items: sliceItems,
            partIndex: part + 1,
            totalParts,
            isFirstPart,
            isLastPart
          }
        });

        currentUsedUnits += 2 + Math.ceil(sliceItems.length * 0.65);
      }
    });

    if (currentPageItems.length > 0) {
      commitPage();
    }

    return pages;
  }, [sortedPurchaseRows, expandAllBreakdown, individualToggledIds]);

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

    // Group by Vendor, Location, Brand, or Color
    const groupKeyMap: Record<string, { groupName: string; rows: any[] }> = {};

    sortedPurchaseRows.forEach((row) => {
      let key = 'General';
      if (criteria.reportType === 'vendor') key = row.vendor_name || 'Unknown Vendor';
      else if (criteria.reportType === 'location') key = row.warehouse || row.target_warehouse || 'A-39';
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

  // ── EXPORT TO EXCEL / CSV ──
  const handleExportExcel = () => {
    try {
      const sheetRows: any[] = [];

      if (criteria?.reportType === 'bill') {
        sortedPurchaseRows.forEach((r, idx) => {
          sheetRows.push({
            'S.No': idx + 1,
            'Date': r.date,
            'Bill #': r.purchase_no,
            'Vendor Name': r.vendor_name,
            'Vendor Code': r.vendorCode,
            'Warehouse': r.warehouse,
            'Products Summary': `${r.totalItemsCount} items (${r.totalItemQty} qty)`,
            'Payment Terms': r.terms,
            'Gross Purchases (Rs)': r.grossPurchaseAmount,
            'Freight Charges (Rs)': r.freightAmount,
            'Discounts (Rs)': r.discountAmount,
            'Net Procurement Cost (Rs)': r.netTotalAmount
          });
        });
      } else if (groupedHierarchyData) {
        groupedHierarchyData.forEach((grp) => {
          grp.rows.forEach((r, idx) => {
            sheetRows.push({
              'Group / Header': grp.groupName,
              'S.No': idx + 1,
              'Date': r.date,
              'Bill #': r.purchase_no,
              'Vendor': r.vendor_name,
              'Qty': r.qty || r.totalItemQty || 0,
              'Rate': r.rate || 0,
              'Net Total (Rs)': r.lineTotal || r.netTotalAmount || 0
            });
          });
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(sheetRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase_Report');

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `Purchase_Report_${Date.now()}.xlsx`);
    } catch (err) {
      console.error('Excel Export Failed:', err);
    }
  };

  const isClassic = layoutTheme === 'classic';

  // ── RENDER MAIN REPORT HEADER (PAGE 1) ──
  const renderMainHeader = () => {
    if (isClassic) {
      return (
        <div className="border-b-2 border-black pb-3 mb-4 text-center">
          <h1 className="text-2xl font-black uppercase tracking-wider text-black">
            {businessName || 'ZOHAIB ALI AND COMPANY'}
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-black mt-1">
            BASIC PURCHASE DEPARTMENT — {criteria?.reportType?.toUpperCase()} AUDIT REGISTER
          </p>
          <div className="flex items-center justify-between text-xs font-mono mt-2 pt-2 border-t border-black/40">
            <span>Period: {criteria?.dateMode === 'single' ? criteria.singleDate : `${criteria?.dateFrom} to ${criteria?.dateTo}`}</span>
            <span>Print Date: {new Date().toLocaleDateString('en-GB')}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 print:pb-1.5 print:gap-2 border-b border-stroke dark:border-strokedark">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              Basic Purchase Department
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {criteria?.reportType === 'bill'
                ? 'Purchase Bill Wise Audit Register'
                : criteria?.reportType === 'product'
                ? 'Product Wise Procurement Hierarchy'
                : criteria?.reportType === 'vendor'
                ? 'Vendor / Supplier Procurement Summary'
                : criteria?.reportType === 'location'
                ? 'Location / Warehouse Wise Procurement Summary'
                : criteria?.reportType === 'brand'
                ? 'Brand Wise Procurement'
                : 'Color & Surface Shade Analysis'}
            </span>
          </div>
          <h1 className="text-2xl print:text-lg font-black text-black dark:text-white tracking-tight mt-1">
            {businessName || 'Zohaib Ali & Company'}
          </h1>
        </div>

        <div className="text-right text-xs print:text-[10px] text-gray-500 dark:text-gray-400">
          <p>Period: <strong className="text-black dark:text-white">{criteria?.dateMode === 'single' ? criteria.singleDate : `${criteria?.dateFrom} → ${criteria?.dateTo}`}</strong></p>
          <p className="text-[11px] print:text-[9px] mt-0.5">Print Date: {new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>
    );
  };

  // ── RENDER COMPACT RUNNING HEADER ON SUBSEQUENT PAGES ──
  const renderRunningHeader = (pageNum: number, totalPages: number) => {
    if (isClassic) {
      return (
        <div className="border-b border-black pb-1.5 mb-3 print:pb-1 print:mb-1.5 flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider">{businessName || 'ZOHAIB ALI AND COMPANY'} — BASIC PURCHASE REPORT</span>
          <span>Page {pageNum} of {totalPages}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between pb-2 mb-3 print:pb-1 print:mb-1.5 border-b border-stroke dark:border-strokedark text-xs">
        <div className="flex items-center gap-2">
          <span className="font-black text-black dark:text-white uppercase tracking-wider">
            {businessName || 'Zohaib Ali & Company'}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 dark:text-gray-400 font-semibold text-[11px]">
            Basic Purchase Report (Procurement Register)
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-[11px] text-gray-500">
            {criteria?.dateMode === 'single' ? criteria.singleDate : `${criteria?.dateFrom} → ${criteria?.dateTo}`}
          </span>
        </div>
        <div className="font-mono text-gray-600 dark:text-gray-300 text-xs font-bold bg-gray-100 dark:bg-meta-4/40 px-2.5 py-0.5 rounded-md">
          Page {pageNum} of {totalPages}
        </div>
      </div>
    );
  };

  // ── RENDER TOP 6 KPI METRIC CARDS ──
  const renderKpiCards = () => (
    <div className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 print:grid-cols-6 gap-2.5 print:gap-1.5 ${isClassic ? 'border-b border-black pb-3 mb-4 print:pb-1.5 print:mb-2 text-center' : 'mb-6 print:mb-2'}`}>
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
          className={`p-2.5 print:p-1.5 rounded-xl min-w-0 ${
            isClassic
              ? 'border border-black bg-white'
              : kpi.highlight
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-gray-50 dark:bg-meta-4/30 border border-stroke dark:border-strokedark'
          }`}
        >
          <span className="text-[10px] print:text-[8px] font-bold uppercase tracking-wider block text-gray-500 dark:text-gray-400 truncate">
            {kpi.label}
          </span>
          <span className={`text-xs sm:text-sm lg:text-[15px] xl:text-base print:text-[11px] font-black block mt-0.5 leading-tight tracking-tight break-words ${kpi.textColor || ''}`}>
            {kpi.value}
          </span>
          <span className="text-[9px] print:text-[7px] text-gray-400 block mt-0.5 truncate">{kpi.note}</span>
        </div>
      ))}
    </div>
  );

  // ── RENDER FORMAL AUDIT SIGNATURES ──
  const renderAuditFooter = () => (
    <div className={`pt-6 mt-6 print:pt-2 print:mt-2 flex items-center justify-between text-[11px] print:text-[9px] text-gray-500 border-t ${isClassic ? 'border-black' : 'border-stroke dark:border-strokedark'}`}>
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
  );

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
          className="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer"
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
    <div className="w-full min-h-screen bg-slate-50 dark:bg-boxdark-2 py-4 px-2 md:px-6 print:bg-white print:p-0">
      {/* ── EMBEDDED PRINT STYLESHEET TO GUARANTEE TRUE PAGE SUB-TOTALS & ZERO REPEATED FOOTERS ── */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 6mm 6mm 6mm 6mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
            color: black !important;
          }
          * {
            overflow: visible !important;
            max-height: none !important;
            box-shadow: none !important;
          }
          .print-page-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-page-sheet:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          table {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tfoot {
            display: table-row-group !important;
          }
          .print-grand-total-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-hidden, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* ── ON-SCREEN STICKY CONTROLS TOOLBAR (Hidden in Print) ── */}
      <div className="print:hidden max-w-7xl mx-auto mb-5 p-3 rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-md flex flex-wrap items-center justify-between gap-3 sticky top-2 z-50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/basic-purchase-report`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stroke dark:border-strokedark text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            <MdArrowBack size={16} />
            <span>Edit Filters</span>
          </button>

          <span className="text-gray-300 dark:text-gray-600">|</span>

          {/* Modern vs Classic Layout Switcher */}
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
              <span>Modern</span>
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
              <span>Classic Ledger</span>
            </button>
          </div>

          {/* Breakdown Toggle (for Bill Wise Mode) with Animated Loader & Rich Hover/Active Design */}
          {criteria.reportType === 'bill' && (
            <button
              type="button"
              onClick={handleToggleAllBreakdowns}
              disabled={isTogglingExpand}
              className={`group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer select-none shadow-xs disabled:cursor-wait ${
                isTogglingExpand
                  ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-400 text-blue-600 dark:text-blue-300 opacity-90'
                  : expandAllBreakdown
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border-blue-600 shadow-md shadow-blue-500/20 active:scale-95'
                  : 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 dark:hover:bg-meta-4/60 dark:hover:border-blue-500 dark:hover:text-blue-300 active:bg-blue-100 active:scale-95'
              }`}
            >
              {isTogglingExpand ? (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
              ) : expandAllBreakdown ? (
                <MdUnfoldLess size={16} className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0" />
              ) : (
                <MdUnfoldMore size={16} className="shrink-0 transition-transform duration-200 group-hover:translate-y-0.5 group-active:translate-y-0" />
              )}
              <span>
                {isTogglingExpand
                  ? (expandAllBreakdown ? 'Collapsing Items...' : 'Expanding Items...')
                  : (expandAllBreakdown ? 'Collapse All Items' : 'Expand All Items')}
              </span>
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

      {/* ── MODE 1: PURCHASE BILL WISE REPORT WITH PER-PAGE CHUNKS & SUB-TOTALS ── */}
      {criteria.reportType === 'bill' ? (
        <div className="max-w-7xl mx-auto space-y-6 print:space-y-0 print:m-0 print:w-full print:max-w-none">
          {chunkedPurchasePages.length === 0 ? (
            <div className={`print-page-sheet ${isClassic ? 'bg-white text-black p-4 border border-black' : 'bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-8 text-black dark:text-white'}`}>
              {renderMainHeader()}
              {renderKpiCards()}
              <div className="py-12 text-center text-gray-400">
                No purchase records found matching selected criteria.
              </div>
              {renderAuditFooter()}
            </div>
          ) : (
            chunkedPurchasePages.map((pageObj, pageIdx) => {
              const isFirstPage = pageIdx === 0;
              const isLastPage = pageIdx === chunkedPurchasePages.length - 1;

              return (
                <div
                  key={pageIdx}
                  className={`print-page-sheet ${
                    isClassic
                      ? 'bg-white text-black p-4 border border-black shadow-none font-serif mb-6 print:mb-0 print:border-none print:p-0'
                      : 'bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm p-5 md:p-8 space-y-4 print:space-y-1.5 text-black dark:text-white font-sans mb-6 print:mb-0 print:p-0 print:border-none print:shadow-none print:rounded-none'
                  }`}
                >
                  {/* Top Header: Full header + KPI cards on Page 1, Compact running header on Page 2+ */}
                  {isFirstPage ? (
                    <>
                      {renderMainHeader()}
                      {renderKpiCards()}
                    </>
                  ) : (
                    renderRunningHeader(pageIdx + 1, chunkedPurchasePages.length)
                  )}

                  {/* Table for this Page Sheet */}
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className={`w-full text-left border-collapse ${isClassic ? 'border border-black text-xs' : 'text-xs'}`}>
                      <thead>
                        <tr className={`${isClassic ? 'border-b-2 border-black bg-gray-100 font-bold' : 'border-b border-stroke dark:border-strokedark bg-gray-100/70 dark:bg-meta-4/40 text-gray-600 dark:text-gray-300 font-bold'}`}>
                          <th className="py-2.5 print:py-1 px-2 text-center w-10">S#</th>
                          <th className="py-2.5 print:py-1 px-2">Date</th>
                          <th className="py-2.5 print:py-1 px-2">Bill #</th>
                          <th className="py-2.5 print:py-1 px-2">Vendor Name & Code</th>
                          <th className="py-2.5 print:py-1 px-2">Warehouse</th>
                          <th className="py-2.5 print:py-1 px-2">Products Summary</th>
                          <th className="py-2.5 print:py-1 px-2">Terms</th>
                          <th className="py-2.5 print:py-1 px-2 text-right">Gross Amount</th>
                          <th className="py-2.5 print:py-1 px-2 text-right">Freight</th>
                          <th className="py-2.5 print:py-1 px-2 text-right">Discount</th>
                          <th className="py-2.5 print:py-1 px-2 text-right">Total Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stroke dark:divide-strokedark">
                        {pageObj.items.map((pageItem) => {
                          const bill = pageItem.bill;
                          const serialNum = pageItem.serialNum;
                          const isExpanded = pageItem.isExpanded;
                          const isContinuation = !!(pageItem.itemsSlice && !pageItem.itemsSlice.isFirstPart);
                          const displayItems = pageItem.itemsSlice ? pageItem.itemsSlice.items : bill.parsedItems;

                          return (
                            <React.Fragment key={`${bill.id}-${pageItem.itemsSlice?.partIndex || 0}`}>
                              {/* Master Row */}
                              <tr
                                onClick={() => toggleBillBreakdown(String(bill.id))}
                                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 38px' }}
                                className={`cursor-pointer transition select-none ${
                                  isClassic
                                    ? 'hover:bg-gray-50 border-b border-black/40'
                                    : 'hover:bg-blue-50/40 dark:hover:bg-meta-4/20'
                                } ${isExpanded ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}`}
                              >
                                <td className="py-2 print:py-1 px-2 text-center font-mono">
                                  {isContinuation ? (
                                    <span className="text-gray-400 font-sans text-[11px]">—</span>
                                  ) : (
                                    serialNum
                                  )}
                                </td>
                                <td className="py-2 print:py-1 px-2 whitespace-nowrap">
                                  {bill.date || '—'}
                                </td>
                                <td className="py-2 print:py-1 px-2 font-bold whitespace-nowrap text-primary">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span>#{bill.purchase_no}</span>
                                    {pageItem.itemsSlice && (
                                      <span className="inline-block text-[9px] font-sans px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300">
                                        Part {pageItem.itemsSlice.partIndex}/{pageItem.itemsSlice.totalParts}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 print:py-1 px-2">
                                  <div className="font-bold leading-tight">{bill.vendor_name}</div>
                                  <div className="text-[10px] text-gray-400 font-mono">
                                    Code: {bill.vendorCode}
                                  </div>
                                </td>
                                <td className="py-2 print:py-1 px-2 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                  {bill.warehouse}
                                </td>
                                <td className="py-2 print:py-1 px-2 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                                    {pageItem.itemsSlice ? (
                                      <span>
                                        Showing {displayItems.length} items (Part {pageItem.itemsSlice.partIndex}/{pageItem.itemsSlice.totalParts})
                                      </span>
                                    ) : (
                                      <span>{bill.totalItemsCount} item{bill.totalItemsCount !== 1 ? 's' : ''} ({bill.totalItemQty} qty)</span>
                                    )}
                                    <span className="text-[10px] text-primary underline print:hidden">
                                      {isExpanded ? '▲ hide' : '▼ items'}
                                    </span>
                                  </span>
                                </td>
                                <td className="py-2 print:py-1 px-2 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    bill.terms === 'Cash'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  }`}>
                                    {bill.terms || 'Credit'}
                                  </span>
                                </td>
                                <td className="py-2 print:py-1 px-2 text-right font-mono">
                                  {isContinuation ? (
                                    <span className="text-gray-400 font-sans text-[11px]">—</span>
                                  ) : (
                                    Math.round(bill.grossPurchaseAmount).toLocaleString()
                                  )}
                                </td>
                                <td className="py-2 print:py-1 px-2 text-right font-mono text-gray-500">
                                  {isContinuation ? (
                                    <span className="text-gray-400 font-sans text-[11px]">—</span>
                                  ) : bill.freightAmount > 0 ? (
                                    Math.round(bill.freightAmount).toLocaleString()
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="py-2 print:py-1 px-2 text-right font-mono text-red-500">
                                  {isContinuation ? (
                                    <span className="text-gray-400 font-sans text-[11px]">—</span>
                                  ) : bill.discountAmount > 0 ? (
                                    `-${Math.round(bill.discountAmount).toLocaleString()}`
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="py-2 print:py-1 px-2 text-right font-bold font-mono text-black dark:text-white">
                                  {isContinuation ? (
                                    <span className="text-gray-400 font-sans text-[11px] italic font-normal">Cont.</span>
                                  ) : (
                                    Math.round(bill.netTotalAmount).toLocaleString()
                                  )}
                                </td>
                              </tr>

                              {/* Breakdown Sub-Table Drawer */}
                              {isExpanded && (
                                <tr
                                  style={{ contentVisibility: 'auto', containIntrinsicSize: '0 90px' }}
                                  className="bg-slate-50/80 dark:bg-meta-4/20 print:bg-transparent"
                                >
                                  <td colSpan={11} className="p-3 pl-8">
                                    <div className={`p-3 rounded-xl ${isClassic ? 'border border-black bg-white' : 'border border-blue-200 dark:border-blue-900 bg-white dark:bg-boxdark shadow-xs'}`}>
                                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <MdTableChart size={14} />
                                          <span>
                                            Purchase Bill Items Breakdown (#{bill.purchase_no})
                                            {pageItem.itemsSlice && ` — Part ${pageItem.itemsSlice.partIndex} of ${pageItem.itemsSlice.totalParts}`}
                                          </span>
                                        </div>
                                        {pageItem.itemsSlice && (
                                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                                            Part {pageItem.itemsSlice.partIndex} of {pageItem.itemsSlice.totalParts} ({displayItems.length} lines)
                                          </span>
                                        )}
                                      </h4>
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b border-stroke dark:border-strokedark text-gray-500 text-[10px] font-bold uppercase">
                                            <th className="py-1 px-1.5 text-left">Code / SKU</th>
                                            <th className="py-1 px-1.5 text-left">Product Title</th>
                                            <th className="py-1 px-1.5 text-left">Brand</th>
                                            <th className="py-1 px-1.5 text-left">Color</th>
                                            <th className="py-1 px-1.5 text-center">Qty (UOM)</th>
                                            <th className="py-1 px-1.5 text-right">Unit Rate</th>
                                            <th className="py-1 px-1.5 text-right">Line Total</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stroke/60 dark:divide-strokedark/60 font-mono">
                                          {displayItems.map((it: any, itemIdx: number) => (
                                            <tr key={itemIdx} className="hover:bg-gray-50/50">
                                              <td className="py-1 px-1.5 font-bold text-gray-600 dark:text-gray-300">{it.sku}</td>
                                              <td className="py-1 px-1.5 font-sans font-medium">{it.product_name}</td>
                                              <td className="py-1 px-1.5 font-sans text-gray-500">{it.brand}</td>
                                              <td className="py-1 px-1.5 font-sans text-gray-500">{it.color}</td>
                                              <td className="py-1 px-1.5 text-center font-bold">{it.qty} {it.uom}</td>
                                              <td className="py-1 px-1.5 text-right">Rs. {it.rate.toLocaleString()}</td>
                                              <td className="py-1 px-1.5 text-right font-bold text-black dark:text-white">
                                                Rs. {it.total.toLocaleString()}
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
                        })}
                      </tbody>

                      {/* ── FOOTER: PAGE SUB-TOTAL ON EVERY PAGE, GRAND TOTAL ON LAST PAGE ONLY ── */}
                      <tfoot>
                        {/* 1. PAGE SUB-TOTAL (Strictly for this page's rows) */}
                        <tr className={`${isClassic ? 'border-t-2 border-b border-black font-bold bg-gray-100 text-black' : 'border-t-2 border-b border-stroke dark:border-strokedark font-bold bg-blue-50/60 dark:bg-meta-4/30 text-black dark:text-white'}`}>
                          <td colSpan={7} className="py-2.5 print:py-1 px-2 text-right uppercase tracking-wider text-[11px] font-bold text-blue-900 dark:text-blue-300">
                            Page {pageIdx + 1} Subtotal ({pageObj.billsCount} Bills):
                          </td>
                          <td className="py-2.5 print:py-1 px-2 text-right font-mono text-xs font-bold">
                            Rs. {Math.round(pageObj.pageGross).toLocaleString()}
                          </td>
                          <td className="py-2.5 print:py-1 px-2 text-right font-mono text-xs text-gray-600 dark:text-gray-300">
                            {pageObj.pageFreight > 0 ? `Rs. ${Math.round(pageObj.pageFreight).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2.5 print:py-1 px-2 text-right font-mono text-xs text-red-600">
                            {pageObj.pageDiscounts > 0 ? `-Rs. ${Math.round(pageObj.pageDiscounts).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2.5 print:py-1 px-2 text-right font-mono text-xs text-primary font-black">
                            Rs. {Math.round(pageObj.pageNet).toLocaleString()}
                          </td>
                        </tr>

                        {/* 2. LAST PAGE ONLY: GRAND TOTAL (Directly below Page Sub-total) */}
                        {isLastPage && (
                          <tr className={`${isClassic ? 'border-t-2 border-b-4 border-double border-black font-black bg-gray-200 text-black' : 'border-t-2 border-b-2 border-emerald-400 dark:border-emerald-600 font-black bg-emerald-50 dark:bg-emerald-950/40 text-black dark:text-white'}`}>
                            <td colSpan={7} className="py-3 print:py-1.5 px-2 text-right uppercase tracking-wider text-xs font-black text-emerald-900 dark:text-emerald-300">
                              Grand Total ({kpiTotals.totalBills} Bills):
                            </td>
                            <td className="py-3 print:py-1.5 px-2 text-right font-mono text-xs font-black">
                              Rs. {Math.round(kpiTotals.totalGrossPurchases).toLocaleString()}
                            </td>
                            <td className="py-3 print:py-1.5 px-2 text-right font-mono text-xs text-gray-700 dark:text-gray-300 font-bold">
                              {kpiTotals.totalFreight > 0 ? `Rs. ${Math.round(kpiTotals.totalFreight).toLocaleString()}` : '—'}
                            </td>
                            <td className="py-3 print:py-1.5 px-2 text-right font-mono text-xs text-red-600 font-bold">
                              {kpiTotals.totalDiscounts > 0 ? `-Rs. ${Math.round(kpiTotals.totalDiscounts).toLocaleString()}` : '—'}
                            </td>
                            <td className="py-3 print:py-1.5 px-2 text-right font-mono text-xs text-primary font-black">
                              Rs. {Math.round(kpiTotals.totalNetCost).toLocaleString()}
                            </td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>

                  {/* ── AUDIT FOOTER (LAST PAGE ONLY) ── */}
                  {isLastPage && renderAuditFooter()}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ── MODES 2, 3, 4, 5: HIERARCHICAL GROUPED TABLES (Vendor / Product / Brand / Color) ── */
        <div className={`max-w-7xl mx-auto ${isClassic ? 'bg-white text-black p-4 border border-black shadow-none font-serif' : 'bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm p-5 md:p-8 space-y-6 text-black dark:text-white font-sans'} print:p-0 print:border-none print:shadow-none print:bg-white print:text-black`}>
          {renderMainHeader()}
          {renderKpiCards()}

          {/* Location-Wise Procurement Summary Matrix */}
          {criteria.reportType === 'location' && groupedHierarchyData.length > 0 && (
            <div className={`p-4 rounded-xl mb-6 ${
              isClassic 
                ? 'border-2 border-black bg-gray-50' 
                : 'border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-sm'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-stroke dark:border-strokedark">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                    Location Procurement Breakdown Summary
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    (Which location received how much procurement spend and company inward share)
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-500">
                  {groupedHierarchyData.length} Locations Active
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b ${isClassic ? 'border-black font-bold' : 'border-stroke dark:border-strokedark text-gray-500 dark:text-gray-400 font-semibold'}`}>
                      <th className="py-2 px-2 text-left">Receiving Location / Warehouse</th>
                      <th className="py-2 px-2 text-center">Bills</th>
                      <th className="py-2 px-2 text-right">Gross Purchases</th>
                      <th className="py-2 px-2 text-right">Discounts</th>
                      <th className="py-2 px-2 text-right">Freight</th>
                      <th className="py-2 px-2 text-right font-bold">Net Inward Spend</th>
                      <th className="py-2 px-2 text-right font-bold">% Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke/60 dark:divide-strokedark/60 font-mono">
                    {groupedHierarchyData.map((locGroup, idx) => {
                      const share = kpiTotals.totalNetCost > 0 
                        ? ((locGroup.subTotal / kpiTotals.totalNetCost) * 100).toFixed(1) 
                        : '0.0';
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-meta-4/20">
                          <td className="py-2 px-2 font-sans font-bold text-black dark:text-white">
                            {locGroup.groupName}
                          </td>
                          <td className="py-2 px-2 text-center text-gray-600 dark:text-gray-300">
                            {locGroup.rows.length}
                          </td>
                          <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-300">
                            Rs. {Math.round(locGroup.subGross).toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right text-red-600">
                            {locGroup.subDiscounts > 0 ? `-Rs. ${Math.round(locGroup.subDiscounts).toLocaleString()}` : '—'}
                          </td>
                          <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-300">
                            Rs. {Math.round(locGroup.subFreight).toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-primary dark:text-white">
                            Rs. {Math.round(locGroup.subTotal).toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {share}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-black font-bold font-mono">
                    <tr className="bg-gray-50 dark:bg-meta-4/40">
                      <td className="py-2 px-2 font-sans">Total All Locations</td>
                      <td className="py-2 px-2 text-center">{kpiTotals.totalBills}</td>
                      <td className="py-2 px-2 text-right">Rs. {Math.round(kpiTotals.totalGrossPurchases).toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-red-600">{kpiTotals.totalDiscounts > 0 ? `-Rs. ${Math.round(kpiTotals.totalDiscounts).toLocaleString()}` : '—'}</td>
                      <td className="py-2 px-2 text-right">Rs. {Math.round(kpiTotals.totalFreight).toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-primary dark:text-white font-black">Rs. {Math.round(kpiTotals.totalNetCost).toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-emerald-600 font-black">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {groupedHierarchyData && (
            <div className="space-y-6">
              {groupedHierarchyData.length === 0 ? (
                <div className="py-8 text-center text-gray-400 border border-dashed rounded-xl">
                  No matching purchase transactions found for this grouping.
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
                          {criteria.reportType === 'product' && 'PRODUCT: '}
                          {criteria.reportType === 'vendor' && 'VENDOR: '}
                          {criteria.reportType === 'location' && 'LOCATION: '}
                          {criteria.reportType === 'brand' && 'BRAND: '}
                          {criteria.reportType === 'color' && 'COLOR: '}
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
                              <td className="py-2 px-2 text-right font-mono text-red-600">
                                -Rs. {Math.round(group.subDiscounts).toLocaleString()}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-gray-600">
                                Rs. {Math.round(group.subFreight).toLocaleString()}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-primary">
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

              {/* Overall Grand Summary & Signatures on Grouped View */}
              <div className="print-grand-total-block print:break-inside-avoid print:page-break-inside-avoid print:mt-1">
                <div className={`p-3.5 print:p-2 print:my-0.5 rounded-xl flex items-center justify-between text-xs font-black ${
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

                {/* Audit Signatures on Grouped View */}
                {renderAuditFooter()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BasicPurchaseReportPrint;
