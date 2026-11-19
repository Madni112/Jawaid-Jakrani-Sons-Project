import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { useAuth } from '../../../Context/Auth';
import Spinner from '../../../ui/Spinner';
import { toast } from 'react-hot-toast';
import {
  MdArrowBack,
  MdTune,
  MdReceipt,
  MdPerson,
  MdBrandingWatermark,
  MdPalette,
  MdCalendarToday,
  MdFilterAlt,
  MdRestartAlt,
  MdPrint,
  MdLock,
  MdClose,
  MdSearch,
  MdCheckCircle,
  MdLayers,
  MdTrendingUp
} from 'react-icons/md';
import { extractProductColor, DEFAULT_PRODUCT_COLORS, getSwatchColor } from '../../../utils/colorService';
import SearchableSelect, { SearchableOption } from '../../../components/SearchableSelect';
import { fetchSystemMasterConfig } from '../../../utils/systemPermissions';

export type BasicSalesReportType = 'invoice' | 'salesmen' | 'brand' | 'color' | 'product';

export interface BasicSalesFilterCriteria {
  reportType: BasicSalesReportType;
  invoiceIds?: string[];
  invoiceId?: string;
  invoiceNo?: string;
  salesmen?: string[];
  salesman?: string;
  brands?: string[];
  brand?: string;
  colors?: string[];
  color?: string;
  customers?: string[];
  customer?: string;
  parentCategories?: string[];
  subCategories?: string[];
  categories?: string[];
  products?: string[];
  dateMode: 'single' | 'multi';
  singleDate?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: 'date_desc' | 'date_asc' | 'invoice_desc' | 'invoice_asc' | 'customer_asc' | 'customer_desc';
}

const STORAGE_CRITERIA_KEY = 'zac_basic_sales_report_criteria';
const META_CACHE_KEY = 'zac_basic_sales_meta_v3';

// ── REUSABLE FACET CHECKBOX LIST WITH SEARCHBAR, SHIFT+CLICK & KEYBOARD ARROW/ENTER NAVIGATION ──
interface FacetItem {
  id: string;
  label: string;
  subLabel?: string;
  meta?: string;
}

interface FacetCheckboxListProps {
  title: string;
  items: FacetItem[];
  selectedIds: string[];
  onSelectionChange: (newSelected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledMessage?: string;
  heightClass?: string;
}

const FacetCheckboxList: React.FC<FacetCheckboxListProps> = ({
  title,
  items,
  selectedIds,
  onSelectionChange,
  placeholder = 'Search...',
  disabled = false,
  disabledMessage = 'Locked',
  heightClass = 'h-48'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const lastClickedIndexRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter items matching search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        (it.subLabel && it.subLabel.toLowerCase().includes(q)) ||
        (it.meta && it.meta.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Reset highlight when search query or items change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, items]);

  // Auto-scroll highlighted row into view on arrow navigation
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>(`[data-facet-idx="${highlightedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Only count selected items that are actually present in the current items list
  const activeSelectedCount = useMemo(() => {
    const itemIds = new Set(items.map((it) => it.id));
    return selectedIds.filter((id) => itemIds.has(id)).length;
  }, [items, selectedIds]);

  // Handle selection toggling (single click, shift+click, or keyboard enter)
  const toggleIndex = (index: number, isShift = false) => {
    if (disabled) return;
    const clickedItem = filteredItems[index];
    if (!clickedItem) return;

    const isCurrentlySelected = selectedIds.includes(clickedItem.id);

    if (isShift && lastClickedIndexRef.current !== null && lastClickedIndexRef.current !== index) {
      // Shift+Click range
      const start = Math.min(lastClickedIndexRef.current, index);
      const end = Math.max(lastClickedIndexRef.current, index);
      const rangeIds = filteredItems.slice(start, end + 1).map((it) => it.id);
      const shouldSelect = !isCurrentlySelected;

      let nextSelected = new Set(selectedIds);
      rangeIds.forEach((id) => {
        if (shouldSelect) nextSelected.add(id);
        else nextSelected.delete(id);
      });
      onSelectionChange(Array.from(nextSelected));
    } else {
      // Normal single toggle
      if (isCurrentlySelected) {
        onSelectionChange(selectedIds.filter((id) => id !== clickedItem.id));
      } else {
        onSelectionChange([...selectedIds, clickedItem.id]);
      }
    }

    lastClickedIndexRef.current = index;
    setHighlightedIndex(index);
  };

  // Keyboard navigation handler: ArrowDown, ArrowUp, Enter to toggle
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleIndex(highlightedIndex, e.shiftKey);
    }
  };

  // Select all visible filtered items
  const handleSelectAllFiltered = () => {
    if (disabled) return;
    const nextSelected = new Set(selectedIds);
    filteredItems.forEach((it) => nextSelected.add(it.id));
    onSelectionChange(Array.from(nextSelected));
  };

  // Clear all selections
  const handleClearAll = () => {
    if (disabled) return;
    onSelectionChange([]);
    lastClickedIndexRef.current = null;
  };

  return (
    <div
      className={`rounded-2xl border transition flex flex-col ${
        disabled
          ? 'border-dashed border-stroke dark:border-strokedark bg-gray-50/70 dark:bg-meta-4/20 opacity-70'
          : 'border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-xs'
      }`}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      {/* 1. Header Bar: Title + Count Badge + Quick Actions */}
      <div className="p-2.5 px-3 border-b border-stroke dark:border-strokedark flex items-center justify-between gap-2 bg-gray-50/50 dark:bg-meta-4/30 rounded-t-2xl">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-xs font-bold text-black dark:text-white truncate">{title}</span>
          <span
            className={`text-[10px] font-black px-1.5 py-0.2 rounded-full shrink-0 ${
              activeSelectedCount > 0
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-meta-4 text-gray-600 dark:text-gray-300'
            }`}
          >
            {activeSelectedCount > 0 ? `${activeSelectedCount}/${items.length}` : `All (${items.length})`}
          </span>
        </div>

        {!disabled && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer px-1 py-0.5 rounded"
            >
              Select All
            </button>
            <span className="text-gray-300 text-[10px]">•</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] font-bold text-gray-500 hover:text-red-500 cursor-pointer px-1 py-0.5 rounded"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* 2. Search Bar at Top of Box with Keyboard Support */}
      {!disabled ? (
        <div className="p-2 border-b border-stroke dark:border-strokedark bg-white dark:bg-boxdark">
          <div className="relative flex items-center">
            <MdSearch size={16} className="absolute left-2.5 text-gray-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-stroke dark:border-strokedark bg-gray-50/60 dark:bg-meta-4/40 text-black dark:text-white placeholder:text-gray-400 focus:border-primary focus:bg-white dark:focus:bg-boxdark outline-hidden transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <MdClose size={13} />
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* 3. Items List with Checkboxes & Active Highlight */}
      <div
        ref={listRef}
        className={`overflow-y-auto ${heightClass} p-1 divide-y divide-stroke/40 dark:divide-strokedark/40 focus:outline-hidden`}
      >
        {disabled ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400 space-y-1">
            <MdLock size={22} className="opacity-50" />
            <p className="text-xs font-semibold">{disabledMessage}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4 text-xs text-gray-400">
            No matching items found for &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const isChecked = selectedIds.includes(item.id);
            const isHighlighted = index === highlightedIndex;

            return (
              <div
                key={`${title}-${item.id}`}
                data-facet-idx={index}
                onClick={(e) => toggleIndex(index, e.shiftKey)}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
                  isChecked
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold'
                    : isHighlighted
                    ? 'bg-gray-100 dark:bg-meta-4/60 ring-1 ring-primary/40 text-black dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4/50'
                }`}
              >
                {/* Visual Tick Box */}
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary cursor-pointer shrink-0 accent-primary pointer-events-none"
                />

                {/* Item Label & Meta */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                  <span className="truncate leading-tight font-medium">{item.label}</span>
                  {item.meta && (
                    <span className="text-[10px] text-gray-400 font-mono shrink-0">{item.meta}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Footer Note */}
      <div className="p-1.5 px-3 border-t border-stroke/60 dark:border-strokedark/60 bg-gray-50/30 dark:bg-meta-4/20 text-[10px] text-gray-400 flex items-center justify-between rounded-b-2xl">
        <span>Click / Enter • &uarr;&darr; Navigate • Shift+Click</span>
        <span>{filteredItems.length} shown</span>
      </div>
    </div>
  );
};

// ── FAST SYNCHRONOUS CACHE INITIALIZER ──
const getInitialMeta = () => {
  try {
    const raw = localStorage.getItem(META_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

// ── MAIN BASIC SALES REPORT FILTER PAGE ──
const BasicSalesReport: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId, businessName } = useAuth();

  const cachedMeta = useMemo(() => getInitialMeta(), []);

  // Instant 0ms hydration: if cache exists, loading starts as FALSE!
  const [loading, setLoading] = useState(!cachedMeta?.productsMaster?.length);

  // Raw Database Catalogs (Instant 0ms initial state from localStorage)
  const [invoices, setInvoices] = useState<any[]>(() => cachedMeta?.invoices || []);
  const [customers, setCustomers] = useState<any[]>(() => cachedMeta?.customers || []);
  const [salesmen, setSalesmen] = useState<any[]>(() => cachedMeta?.salesmen || []);
  const [productsMaster, setProductsMaster] = useState<any[]>(() => cachedMeta?.productsMaster || []);
  const [colorOptions, setColorOptions] = useState<string[]>(() => cachedMeta?.colorOptions || []);

  // 1. Primary Report Type Dropdown
  const [reportType, setReportType] = useState<BasicSalesReportType>('invoice');

  // 2. Mode Specific Multi-Select Primary Selections
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedSalesmen, setSelectedSalesmen] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // 3. Shared Cascading Filters (Parent -> Sub -> Leaf -> Product)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedParentCategories, setSelectedParentCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedLeafCategories, setSelectedLeafCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // 4. Date Filtering
  const [dateMode, setDateMode] = useState<'single' | 'multi'>('multi');
  const [singleDate, setSingleDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // 5. Sort Order (with Customer A-Z and Z-A)
  const [sortBy, setSortBy] = useState<
    'date_desc' | 'date_asc' | 'invoice_desc' | 'invoice_asc' | 'customer_asc' | 'customer_desc'
  >('date_desc');

  // Background Parallel Metadata Re-validation (Stale-While-Revalidate)
  useEffect(() => {
    let isMounted = true;

    const loadAllMetadata = async () => {
      try {
        const [invRes1, invRes2, custRes, smRes, prodRes1, prodRes2] = await Promise.all([
          supabase
            .from('sales_invoices')
            .select('id, invoice_no, customer_name, sale_date, total_amount, salesman, created_at')
            .order('id', { ascending: false })
            .range(0, 999),
          supabase
            .from('sales_invoices')
            .select('id, invoice_no, customer_name, sale_date, total_amount, salesman, created_at')
            .order('id', { ascending: false })
            .range(1000, 2999),
          supabase
            .from('customers')
            .select('id, customerName, customer_code, customerCode, city, address, primaryPhone')
            .order('customerName', { ascending: true }),
          supabase
            .from('salesmen')
            .select('id, name')
            .order('name', { ascending: true }),
          supabase
            .from('products')
            .select('id, product_name, category, sub_category, sub_sub_category, brand, item_sr_no, retail_price, uom, product_description')
            .order('product_name', { ascending: true })
            .range(0, 999),
          supabase
            .from('products')
            .select('id, product_name, category, sub_category, sub_sub_category, brand, item_sr_no, retail_price, uom, product_description')
            .order('product_name', { ascending: true })
            .range(1000, 2999)
        ]);

        if (!isMounted) return;

        const invs = (invRes1.data || []).concat(invRes2.data || []);
        const prods = (prodRes1.data || []).concat(prodRes2.data || []);
        const custs = custRes.data || [];
        const sms = smRes.data || [];

        // Extract colors locally in memory (0ms network overhead)
        const colorsSet = new Set<string>(DEFAULT_PRODUCT_COLORS);
        prods.forEach((p: any) => {
          const c = extractProductColor(p);
          if (c) colorsSet.add(c);
        });
        const parsedColors = Array.from(colorsSet).sort((a, b) => a.localeCompare(b));

        setInvoices(invs);
        setCustomers(custs);
        setSalesmen(sms);
        setProductsMaster(prods);
        setColorOptions(parsedColors);

        // Cache persistently in localStorage
        try {
          localStorage.setItem(
            META_CACHE_KEY,
            JSON.stringify({
              invoices: invs,
              customers: custs,
              salesmen: sms,
              productsMaster: prods,
              colorOptions: parsedColors
            })
          );
        } catch {}
      } catch (err: any) {
        if (!cachedMeta) {
          toast.error('Failed to load system metadata: ' + (err.message || 'Network error'));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAllMetadata();
    return () => {
      isMounted = false;
    };
  }, []);

  // System permissions real-time synchronization for report visibility
  const [hiddenReports, setHiddenReports] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem('erp_system_master_permissions_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed?.hidden_reports) ? parsed.hidden_reports : [];
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    fetchSystemMasterConfig().then((cfg) => {
      if (Array.isArray(cfg?.hidden_reports)) {
        setHiddenReports(cfg.hidden_reports);
      }
    });
    const onSync = (e: any) => {
      if (e.detail && Array.isArray(e.detail.hidden_reports)) {
        setHiddenReports(e.detail.hidden_reports);
      }
    };
    window.addEventListener('erp_system_permissions_updated', onSync);
    return () => window.removeEventListener('erp_system_permissions_updated', onSync);
  }, []);

  const visibleSalesReportsNav = useMemo(() => {
    const navList = [
      { id: 'basic-sales-report', label: 'Basic Sales Report', path: '/basic-sales-report', icon: MdTrendingUp },
      { id: 'sale-inv-detail', label: 'Sales Invoice Detail Report', path: '/Reports/Sales-Report?tab=invoice', icon: MdReceipt },
      { id: 'category-wise-sales', label: 'Category-Wise Sales Report', path: '/Reports/Sales-Report?tab=category-sales', icon: MdLayers },
      { id: 'product-sales-history', label: 'Product Sales History Report', path: '/Reports/Sales-Report?tab=product-sales-history', icon: MdLayers },
      { id: 'commercial-sale-ledger', label: 'Sale (Salesmen wise)', path: '/Reports/Sales-Report?tab=sale', icon: MdPerson },
      { id: 'sales-query-center', label: 'Sales Filter & Parameter Builder', path: '/Reports/Sales-Report?tab=sales-query', icon: MdTune },
      { id: 'sales-return-ledger', label: 'Sales Return & Credit Ledger', path: '/Reports/Sales-Report?tab=return', icon: MdLayers },
      { id: 'customer-sales-breakdown', label: 'Customer Sales & Volume', path: '/Reports/Sales-Report?tab=customer-sales', icon: MdPerson },
    ];
    return navList.filter((r) => !hiddenReports.includes(r.id));
  }, [hiddenReports]);

  // Is Invoice Selected? (Locks date to Single Date and auto-fills customer)
  const isInvoiceSelected = Boolean(reportType === 'invoice' && selectedInvoiceIds.length > 0);

  // Active Selected Invoices Records
  const activeSelectedInvoices = useMemo(() => {
    if (!selectedInvoiceIds.length) return [];
    return invoices.filter((inv) => selectedInvoiceIds.includes(String(inv.id)));
  }, [selectedInvoiceIds, invoices]);

  // Auto-fill and lock when Invoice(s) are chosen
  useEffect(() => {
    if (reportType === 'invoice' && activeSelectedInvoices.length > 0) {
      // 1. Lock Date to single mode
      setDateMode('single');

      if (activeSelectedInvoices.length === 1) {
        const singleInv = activeSelectedInvoices[0];
        // Auto-lock customer
        if (singleInv.customer_name) {
          setSelectedCustomers([singleInv.customer_name]);
        }
        // Auto-lock date to invoice date
        const invDate = singleInv.sale_date || (singleInv.created_at ? singleInv.created_at.split('T')[0] : '');
        if (invDate) {
          setSingleDate(invDate);
        }
      } else {
        // If all selected invoices have the same customer, auto-lock customer
        const firstCust = activeSelectedInvoices[0].customer_name;
        if (firstCust && activeSelectedInvoices.every((i) => i.customer_name === firstCust)) {
          setSelectedCustomers([firstCust]);
        }
      }

      // Clear broad category selections
      setSelectedParentCategories([]);
      setSelectedSubCategories([]);
      setSelectedLeafCategories([]);
      setSelectedProducts([]);
    }
  }, [reportType, activeSelectedInvoices]);

  // On-demand fetch items ONLY for the selected invoices
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedInvoiceIds.length) {
      setSelectedInvoiceItems([]);
      return;
    }
    let isCurrent = true;
    supabase
      .from('sales_invoices')
      .select('items')
      .in('id', selectedInvoiceIds)
      .then(({ data }) => {
        if (!isCurrent || !data) return;
        const allItems: any[] = [];
        data.forEach((inv) => {
          const parsed = Array.isArray(inv.items)
            ? inv.items
            : (typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : []);
          allItems.push(...parsed);
        });
        setSelectedInvoiceItems(allItems);
      });
    return () => {
      isCurrent = false;
    };
  }, [selectedInvoiceIds]);

  // Extract products present in the selected invoices
  const invoiceProductNames = useMemo(() => {
    if (!selectedInvoiceIds.length || selectedInvoiceItems.length === 0) return null;
    const names = new Set<string>();
    selectedInvoiceItems.forEach((it: any) => {
      const n = (it.itemName || it.product_name || it.name || '').trim();
      if (n) names.add(n.toLowerCase());
    });
    return names;
  }, [selectedInvoiceIds, selectedInvoiceItems]);

  // ── SALESMEN SOLD PRODUCTS LOOKUP (DYNAMIC & ON-DEMAND) ──
  const [salesmanProductNames, setSalesmanProductNames] = useState<Set<string> | null>(null);

  useEffect(() => {
    const activeSalesmen = selectedSalesmen.filter((s) => s && s !== 'All');
    if (activeSalesmen.length === 0) {
      setSalesmanProductNames(null);
      return;
    }

    let isCurrent = true;
    supabase
      .from('sales_invoices')
      .select('items')
      .in('salesman', activeSalesmen)
      .then(({ data }) => {
        if (!isCurrent || !data) return;
        const set = new Set<string>();
        data.forEach((inv: any) => {
          const items = Array.isArray(inv.items)
            ? inv.items
            : (typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : []);
          items.forEach((it: any) => {
            const n = (it.itemName || it.product_name || it.name || '').trim().toLowerCase();
            if (n) set.add(n);
          });
        });
        setSalesmanProductNames(set);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedSalesmen]);

  // ── BASE PRODUCTS POOL FILTERED DYNAMICALLY BY COLOR, BRAND, SALESMAN & INVOICE ──
  const baseFilteredProductsPool = useMemo(() => {
    let pool = productsMaster;

    // A. Target Invoice constraint (only in invoice mode if specific invoices selected)
    if (reportType === 'invoice' && invoiceProductNames && invoiceProductNames.size > 0) {
      pool = pool.filter((p) => invoiceProductNames.has((p.product_name || '').trim().toLowerCase()));
    }

    // B. Color constraint (strictly active in color mode)
    if (reportType === 'color') {
      const activeColors = selectedColors.filter((c) => c && c !== 'All');
      if (activeColors.length > 0) {
        const selectedColSet = new Set(activeColors.map((c) => c.toLowerCase().trim()));
        pool = pool.filter((p) => {
          const prodColor = (extractProductColor(p) || '').toLowerCase().trim();
          const prodDesc = (p.product_description || p.product_name || '').toLowerCase();
          return Array.from(selectedColSet).some(
            (c) => prodColor.includes(c) || prodDesc.includes(c)
          );
        });
      }
    }

    // C. Brand constraint (strictly active in brand mode)
    if (reportType === 'brand') {
      const activeBrands = selectedBrands.filter((b) => b && b !== 'All');
      if (activeBrands.length > 0) {
        const selectedBrandSet = new Set(activeBrands.map((b) => b.toLowerCase().trim()));
        pool = pool.filter((p) => {
          const b1 = (p.brand || '').toLowerCase().trim();
          const b2 = (p.sub_category || '').toLowerCase().trim();
          const b3 = (p.sub_sub_category || '').toLowerCase().trim();
          return (
            selectedBrandSet.has(b1) ||
            selectedBrandSet.has(b2) ||
            selectedBrandSet.has(b3)
          );
        });
      }
    }

    // D. Salesman constraint (strictly active in salesmen mode)
    if (reportType === 'salesmen') {
      const activeSalesmen = selectedSalesmen.filter((s) => s && s !== 'All');
      if (activeSalesmen.length > 0 && salesmanProductNames) {
        pool = pool.filter((p) =>
          salesmanProductNames.has((p.product_name || '').trim().toLowerCase())
        );
      }
    }

    return pool;
  }, [productsMaster, reportType, invoiceProductNames, selectedColors, selectedBrands, selectedSalesmen, salesmanProductNames]);

  // 1. Available Parent Categories List (sub_sub_category) derived dynamically
  const parentCategoryFacetItems: FacetItem[] = useMemo(() => {
    const parents = new Set<string>();
    baseFilteredProductsPool.forEach((p) => {
      const parent = (p.sub_sub_category || '').trim();
      if (parent) parents.add(parent);
    });
    return Array.from(parents)
      .sort()
      .map((p) => ({ id: p, label: p }));
  }, [baseFilteredProductsPool]);

  // 2. Available Sub-Categories List (sub_category) - active only after Parent is chosen
  const subCategoryFacetItems: FacetItem[] = useMemo(() => {
    if (selectedParentCategories.length === 0) return [];
    const pool = baseFilteredProductsPool.filter((p) => {
      const parent = (p.sub_sub_category || '').trim();
      return selectedParentCategories.includes(parent);
    });

    const subs = new Set<string>();
    pool.forEach((p) => {
      const sub = (p.sub_category || '').trim();
      if (sub) subs.add(sub);
    });
    return Array.from(subs)
      .sort()
      .map((s) => ({ id: s, label: s }));
  }, [baseFilteredProductsPool, selectedParentCategories]);

  // 3. Available Leaf Categories List (category) - active only after Sub-Category is chosen
  const leafCategoryFacetItems: FacetItem[] = useMemo(() => {
    if (selectedSubCategories.length === 0) return [];
    const pool = baseFilteredProductsPool.filter((p) => {
      const sub = (p.sub_category || '').trim();
      return selectedSubCategories.includes(sub);
    });

    const leaves = new Set<string>();
    pool.forEach((p) => {
      const cat = (p.category || '').trim();
      if (cat) leaves.add(cat);
    });
    return Array.from(leaves)
      .sort()
      .map((c) => ({ id: c, label: c }));
  }, [baseFilteredProductsPool, selectedSubCategories]);

  // 4. Available Products List - filtered progressively by Parent -> Sub -> Leaf
  const productFacetItems: FacetItem[] = useMemo(() => {
    let pool = baseFilteredProductsPool;

    if (selectedParentCategories.length > 0) {
      pool = pool.filter((p) => selectedParentCategories.includes((p.sub_sub_category || '').trim()));
    }

    if (selectedSubCategories.length > 0) {
      pool = pool.filter((p) => selectedSubCategories.includes((p.sub_category || '').trim()));
    }

    if (selectedLeafCategories.length > 0) {
      pool = pool.filter((p) => selectedLeafCategories.includes((p.category || '').trim()));
    }

    // Deduplicate products by unique name and sort alphabetically
    const seen = new Set<string>();
    const unique: FacetItem[] = [];
    pool.forEach((p) => {
      const name = (p.product_name || '').trim();
      if (!name || seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      unique.push({
        id: name,
        label: name,
        subLabel: p.item_sr_no ? `SKU: ${p.item_sr_no}` : undefined,
        meta: p.retail_price ? `Rs. ${Number(p.retail_price).toLocaleString()}` : undefined
      });
    });

    return unique.sort((a, b) => a.label.localeCompare(b.label));
  }, [baseFilteredProductsPool, selectedParentCategories, selectedSubCategories, selectedLeafCategories]);

  // Auto-prune selected products when category filters change so stale selections don't linger
  useEffect(() => {
    if (selectedProducts.length > 0 && productFacetItems.length > 0) {
      const validNames = new Set(productFacetItems.map((p) => p.id));
      const pruned = selectedProducts.filter((name) => validNames.has(name));
      if (pruned.length !== selectedProducts.length) {
        setSelectedProducts(pruned);
      }
    }
  }, [productFacetItems]);

  // ── SEARCHABLE DROPDOWN OPTION LISTS ──
  const invoiceOptions: SearchableOption[] = useMemo(() => {
    const list: SearchableOption[] = [
      { id: 'All', label: `All Invoices (${invoices.length} Total)`, subLabel: 'Audit all invoices without invoice lock' }
    ];
    invoices.forEach((inv) => {
      const invNo = inv.invoice_no || inv.id;
      const cust = inv.customer_name || 'Cash Customer';
      const date = inv.sale_date || (inv.created_at ? inv.created_at.split('T')[0] : '');
      const amt = Number(inv.total_amount || 0).toLocaleString();
      const sm = inv.salesman ? ` • By ${inv.salesman}` : '';
      list.push({
        id: String(inv.id),
        label: `Invoice #${invNo} — ${cust}`,
        subLabel: `${date} • Rs. ${amt}${sm}`
      });
    });
    return list;
  }, [invoices]);

  const salesmanOptions: SearchableOption[] = useMemo(() => {
    const list: SearchableOption[] = [
      { id: 'All', label: `All Salesmen (${salesmen.length})`, subLabel: 'View sales performance across all sales representatives' }
    ];
    salesmen.forEach((sm) => {
      list.push({
        id: sm.name,
        label: sm.name,
        subLabel: 'Sales Representative'
      });
    });
    return list;
  }, [salesmen]);

  const brandOptions: SearchableOption[] = useMemo(() => {
    const brandCounts = new Map<string, number>();
    productsMaster.forEach((p) => {
      const b = (p.brand || p.sub_category || '').trim();
      if (b) brandCounts.set(b, (brandCounts.get(b) || 0) + 1);
    });
    const sorted = Array.from(brandCounts.keys()).sort((a, b) => a.localeCompare(b));
    const list: SearchableOption[] = [
      { id: 'All', label: `All Brands (${sorted.length})`, subLabel: 'Audit sales across all brands' }
    ];
    sorted.forEach((b) => {
      const count = brandCounts.get(b) || 0;
      list.push({
        id: b,
        label: b,
        subLabel: `${count} product${count === 1 ? '' : 's'} registered`
      });
    });
    return list;
  }, [productsMaster]);

  const colorChoiceOptions: SearchableOption[] = useMemo(() => {
    const list: SearchableOption[] = [
      { id: 'All', label: `All Available Colors (${colorOptions.length})`, subLabel: 'Audit sales across all surface colors & finishes' }
    ];
    colorOptions.forEach((col) => {
      list.push({
        id: col,
        label: col,
        subLabel: 'Surface / Tile Shade',
        swatchColor: getSwatchColor(col)
      });
    });
    return list;
  }, [colorOptions]);

  const customerOptions: SearchableOption[] = useMemo(() => {
    const list: SearchableOption[] = [
      { id: 'All', label: `All Customers (${customers.length})`, subLabel: 'Include sales across all registered customers' }
    ];
    customers.forEach((c) => {
      const code = c.customer_code || c.customerCode || '';
      const city = c.city || '';
      const phone = c.primaryPhone || '';
      const subParts = [code, city, phone].filter(Boolean);
      list.push({
        id: c.customerName,
        label: c.customerName,
        subLabel: subParts.length > 0 ? subParts.join(' • ') : 'Registered Customer'
      });
    });
    return list;
  }, [customers]);

  // Date Range Shortcuts Helper
  const applyDateShortcut = (range: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month') => {
    if (isInvoiceSelected) return;
    const now = new Date();
    let from = new Date();
    let to = new Date();

    if (range === 'today') {
      // today to today
    } else if (range === 'yesterday') {
      from.setDate(now.getDate() - 1);
      to.setDate(now.getDate() - 1);
    } else if (range === 'this_week') {
      const day = now.getDay() || 7;
      from.setDate(now.getDate() - day + 1);
    } else if (range === 'this_month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'last_month') {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(to.toISOString().split('T')[0]);
    setDateMode('multi');
  };

  // Reset Filters to Safe Defaults
  const handleResetFilters = () => {
    setSelectedInvoiceIds([]);
    setSelectedSalesmen([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedCustomers([]);
    setSelectedParentCategories([]);
    setSelectedSubCategories([]);
    setSelectedLeafCategories([]);
    setSelectedProducts([]);
    setDateMode('multi');
    const today = new Date();
    setSingleDate(today.toISOString().split('T')[0]);
    const past = new Date();
    past.setDate(today.getDate() - 30);
    setDateFrom(past.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
    setSortBy('date_desc');
    toast.success('Filters reset to default values.');
  };

  // Handle primary report type switch - clears mode-specific filters so they don't leak across tabs
  const handleReportTypeChange = (newType: BasicSalesReportType) => {
    setReportType(newType);
    setSelectedInvoiceIds([]);
    setSelectedSalesmen([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedParentCategories([]);
    setSelectedSubCategories([]);
    setSelectedLeafCategories([]);
    setSelectedProducts([]);
  };

  // Handle Form Submission -> Navigate to Print View
  const handleGenerateReport = () => {
    const singleInv = activeSelectedInvoices[0];

    const criteria: BasicSalesFilterCriteria = {
      reportType,
      invoiceIds: reportType === 'invoice' && selectedInvoiceIds.length > 0 ? selectedInvoiceIds : undefined,
      invoiceId: reportType === 'invoice' && selectedInvoiceIds.length === 1 ? selectedInvoiceIds[0] : undefined,
      invoiceNo: singleInv?.invoice_no || undefined,
      salesmen: reportType === 'salesmen' && selectedSalesmen.length > 0 && !selectedSalesmen.includes('All') ? selectedSalesmen : undefined,
      salesman: reportType === 'salesmen' && selectedSalesmen.length === 1 && selectedSalesmen[0] !== 'All' ? selectedSalesmen[0] : undefined,
      brands: reportType === 'brand' && selectedBrands.length > 0 && !selectedBrands.includes('All') ? selectedBrands : undefined,
      brand: reportType === 'brand' && selectedBrands.length === 1 && selectedBrands[0] !== 'All' ? selectedBrands[0] : undefined,
      colors: reportType === 'color' && selectedColors.length > 0 && !selectedColors.includes('All') ? selectedColors : undefined,
      color: reportType === 'color' && selectedColors.length === 1 && selectedColors[0] !== 'All' ? selectedColors[0] : undefined,
      customers: selectedCustomers.length > 0 && !selectedCustomers.includes('All') ? selectedCustomers : undefined,
      customer: selectedCustomers.length === 1 && selectedCustomers[0] !== 'All' ? selectedCustomers[0] : undefined,
      parentCategories: selectedParentCategories.length > 0 ? selectedParentCategories : undefined,
      subCategories: selectedSubCategories.length > 0 ? selectedSubCategories : undefined,
      categories: selectedLeafCategories.length > 0 ? selectedLeafCategories : undefined,
      products: selectedProducts.length > 0 ? selectedProducts : undefined,
      dateMode,
      singleDate: dateMode === 'single' ? singleDate : undefined,
      dateFrom: dateMode === 'multi' ? dateFrom : undefined,
      dateTo: dateMode === 'multi' ? dateTo : undefined,
      sortBy
    };

    try {
      sessionStorage.setItem(STORAGE_CRITERIA_KEY, JSON.stringify(criteria));
    } catch {}

    const dest = `${tenantId ? `/${tenantId}` : ''}/basic-sales-report/print`;
    navigate(dest, { state: { criteria } });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading Basic Sales Report metadata...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* ── TOP HEADER BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Core Department Report
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {businessName || 'Zohaib Ali & Co.'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              <span>📊 Basic Sales Report</span>
            </h1>
          </div>
        </div>

        {/* Quick Reset Action */}
        <button
          type="button"
          onClick={handleResetFilters}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 border border-stroke dark:border-strokedark rounded-xl bg-white dark:bg-boxdark hover:bg-gray-100 dark:hover:bg-meta-4 transition shadow-xs cursor-pointer"
        >
          <MdRestartAlt size={16} />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* ── SISTER SALES REPORTS TABS SWITCHER ── */}
      {visibleSalesReportsNav.length > 1 && (
        <div className="bg-white dark:bg-boxdark p-1.5 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs overflow-x-auto print:hidden">
          <div className="flex items-center gap-1.5 min-w-max">
            {visibleSalesReportsNav.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === 'basic-sales-report';
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.path && tab.id !== 'basic-sales-report') {
                      navigate(tab.path);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-white/20 text-white ml-0.5">
                      BASIC
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MAIN FILTER CARD CONTAINER ── */}
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-xs p-5 md:p-6 space-y-6">

        {/* 1. PRIMARY REPORT TYPE SELECTION */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <MdTune className="text-primary" size={16} />
            <span>Select Report Type *</span>
          </label>
          <div className="relative">
            <select
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value as BasicSalesReportType)}
              className="w-full px-4 py-3 rounded-xl border border-stroke dark:border-strokedark bg-slate-50/50 dark:bg-meta-4/20 text-black dark:text-white text-xs md:text-sm font-semibold focus:border-primary focus:bg-white dark:focus:bg-boxdark outline-hidden transition cursor-pointer"
            >
              <option value="invoice">📑 Invoice wise Report (Audit invoices &amp; item lines)</option>
              <option value="product">📦 Product wise Report (Items &amp; SKU turnover hierarchy)</option>
              <option value="salesmen">👤 Salesmen wise Report (Sales representative performance)</option>
              <option value="brand">🏷️ Brand wise Sales (Turnover grouped by brand)</option>
              <option value="color">🎨 Color Wise Sales (Tile &amp; surface shade analytics)</option>
            </select>
          </div>
          <p className="text-[11px] text-gray-400">
            {reportType === 'invoice' && 'Direct transaction ledger. Auto-locks customer and date when target invoice is picked.'}
            {reportType === 'product' && 'Product sales register grouped by item, displaying individual line items, rate, quantity sold, and product totals.'}
            {reportType === 'salesmen' && 'Breaks down sales performance grouped by sales representative.'}
            {reportType === 'brand' && 'Aggregates turnover by manufacturer & product brand.'}
            {reportType === 'color' && 'Analyzes shade popularity, tile finishes, and color volumes.'}
          </p>
        </div>

        {/* 2. MODE-SPECIFIC MULTI-SELECT DROPDOWNS */}
        <div className="space-y-4">
          
          {/* Target Invoice Multi-Select Dropdown */}
          {reportType === 'invoice' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <MdReceipt className="text-blue-500" size={16} />
                <span>Select Target Invoice (Optional — pick specific to auto-fill &amp; lock criteria):</span>
              </label>
              <SearchableSelect
                multiple={true}
                options={invoiceOptions}
                value={selectedInvoiceIds}
                onChange={setSelectedInvoiceIds}
                placeholder={`All Invoices (${invoices.length} Total)`}
                searchPlaceholder="Search invoice #, customer name, date..."
              />
            </div>
          )}

          {/* Salesman Multi-Select Dropdown */}
          {reportType === 'salesmen' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <MdPerson className="text-emerald-500" size={16} />
                <span>Select Salesman:</span>
              </label>
              <SearchableSelect
                multiple={true}
                options={salesmanOptions}
                value={selectedSalesmen}
                onChange={setSelectedSalesmen}
                placeholder="All Salesmen"
                searchPlaceholder="Search salesman by name..."
              />
              {selectedSalesmen.length > 0 && !selectedSalesmen.includes('All') && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Showing products &amp; categories sold by {selectedSalesmen.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Brand Multi-Select Dropdown */}
          {reportType === 'brand' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <MdBrandingWatermark className="text-indigo-500" size={16} />
                <span>Select Brand:</span>
              </label>
              <SearchableSelect
                multiple={true}
                options={brandOptions}
                value={selectedBrands}
                onChange={setSelectedBrands}
                placeholder="All Brands"
                searchPlaceholder="Search brand name..."
              />
              {selectedBrands.length > 0 && !selectedBrands.includes('All') && (
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  Categories &amp; products filtered to brand: {selectedBrands.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Color Multi-Select Dropdown */}
          {reportType === 'color' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <MdPalette className="text-pink-500" size={16} />
                <span>Select Color / Surface Shade:</span>
              </label>
              <SearchableSelect
                multiple={true}
                options={colorChoiceOptions}
                value={selectedColors}
                onChange={setSelectedColors}
                placeholder="All Available Colors"
                searchPlaceholder="Type color name (e.g. White, Grey, Gold, Walnut)..."
              />
              {selectedColors.length > 0 && !selectedColors.includes('All') && (
                <p className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">
                  Categories &amp; products filtered to color: {selectedColors.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 3. CASCADING CATEGORY HIERARCHY & PRODUCT FILTER */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <MdFilterAlt className="text-primary" size={16} />
              <span>Cascading Category Hierarchy &amp; Product Filter</span>
            </label>
            <span className="text-[11px] text-gray-400">
              Navigate with &uarr;&darr; arrow keys &amp; Enter to toggle • Searchable with live tick boxes
            </span>
          </div>

          {/* 3 Cascading Category Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Box 1: Parent Category */}
            <FacetCheckboxList
              title="1. Parent Category"
              items={parentCategoryFacetItems}
              selectedIds={selectedParentCategories}
              onSelectionChange={(newSelected) => {
                setSelectedParentCategories(newSelected);
                setSelectedSubCategories([]);
                setSelectedLeafCategories([]);
                setSelectedProducts([]);
              }}
              placeholder="Search parent category..."
              heightClass="h-44"
            />

            {/* Box 2: Sub-Category (Active only after Parent Category is selected) */}
            <FacetCheckboxList
              title="2. Sub-Category"
              items={subCategoryFacetItems}
              selectedIds={selectedSubCategories}
              onSelectionChange={(newSelected) => {
                setSelectedSubCategories(newSelected);
                setSelectedLeafCategories([]);
                setSelectedProducts([]);
              }}
              placeholder="Search sub-category..."
              disabled={selectedParentCategories.length === 0}
              disabledMessage="Select Parent Category first"
              heightClass="h-44"
            />

            {/* Box 3: Leaf Category (Active only after Sub-Category is selected) */}
            <FacetCheckboxList
              title="3. Leaf Category"
              items={leafCategoryFacetItems}
              selectedIds={selectedLeafCategories}
              onSelectionChange={(newSelected) => {
                setSelectedLeafCategories(newSelected);
                setSelectedProducts([]);
              }}
              placeholder="Search leaf category..."
              disabled={selectedSubCategories.length === 0}
              disabledMessage="Select Sub-Category first"
              heightClass="h-44"
            />
          </div>

          {/* Box 4: Specific Product Filter */}
          <div className="pt-2">
            <FacetCheckboxList
              title="4. Specific Product Filter"
              items={productFacetItems}
              selectedIds={selectedProducts}
              onSelectionChange={setSelectedProducts}
              placeholder="Search products by title, SKU, or price..."
              heightClass="h-56"
            />
          </div>
        </div>

        {/* 4. CUSTOMER, DATE & SORTING ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-stroke dark:border-strokedark">
          
          {/* Customer Selector (Multi-Select) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <MdPerson className="text-emerald-500" size={16} />
                <span>Customer</span>
              </label>
              {isInvoiceSelected && (
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded-sm">
                  Locked to Invoice
                </span>
              )}
            </div>

            <SearchableSelect
              multiple={true}
              disabled={isInvoiceSelected}
              options={customerOptions}
              value={selectedCustomers}
              onChange={setSelectedCustomers}
              placeholder="All Customers"
              searchPlaceholder="Type customer name or code..."
            />
          </div>

          {/* Date Selector (Single vs Multi - STRICTLY LOCKED WHEN INVOICE SELECTED) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <MdCalendarToday className="text-primary" size={15} />
                <span>Date Filter</span>
              </label>

              {/* Pills: Single vs Multi (Disabled and locked when Invoice picked) */}
              <div
                className={`inline-flex items-center p-0.5 rounded-lg border border-stroke dark:border-strokedark ${
                  isInvoiceSelected
                    ? 'bg-gray-100/60 dark:bg-meta-4/20 opacity-60 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-meta-4'
                }`}
              >
                <button
                  type="button"
                  disabled={isInvoiceSelected}
                  onClick={() => !isInvoiceSelected && setDateMode('single')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
                    dateMode === 'single'
                      ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                      : isInvoiceSelected
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:text-black dark:hover:text-white cursor-pointer'
                  }`}
                >
                  Single Date
                </button>
                <button
                  type="button"
                  disabled={isInvoiceSelected}
                  onClick={() => !isInvoiceSelected && setDateMode('multi')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
                    dateMode === 'multi'
                      ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                      : isInvoiceSelected
                      ? 'text-gray-400 cursor-not-allowed opacity-50'
                      : 'text-gray-500 hover:text-black dark:hover:text-white cursor-pointer'
                  }`}
                  title={isInvoiceSelected ? 'Date Range is locked when Target Invoice is selected' : ''}
                >
                  Date Range
                </button>
              </div>
            </div>

            {dateMode === 'single' ? (
              <div className="space-y-1">
                <input
                  type="date"
                  disabled={isInvoiceSelected}
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium outline-hidden ${
                    isInvoiceSelected
                      ? 'bg-gray-100 dark:bg-meta-4/40 text-gray-500 border-stroke cursor-not-allowed'
                      : 'bg-white dark:bg-boxdark text-black dark:text-white border-stroke dark:border-strokedark focus:border-primary'
                  }`}
                />
                {isInvoiceSelected && (
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                    <MdLock size={12} />
                    <span>Auto-locked to invoice date</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white text-xs font-medium focus:border-primary outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white text-xs font-medium focus:border-primary outline-hidden"
                    />
                  </div>
                </div>

                {/* Quick Date Range Shortcuts */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    { label: 'Today', key: 'today' },
                    { label: 'Yesterday', key: 'yesterday' },
                    { label: 'This Week', key: 'this_week' },
                    { label: 'This Month', key: 'this_month' },
                    { label: 'Last Month', key: 'last_month' }
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => applyDateShortcut(s.key as any)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-meta-4/80 transition cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort By Dropdown (Includes Customer A-Z and Z-A) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
              <span>Sort Order</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white text-xs font-medium focus:border-primary outline-hidden cursor-pointer"
            >
              <option value="date_desc">Date (Newest First)</option>
              <option value="date_asc">Date (Oldest First)</option>
              <option value="invoice_desc">Invoice No. (Highest First)</option>
              <option value="invoice_asc">Invoice No. (Lowest First)</option>
              <option value="customer_asc">Customer (A to Z)</option>
              <option value="customer_desc">Customer (Z to A)</option>
            </select>
            <p className="text-[10px] text-gray-400">
              Controls row hierarchy &amp; transaction ordering in print layout
            </p>
          </div>
        </div>

        {/* ── BOTTOM ACTIONS ── */}
        <div className="flex items-center justify-between pt-4 border-t border-stroke dark:border-strokedark">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Selected criteria ready. Output renders with Modern and Classic layouts.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 rounded-xl border border-stroke dark:border-strokedark text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 transition shadow-xs cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleGenerateReport}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black tracking-wide shadow-md flex items-center gap-2 transition cursor-pointer active:scale-98"
            >
              <MdPrint size={17} />
              <span>Generate &amp; View Report</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BasicSalesReport;
