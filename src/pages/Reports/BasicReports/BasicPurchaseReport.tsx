import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { useAuth } from '../../../Context/Auth';
import Spinner from '../../../ui/Spinner';
import { toast } from 'react-hot-toast';
import {
  MdArrowBack,
  MdReceipt,
  MdStore,
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
  MdShoppingBag,
  MdWarehouse
} from 'react-icons/md';
import { extractProductColor, DEFAULT_PRODUCT_COLORS, getSwatchColor } from '../../../utils/colorService';
import SearchableSelect, { SearchableOption } from '../../../components/SearchableSelect';
import { fetchSystemMasterConfig } from '../../../utils/systemPermissions';

export type BasicPurchaseReportType = 'bill' | 'vendor' | 'brand' | 'color' | 'product' | 'location';

export interface BasicPurchaseFilterCriteria {
  reportType: BasicPurchaseReportType;
  purchaseIds?: string[];
  purchaseId?: string;
  purchaseNo?: string;
  vendors?: string[];
  vendor?: string;
  brands?: string[];
  brand?: string;
  colors?: string[];
  color?: string;
  warehouses?: string[];
  warehouse?: string;
  parentCategories?: string[];
  subCategories?: string[];
  categories?: string[];
  products?: string[];
  dateMode: 'single' | 'multi';
  singleDate?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: 'date_desc' | 'date_asc' | 'bill_desc' | 'bill_asc' | 'vendor_asc' | 'vendor_desc';
}

const STORAGE_CRITERIA_KEY = 'zac_basic_purchase_report_criteria_v2';
const META_CACHE_KEY = 'zac_basic_purchase_meta_v2';

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

  // Keep highlighted index in bounds
  useEffect(() => {
    if (highlightedIndex >= filteredItems.length) {
      setHighlightedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, highlightedIndex]);

  // Scroll highlighted item into view automatically
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`) as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Active selected count
  const activeSelectedCount = useMemo(() => {
    const presentIds = new Set(items.map((i) => i.id));
    return selectedIds.filter((id) => presentIds.has(id)).length;
  }, [items, selectedIds]);

  const allSelected = items.length > 0 && activeSelectedCount === items.length;

  const handleToggle = (id: string, index: number, shiftKey: boolean) => {
    if (disabled) return;

    if (shiftKey && lastClickedIndexRef.current !== null) {
      const start = Math.min(lastClickedIndexRef.current, index);
      const end = Math.max(lastClickedIndexRef.current, index);
      const rangeSlice = filteredItems.slice(start, end + 1).map((x) => x.id);
      const union = Array.from(new Set([...selectedIds, ...rangeSlice]));
      onSelectionChange(union);
    } else {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((x) => x !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
      lastClickedIndexRef.current = index;
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    if (searchQuery.trim()) {
      const visibleIds = filteredItems.map((x) => x.id);
      const combined = Array.from(new Set([...selectedIds, ...visibleIds]));
      onSelectionChange(combined);
    } else {
      onSelectionChange(items.map((x) => x.id));
    }
  };

  const handleClear = () => {
    if (disabled) return;
    if (searchQuery.trim()) {
      const visibleSet = new Set(filteredItems.map((x) => x.id));
      onSelectionChange(selectedIds.filter((id) => !visibleSet.has(id)));
    } else {
      onSelectionChange([]);
    }
  };

  // Keyboard Navigation: Up/Down arrow keys + Enter/Space to select
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const targetItem = filteredItems[highlightedIndex];
      if (targetItem) {
        handleToggle(targetItem.id, highlightedIndex, e.shiftKey);
      }
    }
  };

  return (
    <div
      className={`border rounded-xl flex flex-col transition-all bg-white dark:bg-boxdark ${
        disabled
          ? 'border-gray-200 dark:border-strokedark/50 opacity-60 bg-gray-50/50 dark:bg-meta-4/20'
          : 'border-stroke dark:border-strokedark shadow-2xs focus-within:ring-2 focus-within:ring-primary/20'
      }`}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-stroke dark:border-strokedark bg-gray-50/70 dark:bg-meta-4/40 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
            {title}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              activeSelectedCount > 0
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-meta-4 text-gray-700 dark:text-gray-300'
            }`}
          >
            {activeSelectedCount > 0 ? `${activeSelectedCount}/${items.length}` : `All (${items.length})`}
          </span>
        </div>

        {!disabled && items.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={allSelected}
              className="text-primary hover:underline font-semibold disabled:opacity-40 disabled:hover:no-underline cursor-pointer"
            >
              Select All
            </button>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <button
              type="button"
              onClick={handleClear}
              disabled={activeSelectedCount === 0}
              className="text-gray-500 hover:text-danger hover:underline font-semibold disabled:opacity-40 disabled:hover:no-underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Live search input */}
      {!disabled && (
        <div className="p-2 border-b border-stroke/60 dark:border-strokedark/60">
          <div className="relative">
            <MdSearch
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={15}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={placeholder}
              className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-stroke dark:border-strokedark bg-transparent text-black dark:text-white focus:outline-none focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
              >
                <MdClose size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Item list */}
      <div ref={listRef} className={`overflow-y-auto p-1.5 space-y-0.5 ${heightClass}`}>
        {disabled ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400">
            <MdLock size={20} className="mb-1 opacity-50" />
            <span className="text-xs">{disabledMessage}</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4 text-xs text-gray-400">
            {searchQuery ? 'No matches found' : 'No items available'}
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isChecked = selectedIds.includes(item.id);
            const isHighlighted = idx === highlightedIndex;
            return (
              <label
                key={`${title}-${item.id}`}
                data-index={idx}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={(e) => {
                  e.preventDefault();
                  handleToggle(item.id, idx, e.shiftKey);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
                  isChecked
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white font-medium'
                    : isHighlighted
                    ? 'bg-gray-100 dark:bg-meta-4/60 text-black dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-meta-4/30'
                } ${isHighlighted ? 'ring-1 ring-primary/40' : ''}`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    tabIndex={-1}
                    className="rounded text-primary focus:ring-0 cursor-pointer pointer-events-none"
                  />
                  <div className="truncate">
                    <span className="truncate block">{item.label}</span>
                    {item.subLabel && (
                      <span className="text-[10px] text-gray-400 block truncate leading-tight">
                        {item.subLabel}
                      </span>
                    )}
                  </div>
                </div>
                {item.meta && (
                  <span className="text-[10px] font-mono text-gray-400 shrink-0 ml-1">
                    {item.meta}
                  </span>
                )}
              </label>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      {!disabled && items.length > 0 && (
        <div className="px-3 py-1 bg-gray-50/50 dark:bg-meta-4/20 border-t border-stroke/50 dark:border-strokedark/50 text-[10px] text-gray-400 flex items-center justify-between">
          <span>Click/Enter • ↑↓ Navigate • Shift+Click</span>
          <span>{filteredItems.length} shown</span>
        </div>
      )}
    </div>
  );
};

// ── MAIN BASIC PURCHASE REPORT FILTER PAGE COMPONENT ──
export const BasicPurchaseReport: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useAuth();

  // Business Name from System Master
  const [businessName, setBusinessName] = useState<string>('Jawaid Jakwani & Sons');

  // Read cached metadata synchronously
  const cachedMeta = useMemo(() => {
    try {
      const raw = localStorage.getItem(META_CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, []);

  const [loading, setLoading] = useState<boolean>(!cachedMeta);

  // Master Data Pools
  const [purchasesMaster, setPurchasesMaster] = useState<any[]>(cachedMeta?.purchases || []);
  const [productsMaster, setProductsMaster] = useState<any[]>(cachedMeta?.productsMaster || []);
  const [vendorsMaster, setVendorsMaster] = useState<any[]>(cachedMeta?.vendors || []);
  const [categoriesMaster, setCategoriesMaster] = useState<any[]>(cachedMeta?.categories || []);

  // Filter States
  const [reportType, setReportType] = useState<BasicPurchaseReportType>('bill');
  const [selectedPurchaseBills, setSelectedPurchaseBills] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [dbLocations, setDbLocations] = useState<string[]>([]);

  // 4-Tier Cascading Category & Product Filter
  const [selectedParentCategories, setSelectedParentCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedLeafCategories, setSelectedLeafCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Date Filtering
  const [dateMode, setDateMode] = useState<'single' | 'multi'>('multi');
  const [singleDate, setSingleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split('T')[0]);

  // Sorting
  const [sortBy, setSortBy] = useState<BasicPurchaseFilterCriteria['sortBy']>('date_desc');

  // Target purchase lock flag
  const isPurchaseSelected = selectedPurchaseBills.length > 0;

  // Initialize System Master and Master Data
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      try {
        const sysCfg = await fetchSystemMasterConfig();
        if (sysCfg?.business_name && isMounted) {
          setBusinessName(sysCfg.business_name);
        }

        const [p1, p2, pr1, pr2, catRes, venRes, locRes] = await Promise.all([
          supabase.from('supplier_purchases').select('id, purchase_no, bill_no, supplier_name, vendor_name, target_warehouse, purchase_date, payment_term, total_amount, items, created_at').order('id', { ascending: false }).range(0, 999),
          supabase.from('supplier_purchases').select('id, purchase_no, bill_no, supplier_name, vendor_name, target_warehouse, purchase_date, payment_term, total_amount, items, created_at').order('id', { ascending: false }).range(1000, 2999),
          supabase.from('products').select('id, product_name, category, sub_category, sub_sub_category, brand, purchase_price, retail_price, uom, item_sr_no').order('id', { ascending: true }).range(0, 999),
          supabase.from('products').select('id, product_name, category, sub_category, sub_sub_category, brand, purchase_price, retail_price, uom, item_sr_no').order('id', { ascending: true }).range(1000, 2999),
          supabase.from('inventory_categories').select('id, name, parent_id').order('name'),
          supabase.from('vendors').select('id, name, vendor_name, vendor_code, vendorCode').order('name'),
          supabase.from('inventory_locations').select('name')
        ]);

        if (!isMounted) return;

        if (locRes?.data && Array.isArray(locRes.data)) {
          const names = locRes.data.map((l: any) => String(l.name || '').trim()).filter(Boolean);
          if (names.length > 0) setDbLocations(names);
        }

        const combinedPurchases = [...(p1.data || []), ...(p2.data || [])];
        const combinedProducts = [...(pr1.data || []), ...(pr2.data || [])];
        const loadedCats = catRes.data || [];
        const loadedVendors = venRes.data || [];

        setPurchasesMaster(combinedPurchases);
        setProductsMaster(combinedProducts);
        setCategoriesMaster(loadedCats);
        setVendorsMaster(loadedVendors);

        try {
          const payload = {
            purchases: combinedPurchases,
            productsMaster: combinedProducts,
            categories: loadedCats,
            vendors: loadedVendors,
            cachedAt: Date.now()
          };
          localStorage.setItem(META_CACHE_KEY, JSON.stringify(payload));
        } catch {}
      } catch (err) {
        console.error('Failed to load purchase report metadata:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Restore criteria from previous session if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CRITERIA_KEY);
      if (saved) {
        const c: BasicPurchaseFilterCriteria = JSON.parse(saved);
        if (c.reportType) setReportType(c.reportType);
        if (c.purchaseIds) setSelectedPurchaseBills(c.purchaseIds);
        else if (c.purchaseId) setSelectedPurchaseBills([c.purchaseId]);
        if (c.vendors) setSelectedVendors(c.vendors);
        else if (c.vendor) setSelectedVendors([c.vendor]);
        if (c.brands) setSelectedBrands(c.brands);
        else if (c.brand) setSelectedBrands([c.brand]);
        if (c.colors) setSelectedColors(c.colors);
        else if (c.color) setSelectedColors([c.color]);
        if (c.warehouses) setSelectedWarehouses(c.warehouses);
        else if (c.warehouse) setSelectedWarehouses([c.warehouse]);
        if (c.parentCategories) setSelectedParentCategories(c.parentCategories);
        if (c.subCategories) setSelectedSubCategories(c.subCategories);
        if (c.categories) setSelectedLeafCategories(c.categories);
        if (c.products) setSelectedProducts(c.products);
        if (c.dateMode) setDateMode(c.dateMode);
        if (c.singleDate) setSingleDate(c.singleDate);
        if (c.dateFrom) setDateFrom(c.dateFrom);
        if (c.dateTo) setDateTo(c.dateTo);
        if (c.sortBy) setSortBy(c.sortBy);
      }
    } catch {}
  }, []);

  // Auto-lock Vendor and Date when purchase bills are selected
  useEffect(() => {
    if (selectedPurchaseBills.length > 0) {
      const firstPicked = purchasesMaster.find((p) =>
        selectedPurchaseBills.includes(String(p.id)) ||
        selectedPurchaseBills.includes(p.purchase_no) ||
        selectedPurchaseBills.includes(p.bill_no)
      );
      if (firstPicked) {
        const vName = firstPicked.vendor_name || firstPicked.supplier_name;
        if (vName) {
          setSelectedVendors([vName]);
        }
        const rawDate = firstPicked.purchase_date || firstPicked.created_at;
        if (rawDate) {
          const dateOnly = String(rawDate).split('T')[0];
          setDateMode('single');
          setSingleDate(dateOnly);
        }
      }
    }
  }, [selectedPurchaseBills, purchasesMaster]);

  // Distinct Brands from products
  const availableBrands = useMemo(() => {
    const bSet = new Set<string>();
    productsMaster.forEach((p) => {
      if (p.brand && String(p.brand).trim()) {
        bSet.add(String(p.brand).trim());
      }
    });
    return Array.from(bSet).sort((a, b) => a.localeCompare(b));
  }, [productsMaster]);

  // Distinct Warehouses from purchases
  const availableWarehouses = useMemo(() => {
    const wSet = new Set<string>();
    purchasesMaster.forEach((p) => {
      const w = p.target_warehouse || p.warehouse;
      if (w && String(w).trim()) {
        wSet.add(String(w).trim());
      }
    });
    return Array.from(wSet).sort((a, b) => a.localeCompare(b));
  }, [purchasesMaster]);

  // Distinct Colors from products
  const availableColors = useMemo(() => {
    const cSet = new Set<string>();
    productsMaster.forEach((p) => {
      const c = extractProductColor(p);
      if (c && c !== 'General') cSet.add(c);
    });
    DEFAULT_PRODUCT_COLORS.forEach((c) => cSet.add(c));
    return Array.from(cSet).sort((a, b) => a.localeCompare(b));
  }, [productsMaster]);

  // Base Products Pool dynamically filtered by selected Brands, Colors, and Target Bills (Strictly Scoped by Mode)
  const baseFilteredProductsPool = useMemo(() => {
    let pool = productsMaster;

    // A. Target Bill constraint (only active in bill mode)
    if (reportType === 'bill' && selectedPurchaseBills.length > 0) {
      const pickedBills = purchasesMaster.filter(
        (p) => selectedPurchaseBills.includes(String(p.id)) || selectedPurchaseBills.includes(p.purchase_no)
      );
      const billItemNames = new Set<string>();
      pickedBills.forEach((p) => {
        let items: any[] = [];
        if (Array.isArray(p.items)) items = p.items;
        else if (typeof p.items === 'string') {
          try {
            items = JSON.parse(p.items);
          } catch {}
        }
        items.forEach((it) => {
          const name = it.product_name || it.itemName || it.name;
          if (name) billItemNames.add(String(name).toLowerCase().trim());
        });
      });

      if (billItemNames.size > 0) {
        pool = pool.filter((p) => p.product_name && billItemNames.has(String(p.product_name).toLowerCase().trim()));
      }
    }

    // B. Vendor constraint (strictly active in vendor mode)
    if (reportType === 'vendor' && selectedVendors.length > 0) {
      const vSet = new Set(selectedVendors.map((v) => v.toLowerCase().trim()));
      const vendorBills = purchasesMaster.filter((p) => {
        const vName = String(p.supplier_name || p.vendor_name || '').toLowerCase().trim();
        return vSet.has(vName);
      });
      const vendorItemNames = new Set<string>();
      vendorBills.forEach((p) => {
        let items: any[] = [];
        if (Array.isArray(p.items)) items = p.items;
        else if (typeof p.items === 'string') {
          try {
            items = JSON.parse(p.items);
          } catch {}
        }
        items.forEach((it) => {
          const name = it.product_name || it.itemName || it.name;
          if (name) vendorItemNames.add(String(name).toLowerCase().trim());
        });
      });
      if (vendorItemNames.size > 0) {
        pool = pool.filter((p) => p.product_name && vendorItemNames.has(String(p.product_name).toLowerCase().trim()));
      }
    }

    // C. Brand constraint (strictly active in brand mode)
    if (reportType === 'brand' && selectedBrands.length > 0) {
      const bSet = new Set(selectedBrands.map((b) => b.toLowerCase().trim()));
      pool = pool.filter((p) => p.brand && bSet.has(String(p.brand).toLowerCase().trim()));
    }

    // D. Color constraint (strictly active in color mode)
    if (reportType === 'color' && selectedColors.length > 0) {
      const cSet = new Set(selectedColors.map((c) => c.toLowerCase().trim()));
      pool = pool.filter((p) => {
        const col = (extractProductColor(p) || '').toLowerCase().trim();
        const pDesc = (p.product_description || p.product_name || '').toLowerCase();
        return Array.from(cSet).some((c) => col.includes(c) || pDesc.includes(c));
      });
    }

    return pool;
  }, [productsMaster, reportType, selectedBrands, selectedColors, selectedVendors, selectedPurchaseBills, purchasesMaster]);

  // 1. Parent Categories
  const parentCategoryItems = useMemo<FacetItem[]>(() => {
    const parentSet = new Set<string>();
    baseFilteredProductsPool.forEach((p) => {
      const pCat = p.parent_category || p.sub_sub_category;
      if (pCat && String(pCat).trim()) {
        parentSet.add(String(pCat).trim());
      }
    });
    if (parentSet.size === 0) {
      categoriesMaster.filter((c) => !c.parent_id).forEach((c) => parentSet.add(c.name));
    }
    return Array.from(parentSet)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: name, label: name }));
  }, [baseFilteredProductsPool, categoriesMaster]);

  // 2. Sub-Categories (cascaded)
  const subCategoryItems = useMemo<FacetItem[]>(() => {
    if (selectedParentCategories.length === 0) return [];
    const parentNormalized = new Set(selectedParentCategories.map((x) => x.toLowerCase().trim()));
    const subSet = new Set<string>();

    baseFilteredProductsPool.forEach((p) => {
      const pCat = String(p.parent_category || p.sub_sub_category || '').toLowerCase().trim();
      if (parentNormalized.has(pCat)) {
        const sCat = p.sub_category;
        if (sCat && String(sCat).trim()) {
          subSet.add(String(sCat).trim());
        }
      }
    });

    return Array.from(subSet)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: name, label: name }));
  }, [baseFilteredProductsPool, selectedParentCategories]);

  // 3. Leaf Categories (cascaded)
  const leafCategoryItems = useMemo<FacetItem[]>(() => {
    if (selectedSubCategories.length === 0) return [];
    const subNormalized = new Set(selectedSubCategories.map((x) => x.toLowerCase().trim()));
    const leafSet = new Set<string>();

    baseFilteredProductsPool.forEach((p) => {
      const sCat = String(p.sub_category || '').toLowerCase().trim();
      if (subNormalized.has(sCat)) {
        const lCat = p.category;
        if (lCat && String(lCat).trim()) {
          leafSet.add(String(lCat).trim());
        }
      }
    });

    return Array.from(leafSet)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: name, label: name }));
  }, [baseFilteredProductsPool, selectedSubCategories]);

  // 4. Products Filter (deduplicated by lowercase name)
  const productFacetItems = useMemo<FacetItem[]>(() => {
    let pool = baseFilteredProductsPool;

    if (selectedParentCategories.length > 0) {
      const pSet = new Set(selectedParentCategories.map((x) => x.toLowerCase().trim()));
      pool = pool.filter((p) => {
        const pCat = String(p.parent_category || p.sub_sub_category || '').toLowerCase().trim();
        return pSet.has(pCat);
      });
    }

    if (selectedSubCategories.length > 0) {
      const sSet = new Set(selectedSubCategories.map((x) => x.toLowerCase().trim()));
      pool = pool.filter((p) => {
        const sCat = String(p.sub_category || '').toLowerCase().trim();
        return sSet.has(sCat);
      });
    }

    if (selectedLeafCategories.length > 0) {
      const lSet = new Set(selectedLeafCategories.map((x) => x.toLowerCase().trim()));
      pool = pool.filter((p) => {
        const lCat = String(p.category || '').toLowerCase().trim();
        return lSet.has(lCat);
      });
    }

    const seenNames = new Set<string>();
    const deduplicated: FacetItem[] = [];

    pool.forEach((p) => {
      const name = p.product_name ? String(p.product_name).trim() : '';
      if (!name) return;
      const lower = name.toLowerCase();
      if (seenNames.has(lower)) return;
      seenNames.add(lower);

      const price = p.purchase_price || p.retail_price;
      const meta = price ? `Rs. ${Number(price).toLocaleString()}` : p.item_sr_no ? `Code: ${p.item_sr_no}` : undefined;
      deduplicated.push({
        id: name,
        label: name,
        subLabel: p.brand ? `Brand: ${p.brand}` : p.category ? `Category: ${p.category}` : undefined,
        meta
      });
    });

    return deduplicated.sort((a, b) => a.label.localeCompare(b.label));
  }, [baseFilteredProductsPool, selectedParentCategories, selectedSubCategories, selectedLeafCategories]);

  // Auto-prune stale selected products when category filters change
  useEffect(() => {
    if (selectedProducts.length > 0 && productFacetItems.length > 0) {
      const validNames = new Set(productFacetItems.map((p) => p.id));
      const pruned = selectedProducts.filter((name) => validNames.has(name));
      if (pruned.length !== selectedProducts.length) {
        setSelectedProducts(pruned);
      }
    }
  }, [productFacetItems, selectedProducts]);

  // Searchable Options for Secondary Dropdowns
  const targetPurchaseOptions = useMemo<SearchableOption[]>(() => {
    return purchasesMaster.map((p) => {
      const pNo = p.bill_no
        ? `Bill #${p.bill_no}`
        : p.purchase_no
        ? (String(p.purchase_no).toUpperCase().startsWith('PUR-') ? p.purchase_no : `PUR-${p.purchase_no}`)
        : `PUR-${p.id}`;
      const vName = p.vendor_name || p.supplier_name || 'Vendor';
      const amt = Number(p.total_amount || 0).toLocaleString();
      const date = p.purchase_date || String(p.created_at || '').split('T')[0];
      return {
        value: String(p.id),
        label: `${pNo} — ${vName} (${date}) • Rs. ${amt}`
      };
    });
  }, [purchasesMaster]);

  const vendorOptions = useMemo<SearchableOption[]>(() => {
    return vendorsMaster.map((v) => ({
      value: v.vendor_name || v.name,
      label: `${v.vendor_name || v.name}${v.vendor_code || v.vendorCode ? ` (${v.vendor_code || v.vendorCode})` : ''}`
    }));
  }, [vendorsMaster]);

  const brandOptions = useMemo<SearchableOption[]>(() => {
    return availableBrands.map((b) => ({ value: b, label: b }));
  }, [availableBrands]);

  const warehouseOptions = useMemo<SearchableOption[]>(() => {
    const s = new Set<string>(availableWarehouses);
    dbLocations.forEach((l) => s.add(l));
    if (s.size === 0) {
      s.add('A-39');
      s.add('SHOP');
    }
    return Array.from(s).sort().map((w) => ({ value: w, label: w }));
  }, [availableWarehouses, dbLocations]);

  const colorOptions = useMemo<SearchableOption[]>(() => {
    return availableColors.map((c) => ({
      value: c,
      label: c,
      icon: (
        <span
          className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 inline-block shrink-0"
          style={{ backgroundColor: getSwatchColor(c) }}
        />
      )
    }));
  }, [availableColors]);

  // Handle Report Type Change (Switches mode and resets mode-specific selections)
  const handleReportTypeChange = (newType: BasicPurchaseReportType) => {
    setReportType(newType);
    setSelectedPurchaseBills([]);
    setSelectedVendors([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedParentCategories([]);
    setSelectedSubCategories([]);
    setSelectedLeafCategories([]);
    setSelectedProducts([]);
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setReportType('bill');
    setSelectedPurchaseBills([]);
    setSelectedVendors([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedWarehouses([]);
    setSelectedParentCategories([]);
    setSelectedSubCategories([]);
    setSelectedLeafCategories([]);
    setSelectedProducts([]);
    setDateMode('multi');
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setDateFrom(d.toISOString().split('T')[0]);
    setDateTo(new Date().toISOString().split('T')[0]);
    setSingleDate(new Date().toISOString().split('T')[0]);
    setSortBy('date_desc');
    try {
      localStorage.removeItem(STORAGE_CRITERIA_KEY);
    } catch {}
    toast.success('Purchase filters reset to defaults');
  };

  // Generate Report Handler
  const handleGenerateReport = () => {
    const criteria: BasicPurchaseFilterCriteria = {
      reportType,
      purchaseIds: selectedPurchaseBills.length > 0 ? selectedPurchaseBills : undefined,
      purchaseId: selectedPurchaseBills[0] || undefined,
      vendors: selectedVendors.length > 0 ? selectedVendors : undefined,
      vendor: selectedVendors[0] || undefined,
      brands: selectedBrands.length > 0 ? selectedBrands : undefined,
      brand: selectedBrands[0] || undefined,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      color: selectedColors[0] || undefined,
      warehouses: selectedWarehouses.length > 0 ? selectedWarehouses : undefined,
      warehouse: selectedWarehouses[0] || undefined,
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
      localStorage.setItem(STORAGE_CRITERIA_KEY, JSON.stringify(criteria));
    } catch {}

    const dest = `${tenantId ? `/${tenantId}` : ''}/basic-purchase-report/print`;
    navigate(dest, { state: { criteria } });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading Basic Purchase Report metadata...
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
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Core Department Report
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {businessName || 'Zohaib Ali & Co.'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              <span>Basic Purchase Report</span>
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

      {/* ── PURCHASE REPORTS TAB ── */}
      <div className="bg-white dark:bg-boxdark p-1.5 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs overflow-x-auto print:hidden">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap bg-primary text-white shadow-sm"
          >
            <MdShoppingBag size={16} />
            <span>Basic Purchase Report</span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-white/20 text-white ml-0.5">
              BASIC
            </span>
          </button>
        </div>
      </div>

      {/* ── MAIN FILTER CARD CONTAINER ── */}
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-xs p-5 md:p-6 space-y-6">
        {/* 1. PRIMARY REPORT TYPE SELECTION */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <MdFilterAlt className="text-primary" size={16} />
            <span>Select Report Type *</span>
          </label>
          <div className="relative">
            <select
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value as BasicPurchaseReportType)}
              className="w-full appearance-none rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/30 py-3.5 px-4 text-sm font-bold text-black dark:text-white transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="bill">Purchase Bill wise Report (Audit bills & inward items)</option>
              <option value="vendor">Vendor / Supplier wise Report (Audit procurement by supplier)</option>
              <option value="product">Product wise Report (Items & SKU procurement turnover)</option>
              <option value="brand">Brand wise Report (Factory & manufacturer procurement)</option>
              <option value="color">Color Wise Purchases (Tile & surface shade analytics)</option>
              <option value="location">Location Wise Purchases (Procurement by location)</option>
            </select>
          </div>
          <p className="text-[11px] text-gray-400">
            {reportType === 'bill' && 'Direct transaction ledger. Auto-locks vendor and date when target purchase bill is picked.'}
            {reportType === 'vendor' && 'Breaks down procurement spend & inward volumes grouped by supplier.'}
            {reportType === 'product' && 'Product purchase register grouped by item, displaying individual line items, rate, quantity, and product totals.'}
            {reportType === 'brand' && 'Aggregates procurement turnover by manufacturer & product brand.'}
            {reportType === 'color' && 'Analyzes shade procurement, tile finishes, and inward color volumes.'}
            {reportType === 'location' && 'Breaks down procurement spend grouped by receiving store or warehouse location.'}
          </p>
        </div>

        {/* 2. MODE-SPECIFIC MULTI-SELECT DROPDOWNS */}
        <div className="space-y-4">
          {/* Target Purchase Bill */}
          {reportType === 'bill' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <MdReceipt className="text-blue-500" size={16} />
                <span>Select Target Purchase Bill (Optional — pick specific to auto-fill & lock criteria):</span>
              </label>
              <SearchableSelect
                multiple={true}
                options={targetPurchaseOptions}
                value={selectedPurchaseBills}
                onChange={(val) => {
                  if (Array.isArray(val)) setSelectedPurchaseBills(val);
                  else setSelectedPurchaseBills(val ? [val] : []);
                }}
                placeholder={
                  purchasesMaster.length > 0
                    ? `All Purchase Bills (${purchasesMaster.length} Total)`
                    : 'No purchase bills found'
                }
                searchPlaceholder="Search bill #, supplier name, date..."
              />
            </div>
          )}

          {/* Vendor Mode */}
          {reportType === 'vendor' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <MdStore className="text-emerald-500" size={16} />
                <span>Select Vendor / Supplier:</span>
              </label>
              <SearchableSelect
                multiple={true}
                options={vendorOptions}
                value={selectedVendors}
                onChange={(val) => {
                  if (Array.isArray(val)) setSelectedVendors(val);
                  else setSelectedVendors(val ? [val] : []);
                }}
                placeholder="All Vendors"
                searchPlaceholder="Search vendor by name or code..."
              />
              {selectedVendors.length > 0 && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Showing procurement & products supplied by {selectedVendors.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Brand Mode */}
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
                onChange={(val) => {
                  if (Array.isArray(val)) setSelectedBrands(val);
                  else setSelectedBrands(val ? [val] : []);
                }}
                placeholder="All Brands"
                searchPlaceholder="Search brand name..."
              />
              {selectedBrands.length > 0 && (
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  Categories & products filtered to brand: {selectedBrands.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Color Mode */}
          {reportType === 'color' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <MdPalette className="text-pink-500" size={16} />
                <span>Select Color / Surface Shade:</span>
              </label>
              <SearchableSelect
                multiple={true}
                options={colorOptions}
                value={selectedColors}
                onChange={(val) => {
                  if (Array.isArray(val)) setSelectedColors(val);
                  else setSelectedColors(val ? [val] : []);
                }}
                placeholder="All Available Colors"
                searchPlaceholder="Type color name (e.g. White, Grey, Gold)..."
              />
              {selectedColors.length > 0 && (
                <p className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">
                  Categories & products filtered to color: {selectedColors.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Target Location / Warehouse Dropdown */}
          {reportType === 'location' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <MdWarehouse className="text-amber-500" size={16} />
                <span>Select Location / Destination Warehouse:</span>
              </label>
              <SearchableSelect
                multiple={true}
                options={warehouseOptions}
                value={selectedWarehouses}
                onChange={(val) => {
                  if (Array.isArray(val)) setSelectedWarehouses(val);
                  else setSelectedWarehouses(val ? [val] : []);
                }}
                placeholder="All Locations / Warehouses"
                searchPlaceholder="Search location or warehouse..."
              />
              {selectedWarehouses.length > 0 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  Procurement filtered to location: {selectedWarehouses.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 3. CASCADING CATEGORY HIERARCHY & PRODUCT FILTER */}
        <div className="space-y-3 pt-2 border-t border-stroke/60 dark:border-strokedark/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <MdLayers className="text-primary" size={16} />
              <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                Cascading Category Hierarchy & Product Filter
              </span>
            </div>
            <span className="text-[11px] text-gray-400">
              Each box has a live searchbar & tick boxes (with Shift+Click range support)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Box 1: Parent Category */}
            <FacetCheckboxList
              title="1. Parent Category"
              items={parentCategoryItems}
              selectedIds={selectedParentCategories}
              onSelectionChange={setSelectedParentCategories}
              placeholder="Search parent category..."
            />

            {/* Box 2: Sub-Category */}
            <FacetCheckboxList
              title="2. Sub-Category"
              items={subCategoryItems}
              selectedIds={selectedSubCategories}
              onSelectionChange={setSelectedSubCategories}
              placeholder="Search sub-category..."
              disabled={selectedParentCategories.length === 0}
              disabledMessage="Select Parent Category first"
            />

            {/* Box 3: Leaf Category */}
            <FacetCheckboxList
              title="3. Leaf Category"
              items={leafCategoryItems}
              selectedIds={selectedLeafCategories}
              onSelectionChange={setSelectedLeafCategories}
              placeholder="Search leaf category..."
              disabled={selectedSubCategories.length === 0}
              disabledMessage="Select Sub-Category first"
            />
          </div>

          {/* Box 4: Specific Products Filter */}
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

        {/* 4. SECONDARY CRITERIA & DATE FILTER ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 pt-4 border-t border-stroke/60 dark:border-strokedark/60 items-end">
          {/* Vendor / Supplier (Shown when reportType !== 'vendor') */}
          {reportType !== 'vendor' && (
            <div className="lg:col-span-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <MdStore className="text-primary" size={15} />
                  <span>Vendor / Supplier:</span>
                </label>
                {isPurchaseSelected && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                    <MdLock size={11} /> Locked to Bill
                  </span>
                )}
              </div>
              <SearchableSelect
                options={vendorOptions}
                value={selectedVendors}
                onChange={(val) => {
                  if (Array.isArray(val)) setSelectedVendors(val);
                  else setSelectedVendors(val ? [val] : []);
                }}
                disabled={isPurchaseSelected}
                multiple={true}
                placeholder="All Vendors"
                searchPlaceholder="Search vendor by name..."
              />
            </div>
          )}

          {/* Date Filter */}
          <div className={`${reportType !== 'vendor' ? 'lg:col-span-4' : 'lg:col-span-8'} space-y-2`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <MdCalendarToday className="text-primary" size={15} />
                <span>Date Filter</span>
              </label>

              {/* Mode Switcher Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-meta-4/60 p-0.5 rounded-lg">
                <button
                  type="button"
                  disabled={isPurchaseSelected}
                  onClick={() => setDateMode('single')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                    isPurchaseSelected
                      ? 'opacity-60 cursor-not-allowed text-gray-400'
                      : dateMode === 'single'
                      ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                      : 'text-gray-500 hover:text-black dark:hover:text-white cursor-pointer'
                  }`}
                >
                  Single Date
                </button>
                <button
                  type="button"
                  disabled={isPurchaseSelected}
                  onClick={() => setDateMode('multi')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                    isPurchaseSelected
                      ? 'opacity-40 cursor-not-allowed text-gray-400'
                      : dateMode === 'multi'
                      ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                      : 'text-gray-500 hover:text-black dark:hover:text-white cursor-pointer'
                  }`}
                >
                  Date Range
                </button>
              </div>
            </div>

            {/* Inputs */}
            {dateMode === 'single' ? (
              <div className="relative">
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  disabled={isPurchaseSelected}
                  className={`w-full rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 py-2.5 px-3 text-xs font-medium text-black dark:text-white focus:border-primary focus:outline-none ${
                    isPurchaseSelected ? 'bg-gray-100 dark:bg-meta-4/40 cursor-not-allowed opacity-80' : ''
                  }`}
                />
                {isPurchaseSelected && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1 font-semibold">
                    <MdLock size={12} /> Auto-locked to purchase bill date
                  </span>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-gray-400 block mb-0.5">From Date</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 py-2.5 px-3 text-xs font-medium text-black dark:text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block mb-0.5">To Date</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 py-2.5 px-3 text-xs font-medium text-black dark:text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sort Order */}
          <div className={`${reportType !== 'vendor' ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-1.5`}>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as BasicPurchaseFilterCriteria['sortBy'])}
              className="w-full rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 py-2.5 px-3 text-xs font-medium text-black dark:text-white focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="date_desc">Date (Newest First)</option>
              <option value="date_asc">Date (Oldest First)</option>
              <option value="vendor_asc">Vendor (A to Z)</option>
              <option value="vendor_desc">Vendor (Z to A)</option>
              <option value="bill_desc">Bill # (High to Low)</option>
              <option value="bill_asc">Bill # (Low to High)</option>
            </select>
          </div>
        </div>

        {/* 6. BOTTOM ACTION FOOTER */}
        <div className="pt-4 border-t border-stroke dark:border-strokedark flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Selected criteria ready. Output renders with Modern and Classic layouts.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 border border-stroke dark:border-strokedark rounded-xl hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleGenerateReport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary/90 transition shadow-sm cursor-pointer"
            >
              <MdPrint size={16} />
              <span>Generate & View Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicPurchaseReport;
