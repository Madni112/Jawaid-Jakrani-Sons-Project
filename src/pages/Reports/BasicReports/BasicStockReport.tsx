import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { useAuth } from '../../../Context/Auth';
import Spinner from '../../../ui/Spinner';
import { toast } from 'react-hot-toast';
import {
  MdArrowBack,
  MdFilterAlt,
  MdRestartAlt,
  MdPrint,
  MdLock,
  MdClose,
  MdSearch,
  MdLayers,
  MdInventory,
  MdWarehouse,
  MdBrandingWatermark,
  MdPalette,
  MdWarning,
  MdHourglassEmpty,
  MdCalendarToday
} from 'react-icons/md';
import { extractProductColor, DEFAULT_PRODUCT_COLORS, getSwatchColor } from '../../../utils/colorService';
import SearchableSelect, { SearchableOption } from '../../../components/SearchableSelect';
import { fetchSystemMasterConfig } from '../../../utils/systemPermissions';

export type BasicStockReportType = 'balance' | 'warehouse' | 'category' | 'reorder' | 'dead';

export interface BasicStockFilterCriteria {
  reportType: BasicStockReportType;
  productIds?: string[];
  productNames?: string[];
  warehouses?: string[];
  warehouse?: string;
  brands?: string[];
  brand?: string;
  colors?: string[];
  color?: string;
  parentCategories?: string[];
  subCategories?: string[];
  categories?: string[];
  products?: string[];
  hideZeroStock?: boolean;
  dateMode?: 'single' | 'multi';
  singleDate?: string;
  dateFrom?: string;
  dateTo?: string;
  asOfDate?: string;
  sortBy: 'stock_desc' | 'stock_asc' | 'valuation_desc' | 'valuation_asc' | 'name_asc' | 'name_desc' | 'sku_asc' | 'sku_desc';
}

const STORAGE_CRITERIA_KEY = 'zac_basic_stock_report_criteria_v2';
const META_CACHE_KEY = 'zac_basic_stock_meta_v3';

// ── REUSABLE FACET CHECKBOX LIST WITH LIVE SEARCHBAR & KEYBOARD ARROW/ENTER NAVIGATION ──
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
                    <span className="truncate block font-semibold">{item.label}</span>
                    {item.subLabel && (
                      <span className="text-[10px] text-gray-400 block truncate leading-tight">
                        {item.subLabel}
                      </span>
                    )}
                  </div>
                </div>
                {item.meta && (
                  <span className="text-[10px] font-mono text-gray-500 font-bold shrink-0 ml-1">
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

// ── MAIN BASIC STOCK REPORT FILTER PAGE COMPONENT ──
export const BasicStockReport: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useAuth();

  const [businessName, setBusinessName] = useState<string>('Zohaib Ali & Company');

  // Synchronous cache hydration
  const cachedMeta = useMemo(() => {
    try {
      const raw = localStorage.getItem(META_CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, []);

  const [loading, setLoading] = useState<boolean>(!cachedMeta);

  // Master Data Pools
  const [productsMaster, setProductsMaster] = useState<any[]>(cachedMeta?.productsMaster || []);
  const [categoriesMaster, setCategoriesMaster] = useState<any[]>(cachedMeta?.categories || []);
  const [warehousesMaster, setWarehousesMaster] = useState<any[]>(cachedMeta?.warehouses || []);

  // Filter States
  const [reportType, setReportType] = useState<BasicStockReportType>('balance');
  const [selectedProductNames, setSelectedProductNames] = useState<string[]>([]);
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [hideZeroStock, setHideZeroStock] = useState<boolean>(false);

  // 4-Tier Cascading Category & Product Filter
  const [selectedParentCategories, setSelectedParentCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedLeafCategories, setSelectedLeafCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Snapshot As-Of Date & Period Range (Mirroring Sales Report Logic)
  const [dateMode, setDateMode] = useState<'single' | 'multi'>('single');
  const [singleDate, setSingleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split('T')[0]);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Sorting
  const [sortBy, setSortBy] = useState<BasicStockFilterCriteria['sortBy']>('stock_desc');

  // Fetch Master Data
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      try {
        const sysCfg = await fetchSystemMasterConfig();
        if (sysCfg?.business_name && isMounted) {
          setBusinessName(sysCfg.business_name);
        }

        const [p1, p2, catRes, locRes] = await Promise.all([
          supabase.from('products').select('id, product_name, category, sub_category, sub_sub_category, brand, purchase_price, retail_price, uom, item_sr_no, current_stock, pieces_per_box, pcs_per_box, pieces_per_packing, product_description, loose_conversion_ratio, allow_loose_sales, loose_uom').order('id', { ascending: true }).range(0, 999),
          supabase.from('products').select('id, product_name, category, sub_category, sub_sub_category, brand, purchase_price, retail_price, uom, item_sr_no, current_stock, pieces_per_box, pcs_per_box, pieces_per_packing, product_description, loose_conversion_ratio, allow_loose_sales, loose_uom').order('id', { ascending: true }).range(1000, 2999),
          supabase.from('inventory_categories').select('id, name, parent_id').order('name'),
          supabase.from('inventory_locations').select('id, name').order('name')
        ]);

        if (!isMounted) return;

        const combinedProducts = [...(p1.data || []), ...(p2.data || [])];
        const loadedCats = catRes.data || [];
        const loadedLocs = locRes.data || [];

        setProductsMaster(combinedProducts);
        setCategoriesMaster(loadedCats);
        setWarehousesMaster(loadedLocs);

        try {
          const payload = {
            productsMaster: combinedProducts,
            categories: loadedCats,
            warehouses: loadedLocs,
            cachedAt: Date.now()
          };
          localStorage.setItem(META_CACHE_KEY, JSON.stringify(payload));
        } catch {}
      } catch (err) {
        console.error('Failed to load basic stock report metadata:', err);
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
        const c: BasicStockFilterCriteria = JSON.parse(saved);
        if (c.reportType) setReportType(c.reportType);
        if (c.productNames) setSelectedProductNames(c.productNames);
        else if (c.products) setSelectedProductNames(c.products);
        if (c.warehouses) setSelectedWarehouses(c.warehouses);
        else if (c.warehouse) setSelectedWarehouses([c.warehouse]);
        if (c.brands) setSelectedBrands(c.brands);
        else if (c.brand) setSelectedBrands([c.brand]);
        if (c.colors) setSelectedColors(c.colors);
        else if (c.color) setSelectedColors([c.color]);
        if (c.parentCategories) setSelectedParentCategories(c.parentCategories);
        if (c.subCategories) setSelectedSubCategories(c.subCategories);
        if (c.categories) setSelectedLeafCategories(c.categories);
        if (c.products) setSelectedProducts(c.products);
        if (c.hideZeroStock !== undefined) setHideZeroStock(c.hideZeroStock);
        if (c.dateMode) setDateMode(c.dateMode);
        if (c.singleDate) {
          setSingleDate(c.singleDate);
          setAsOfDate(c.singleDate);
        } else if (c.asOfDate) {
          setSingleDate(c.asOfDate);
          setAsOfDate(c.asOfDate);
        }
        if (c.dateFrom) setDateFrom(c.dateFrom);
        if (c.dateTo) setDateTo(c.dateTo);
        if (c.sortBy) setSortBy(c.sortBy);
      }
    } catch {}
  }, []);

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

  // Base Products Pool dynamically filtered by selected Brands and Colors
  const baseFilteredProductsPool = useMemo(() => {
    let pool = productsMaster;

    if (selectedBrands.length > 0) {
      const bSet = new Set(selectedBrands.map((b) => b.toLowerCase().trim()));
      pool = pool.filter((p) => p.brand && bSet.has(String(p.brand).toLowerCase().trim()));
    }

    if (selectedColors.length > 0) {
      const cSet = new Set(selectedColors.map((c) => c.toLowerCase().trim()));
      pool = pool.filter((p) => {
        const col = extractProductColor(p);
        return col && cSet.has(col.toLowerCase().trim());
      });
    }

    return pool;
  }, [productsMaster, selectedBrands, selectedColors]);

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

      const price = p.retail_price || p.purchase_price;
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

  // Dropdown options
  const targetProductOptions = useMemo<SearchableOption[]>(() => {
    const seen = new Set<string>();
    const list: SearchableOption[] = [];
    productsMaster.forEach((p) => {
      const name = p.product_name ? String(p.product_name).trim() : '';
      if (!name || seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      list.push({
        value: name,
        label: `${name}${p.sku ? ` (${p.sku})` : ''} • Price: Rs. ${Number(p.retail_price || p.cost_price || 0).toLocaleString()}`
      });
    });
    return list;
  }, [productsMaster]);

  const warehouseOptions = useMemo<SearchableOption[]>(() => {
    const list: SearchableOption[] = [
      { id: 'All', value: 'All', label: `All Locations (${warehousesMaster.length})`, subLabel: 'Aggregate stock across all storage points' }
    ];
    warehousesMaster.forEach((w) => {
      list.push({
        id: w.name,
        value: w.name,
        label: w.name,
        subLabel: w.location_type ? `${w.location_type} • ${w.address || ''}` : (w.address || 'Storage Location')
      });
    });
    return list;
  }, [warehousesMaster]);

  const brandOptions = useMemo<SearchableOption[]>(() => {
    const list: SearchableOption[] = [
      { id: 'All', value: 'All', label: `All Brands (${availableBrands.length})`, subLabel: 'Include all manufacturers' }
    ];
    availableBrands.forEach((b) => {
      list.push({ id: b, value: b, label: b, subLabel: 'Product Brand' });
    });
    return list;
  }, [availableBrands]);

  const colorOptions = useMemo<SearchableOption[]>(() => {
    const list: SearchableOption[] = [
      { id: 'All', value: 'All', label: `All Colors (${availableColors.length})`, subLabel: 'Include all shades' }
    ];
    availableColors.forEach((c) => {
      list.push({
        id: c,
        value: c,
        label: c,
        subLabel: 'Surface / Tile Shade',
        icon: (
          <span
            className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 inline-block shrink-0"
            style={{ backgroundColor: getSwatchColor(c) }}
          />
        )
      });
    });
    return list;
  }, [availableColors]);

  // Date Range Shortcuts Helper
  const applyDateShortcut = (range: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month') => {
    const now = new Date();
    let from = new Date();
    let to = new Date();

    if (range === 'today') {
      // today
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

  // Reset Filters Handler
  const handleResetFilters = () => {
    setReportType('balance');
    setSelectedProductNames([]);
    setSelectedWarehouses([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedParentCategories([]);
    setSelectedSubCategories([]);
    setSelectedLeafCategories([]);
    setSelectedProducts([]);
    setHideZeroStock(false);
    setDateMode('single');
    const today = new Date().toISOString().split('T')[0];
    setSingleDate(today);
    setAsOfDate(today);
    const past = new Date();
    past.setDate(new Date().getDate() - 30);
    setDateFrom(past.toISOString().split('T')[0]);
    setDateTo(today);
    setSortBy('stock_desc');
    try {
      localStorage.removeItem(STORAGE_CRITERIA_KEY);
    } catch {}
    toast.success('Stock filters reset to defaults');
  };

  // Generate Report Handler
  const handleGenerateReport = () => {
    const criteria: BasicStockFilterCriteria = {
      reportType,
      productNames: selectedProducts.length > 0 ? selectedProducts : undefined,
      warehouses: selectedWarehouses.length > 0 && !selectedWarehouses.includes('All') ? selectedWarehouses : undefined,
      warehouse: selectedWarehouses.length === 1 && selectedWarehouses[0] !== 'All' ? selectedWarehouses[0] : undefined,
      brands: selectedBrands.length > 0 && !selectedBrands.includes('All') ? selectedBrands : undefined,
      brand: selectedBrands.length === 1 && selectedBrands[0] !== 'All' ? selectedBrands[0] : undefined,
      colors: selectedColors.length > 0 && !selectedColors.includes('All') ? selectedColors : undefined,
      color: selectedColors.length === 1 && selectedColors[0] !== 'All' ? selectedColors[0] : undefined,
      parentCategories: selectedParentCategories.length > 0 ? selectedParentCategories : undefined,
      subCategories: selectedSubCategories.length > 0 ? selectedSubCategories : undefined,
      categories: selectedLeafCategories.length > 0 ? selectedLeafCategories : undefined,
      products: selectedProducts.length > 0 ? selectedProducts : undefined,
      hideZeroStock,
      dateMode,
      singleDate: dateMode === 'single' ? singleDate : undefined,
      dateFrom: dateMode === 'multi' ? dateFrom : undefined,
      dateTo: dateMode === 'multi' ? dateTo : undefined,
      asOfDate: dateMode === 'single' ? singleDate : dateTo,
      sortBy
    };

    try {
      localStorage.setItem(STORAGE_CRITERIA_KEY, JSON.stringify(criteria));
    } catch {}

    const dest = `${tenantId ? `/${tenantId}` : ''}/basic-stock-report/print`;
    navigate(dest, { state: { criteria } });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading Basic Stock Report metadata...
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
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Core Department Report
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {businessName || 'Zohaib Ali & Co.'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              <span>Basic Stock Report</span>
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

      {/* ── STOCK REPORTS TABS SWITCHER ── */}
      <div className="bg-white dark:bg-boxdark p-1.5 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs overflow-x-auto print:hidden">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap bg-primary text-white shadow-sm"
          >
            <MdInventory size={16} />
            <span>Basic Stock Report</span>
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
              onChange={(e) => setReportType(e.target.value as BasicStockReportType)}
              className="w-full appearance-none rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/30 py-3.5 px-4 text-sm font-bold text-black dark:text-white transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="balance">Current Stock Balance &amp; Inventory Valuation Report</option>
              <option value="warehouse">Warehouse / Location wise Stock Breakdown</option>
              <option value="category">Category-Wise Stock Volume &amp; SKU Turnover</option>
              <option value="reorder">Low Stock &amp; Reorder Level Alert Register</option>
              <option value="dead">Zero &amp; Out-of-Stock Audit (Negative / Nil Balances)</option>
            </select>
          </div>
        </div>

        {/* 2. CASCADING CATEGORY HIERARCHY & PRODUCT FILTER */}
        <div className="space-y-3 pt-2 border-t border-stroke/60 dark:border-strokedark/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <MdLayers className="text-primary" size={16} />
              <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                Cascading Category Hierarchy &amp; Product Filter
              </span>
            </div>
            <span className="text-[11px] text-gray-400">
              Interactive facet boxes with live search &amp; keyboard navigation (↑↓ and Enter)
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

        {/* 4. LOCATION, DATE & SORTING ROW (MIRRORING SALES REPORT LAYOUT) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-stroke dark:border-strokedark">
          
          {/* Location / Warehouse Selector (Multi-Select) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
              <MdWarehouse className="text-emerald-500" size={16} />
              <span>Target Location / Warehouse</span>
            </label>
            <SearchableSelect
              multiple={true}
              options={warehouseOptions}
              value={selectedWarehouses}
              onChange={(val) => {
                if (Array.isArray(val)) setSelectedWarehouses(val);
                else setSelectedWarehouses(val ? [val] : []);
              }}
              placeholder="All Locations (A-39, SHOP...)"
              searchPlaceholder="Type location name or code..."
            />
          </div>

          {/* Date Selector (Single vs Multi) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                <MdCalendarToday className="text-primary" size={15} />
                <span>Date Filter</span>
              </label>

              {/* Pills: Single vs Multi */}
              <div className="inline-flex items-center p-0.5 rounded-lg border border-stroke dark:border-strokedark bg-gray-100 dark:bg-meta-4">
                <button
                  type="button"
                  onClick={() => setDateMode('single')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
                    dateMode === 'single'
                      ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                      : 'text-gray-500 hover:text-black dark:hover:text-white cursor-pointer'
                  }`}
                >
                  Single Date
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('multi')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
                    dateMode === 'multi'
                      ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                      : 'text-gray-500 hover:text-black dark:hover:text-white cursor-pointer'
                  }`}
                >
                  Date Range
                </button>
              </div>
            </div>

            {dateMode === 'single' ? (
              <input
                type="date"
                value={singleDate}
                onChange={(e) => {
                  setSingleDate(e.target.value);
                  setAsOfDate(e.target.value);
                }}
                className="w-full rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 py-2.5 px-3 text-xs font-medium text-black dark:text-white focus:border-primary focus:outline-none"
              />
            ) : (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-0.5">From Date</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 py-2 px-2.5 text-xs font-medium text-black dark:text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-0.5">To Date</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 py-2 px-2.5 text-xs font-medium text-black dark:text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                {/* Date Shortcuts */}
                <div className="flex flex-wrap items-center gap-1">
                  {(['today', 'yesterday', 'this_week', 'this_month', 'last_month'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => applyDateShortcut(r)}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-meta-4 dark:hover:bg-meta-4/80 text-gray-600 dark:text-gray-300 capitalize cursor-pointer transition"
                    >
                      {r.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-black dark:text-white block">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as BasicStockFilterCriteria['sortBy'])}
              className="w-full rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 py-2.5 px-3 text-xs font-medium text-black dark:text-white focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="stock_desc">Available Stock (Highest First)</option>
              <option value="stock_asc">Available Stock (Lowest First)</option>
              <option value="valuation_desc">Total Valuation (Highest First)</option>
              <option value="valuation_asc">Total Valuation (Lowest First)</option>
              <option value="name_asc">Product Name (A to Z)</option>
              <option value="name_desc">Product Name (Z to A)</option>
              <option value="sku_asc">SKU Code (A to Z)</option>
              <option value="sku_desc">SKU Code (Z to A)</option>
            </select>
          </div>
        </div>

        {/* 5. BRAND, COLOR & ZERO-STOCK ATTRIBUTES ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-stroke/60 dark:border-strokedark/60 items-center">
          {/* Brand */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <MdBrandingWatermark className="text-primary" size={15} />
              <span>Select Brand:</span>
            </label>
            <SearchableSelect
              options={brandOptions}
              value={selectedBrands}
              onChange={(val) => {
                if (Array.isArray(val)) setSelectedBrands(val);
                else setSelectedBrands(val ? [val] : []);
              }}
              multiple={true}
              placeholder="All Brands"
            />
          </div>

          {/* Color Shade */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <MdPalette className="text-primary" size={15} />
              <span>Color / Shade:</span>
            </label>
            <SearchableSelect
              options={colorOptions}
              value={selectedColors}
              onChange={(val) => {
                if (Array.isArray(val)) setSelectedColors(val);
                else setSelectedColors(val ? [val] : []);
              }}
              multiple={true}
              placeholder="All Available Colors"
            />
          </div>

          {/* Zero Stock Toggle */}
          <div className="flex items-center gap-2 pt-2 sm:pt-4">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none p-2 rounded-xl border border-stroke/60 dark:border-strokedark/60 hover:bg-gray-50 dark:hover:bg-meta-4/20 transition w-full">
              <input
                type="checkbox"
                checked={hideZeroStock}
                onChange={(e) => setHideZeroStock(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer"
              />
              <span>Hide Zero-Stock Items</span>
            </label>
          </div>
        </div>

        {/* 6. BOTTOM ACTION FOOTER */}
        <div className="pt-4 border-t border-stroke dark:border-strokedark flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Stock criteria specified. Output renders with Modern and Classic audit layouts.
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
              <span>Generate &amp; View Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicStockReport;
