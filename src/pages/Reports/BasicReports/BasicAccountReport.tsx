import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, fetchAllPages } from '../../../Context/supabaseClient';
import { useAuth } from '../../../Context/Auth';
import Spinner from '../../../ui/Spinner';
import { toast } from 'react-hot-toast';
import {
  MdFilterAlt,
  MdRestartAlt,
  MdPrint,
  MdLock,
  MdClose,
  MdSearch,
  MdLayers,
  MdAccountBalance,
  MdCalendarToday
} from 'react-icons/md';
import { fetchSystemMasterConfig } from '../../../utils/systemPermissions';

export type BasicAccountReportType = 'customer' | 'vendor' | 'coa' | 'cash_bank' | 'expense';

export interface BasicAccountFilterCriteria {
  reportType: BasicAccountReportType;
  partyIds?: string[];
  partyId?: string;
  partyNames?: string[];
  accountHeads?: string[];
  subHeads?: string[];
  accountCodes?: string[];
  areas?: string[];
  hideZeroBalances?: boolean;
  dateMode: 'single' | 'multi';
  singleDate?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy: 'balance_desc' | 'balance_asc' | 'name_asc' | 'name_desc' | 'code_asc' | 'code_desc';
}

const STORAGE_CRITERIA_KEY = 'zac_basic_account_report_criteria_v2';
const META_CACHE_KEY = 'zac_basic_account_meta_v3';

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
  extraHeaderContent?: React.ReactNode;
}

const FacetCheckboxList: React.FC<FacetCheckboxListProps> = ({
  title,
  items,
  selectedIds,
  onSelectionChange,
  placeholder = 'Search...',
  disabled = false,
  disabledMessage = 'Locked',
  heightClass = 'h-48',
  extraHeaderContent
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-stroke dark:border-strokedark bg-gray-50/70 dark:bg-meta-4/40 rounded-t-xl gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
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
          {extraHeaderContent}
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

// ── MAIN BASIC ACCOUNT REPORT FILTER PAGE COMPONENT ──
export const BasicAccountReport: React.FC = () => {
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
  const [coaMaster, setCoaMaster] = useState<any[]>(cachedMeta?.coaMaster || []);
  const [customersMaster, setCustomersMaster] = useState<any[]>(cachedMeta?.customers || []);
  const [vendorsMaster, setVendorsMaster] = useState<any[]>(cachedMeta?.vendors || []);
  const [banksMaster, setBanksMaster] = useState<any[]>(cachedMeta?.banks || []);

  // Filter States
  const [reportType, setReportType] = useState<BasicAccountReportType>('customer');
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [hideZeroBalances, setHideZeroBalances] = useState<boolean>(false);

  // 3-Tier Cascading Account Hierarchy Filter
  const [selectedHeads, setSelectedHeads] = useState<string[]>([]);
  const [selectedSubHeads, setSelectedSubHeads] = useState<string[]>([]);
  const [selectedAccountCodes, setSelectedAccountCodes] = useState<string[]>([]);

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
  const [sortBy, setSortBy] = useState<BasicAccountFilterCriteria['sortBy']>('balance_desc');

  // Fetch Master Data
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      try {
        const sysCfg = await fetchSystemMasterConfig();
        if (sysCfg?.business_name && isMounted) {
          setBusinessName(sysCfg.business_name);
        }

        const [coaRes, custRes, venRes, bankRes, invRes, retRes] = await Promise.all([
          fetchAllPages(supabase.from('chart_of_accounts').select('*').order('account_code')),
          fetchAllPages(supabase.from('customers').select('*').order('customer_name')),
          fetchAllPages(supabase.from('vendors').select('*').order('name')),
          fetchAllPages(supabase.from('banks').select('*').order('bank_name')),
          fetchAllPages(supabase.from('sales_invoices').select('customer_name, total_amount, amount_paid')),
          fetchAllPages(supabase.from('sales_returns').select('customer_name, total_amount'))
        ]);

        if (!isMounted) return;

        // Build live invoice & return balance maps for customers
        const invBalMap: Record<string, { total: number; paid: number; net: number }> = {};
        (invRes.data || []).forEach((inv: any) => {
          const k = (inv.customer_name || '').trim().toLowerCase();
          if (!k) return;
          if (!invBalMap[k]) invBalMap[k] = { total: 0, paid: 0, net: 0 };
          const tot = Number(inv.total_amount || 0);
          const paid = Number(inv.amount_paid || 0);
          invBalMap[k].total += tot;
          invBalMap[k].paid += paid;
          invBalMap[k].net += (tot - paid);
        });

        (retRes.data || []).forEach((ret: any) => {
          const k = (ret.customer_name || '').trim().toLowerCase();
          if (!k) return;
          if (!invBalMap[k]) invBalMap[k] = { total: 0, paid: 0, net: 0 };
          invBalMap[k].net -= Number(ret.total_amount || 0);
        });

        const loadedCoa = coaRes.data || [];
        const loadedCust = (custRes.data || []).map((c: any) => {
          const k = (c.customer_name || c.customerName || c.customername || c.name || '').trim().toLowerCase();
          const dynamicNet = invBalMap[k]?.net || 0;
          const finalBal = (Number(c.balance) || 0) !== 0
            ? Number(c.balance)
            : (Number(c.opening_balance || 0) + dynamicNet);

          return {
            ...c,
            balance: finalBal,
            current_balance: finalBal,
            computed_balance: finalBal,
            invoiced_total: invBalMap[k]?.total || 0,
            paid_total: invBalMap[k]?.paid || 0
          };
        });
        const loadedVen = venRes.data || [];
        const loadedBanks = bankRes.data || [];

        setCoaMaster(loadedCoa);
        setCustomersMaster(loadedCust);
        setVendorsMaster(loadedVen);
        setBanksMaster(loadedBanks);

        try {
          const payload = {
            coaMaster: loadedCoa,
            customers: loadedCust,
            vendors: loadedVen,
            banks: loadedBanks,
            cachedAt: Date.now()
          };
          localStorage.setItem(META_CACHE_KEY, JSON.stringify(payload));
        } catch {}
      } catch (err) {
        console.error('Failed to load basic account report metadata:', err);
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
        const c: BasicAccountFilterCriteria = JSON.parse(saved);
        if (c.reportType) setReportType(c.reportType);
        if (c.partyIds) setSelectedParties(c.partyIds);
        else if (c.partyId) setSelectedParties([c.partyId]);
        if (c.areas) setSelectedAreas(c.areas);
        if (c.accountHeads) setSelectedHeads(c.accountHeads);
        if (c.subHeads) setSelectedSubHeads(c.subHeads);
        if (c.accountCodes) setSelectedAccountCodes(c.accountCodes);
        if (c.hideZeroBalances !== undefined) setHideZeroBalances(c.hideZeroBalances);
        if (c.dateMode) setDateMode(c.dateMode);
        if (c.singleDate) setSingleDate(c.singleDate);
        if (c.dateFrom) setDateFrom(c.dateFrom);
        if (c.dateTo) setDateTo(c.dateTo);
        if (c.sortBy) setSortBy(c.sortBy);
      }
    } catch {}
  }, []);

  // Distinct Areas / Cities from Customers
  const availableAreas = useMemo(() => {
    const aSet = new Set<string>();
    customersMaster.forEach((c) => {
      const a = c.area || c.city;
      if (a && String(a).trim()) aSet.add(String(a).trim());
    });
    return Array.from(aSet).sort((a, b) => a.localeCompare(b));
  }, [customersMaster]);

  // ── 3-TIER ACCOUNT HIERARCHY DERIVATIONS ──
  // 1. Primary Account Heads (Assets, Liabilities, Equity, Revenue, Expense)
  const primaryHeadItems = useMemo<FacetItem[]>(() => {
    return [
      { id: '1', label: '1. Assets (Receivables, Stock, Cash, Bank)', subLabel: 'Code Range: 1000 - 1999' },
      { id: '2', label: '2. Liabilities (Payables & Obligations)', subLabel: 'Code Range: 2000 - 2999' },
      { id: '3', label: '3. Equity / Capital', subLabel: 'Code Range: 3000 - 3999' },
      { id: '4', label: '4. Revenue / Income', subLabel: 'Code Range: 4000 - 4999' },
      { id: '5', label: '5. Expenses & Cost of Sales', subLabel: 'Code Range: 5000 - 5999' }
    ];
  }, []);

  // 2. Sub-Heads / Control Groups (derived from chart of accounts)
  const subHeadItems = useMemo<FacetItem[]>(() => {
    if (selectedHeads.length === 0) return [];
    const headPrefixes = new Set(selectedHeads);
    const controlMap = new Map<string, string>();

    coaMaster.forEach((acc) => {
      const code = String(acc.account_code || '');
      const firstDigit = code.charAt(0);
      if (headPrefixes.has(firstDigit)) {
        const prefix2 = code.substring(0, 2);
        let groupName = 'General Control';
        if (prefix2 === '10') groupName = '10 - Current Assets & Liquid Funds';
        else if (prefix2 === '11') groupName = '11 - Accounts Receivable';
        else if (prefix2 === '12') groupName = '12 - Inventory & Goods';
        else if (prefix2 === '15') groupName = '15 - Fixed & Tangible Assets';
        else if (prefix2 === '20') groupName = '20 - Current Liabilities & Payables';
        else if (prefix2 === '30') groupName = '30 - Owner Capital & Reserves';
        else if (prefix2 === '40') groupName = '40 - Sales Revenue & Income';
        else if (prefix2 === '50') groupName = '50 - Cost of Sales & Direct Costs';
        else if (prefix2 === '51' || prefix2 === '52') groupName = '51 - Operating & Admin Expenses';
        else groupName = `${prefix2} - Sub-Control Group`;

        controlMap.set(prefix2, groupName);
      }
    });

    return Array.from(controlMap.entries()).map(([id, label]) => ({
      id,
      label
    }));
  }, [coaMaster, selectedHeads]);

  // 3. Specific Accounts / Ledger Parties
  const specificAccountItems = useMemo<FacetItem[]>(() => {
    let list: FacetItem[] = [];

    if (reportType === 'customer') {
      let pool = customersMaster;
      if (selectedAreas.length > 0) {
        const arSet = new Set(selectedAreas.map((a) => a.toLowerCase().trim()));
        pool = pool.filter((c) => {
          const a = String(c.area || c.city || '').toLowerCase().trim();
          return arSet.has(a);
        });
      }
      if (hideZeroBalances) {
        pool = pool.filter((c) => Math.abs(Number(c.current_balance || c.balance || 0)) > 0);
      }

      list = pool.map((c) => {
        const name = c.customer_name || c.customerName || c.customername || c.name || 'Customer';
        const bal = Number(c.current_balance || c.balance || c.opening_balance || 0);
        return {
          id: String(c.id),
          label: name,
          subLabel: `${c.customer_code || c.customerCode || c.account_code || 'Code: —'} • ${c.area || c.city || 'No Area'}`,
          meta: bal !== 0 ? `Rs. ${Math.round(bal).toLocaleString()}` : undefined
        };
      });
    } else if (reportType === 'vendor') {
      let pool = vendorsMaster;
      if (hideZeroBalances) {
        pool = pool.filter((v) => Math.abs(Number(v.currentBalance || v.balance || 0)) > 0);
      }
      list = pool.map((v) => {
        const name = v.vendor_name || v.name || 'Vendor';
        const bal = Number(v.currentBalance || v.balance || 0);
        return {
          id: String(v.id),
          label: name,
          subLabel: `${v.vendor_code || v.vendorCode || 'Code: —'} • ${v.category || 'Supplier'}`,
          meta: `Rs. ${Math.round(bal).toLocaleString()}`
        };
      });
    } else {
      // Chart of Accounts / Cash & Bank / Expenses
      let pool = coaMaster;
      if (selectedHeads.length > 0) {
        const prefixes = new Set(selectedHeads);
        pool = pool.filter((acc) => prefixes.has(String(acc.account_code || '').charAt(0)));
      }
      if (selectedSubHeads.length > 0) {
        const subPrefixes = new Set(selectedSubHeads);
        pool = pool.filter((acc) => subPrefixes.has(String(acc.account_code || '').substring(0, 2)));
      }
      if (reportType === 'expense') {
        pool = pool.filter((acc) => String(acc.account_code || '').startsWith('5'));
      } else if (reportType === 'cash_bank') {
        pool = pool.filter(
          (acc) =>
            String(acc.account_code || '').startsWith('10') ||
            String(acc.account_title || '').toLowerCase().includes('cash') ||
            String(acc.account_title || '').toLowerCase().includes('bank')
        );
      }

      list = pool.map((acc) => {
        const title = acc.account_title || 'Account';
        const code = acc.account_code || '—';
        const bal = Number(acc.opening_balance || 0);
        return {
          id: String(acc.account_code),
          label: `${code} — ${title}`,
          subLabel: acc.account_type || acc.balance_nature || 'Ledger Account',
          meta: bal !== 0 ? `Rs. ${Math.round(bal).toLocaleString()}` : undefined
        };
      });
    }

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [
    reportType,
    customersMaster,
    vendorsMaster,
    coaMaster,
    selectedAreas,
    hideZeroBalances,
    selectedHeads,
    selectedSubHeads
  ]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setReportType('customer');
    setSelectedParties([]);
    setSelectedAreas([]);
    setSelectedHeads([]);
    setSelectedSubHeads([]);
    setSelectedAccountCodes([]);
    setHideZeroBalances(false);
    setDateMode('multi');
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setDateFrom(d.toISOString().split('T')[0]);
    setDateTo(new Date().toISOString().split('T')[0]);
    setSingleDate(new Date().toISOString().split('T')[0]);
    setSortBy('balance_desc');
    try {
      localStorage.removeItem(STORAGE_CRITERIA_KEY);
    } catch {}
    toast.success('Account filters reset to defaults');
  };

  // Generate Report Handler
  const handleGenerateReport = () => {
    const criteria: BasicAccountFilterCriteria = {
      reportType,
      partyIds: selectedParties.length > 0 ? selectedParties : undefined,
      partyId: selectedParties[0] || undefined,
      accountHeads: selectedHeads.length > 0 ? selectedHeads : undefined,
      subHeads: selectedSubHeads.length > 0 ? selectedSubHeads : undefined,
      accountCodes: selectedAccountCodes.length > 0 ? selectedAccountCodes : undefined,
      areas: selectedAreas.length > 0 ? selectedAreas : undefined,
      hideZeroBalances,
      dateMode,
      singleDate: dateMode === 'single' ? singleDate : undefined,
      dateFrom: dateMode === 'multi' ? dateFrom : undefined,
      dateTo: dateMode === 'multi' ? dateTo : undefined,
      sortBy
    };

    try {
      localStorage.setItem(STORAGE_CRITERIA_KEY, JSON.stringify(criteria));
    } catch {}

    const dest = `${tenantId ? `/${tenantId}` : ''}/basic-account-report/print`;
    navigate(dest, { state: { criteria } });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading Basic Accounts Report metadata...
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
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Core Department Report
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {businessName || 'Zohaib Ali & Co.'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              <span>Basic Accounts Report</span>
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

      {/* ── REPORTS TAB BAR ── */}
      <div className="bg-white dark:bg-boxdark p-1.5 rounded-2xl border border-stroke dark:border-strokedark shadow-2xs overflow-x-auto print:hidden">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-primary text-white shadow-sm transition whitespace-nowrap"
          >
            <MdAccountBalance size={16} />
            <span>Basic Accounts Report</span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-white/20 text-white ml-0.5">
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
              onChange={(e) => {
                setReportType(e.target.value as BasicAccountReportType);
                setSelectedParties([]);
                setSelectedAccountCodes([]);
              }}
              className="w-full appearance-none rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/30 py-3.5 px-4 text-sm font-bold text-black dark:text-white transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="customer">Customer Balances &amp; Receivables Ledger Report</option>
              <option value="vendor">Vendor / Supplier Balances &amp; Payables Ledger Report</option>
              <option value="coa">Chart of Accounts &amp; Trial Balance (Financial Structure)</option>
              <option value="cash_bank">Cash &amp; Bank Book (Daily Financial Transactions)</option>
              <option value="expense">Operating Expense Report (Operational &amp; Admin Costs)</option>
            </select>
          </div>
        </div>

        {/* 2. CASCADING ACCOUNT HIERARCHY & REGISTER FILTER BOXES */}
        <div className="space-y-3 pt-2 border-t border-stroke/60 dark:border-strokedark/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <MdLayers className="text-primary" size={16} />
              <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                {reportType === 'customer'
                  ? 'Customer Accounts & Area Filtering'
                  : reportType === 'vendor'
                  ? 'Vendor Accounts & Category Filtering'
                  : 'Chart of Accounts Financial Hierarchy'}
              </span>
            </div>
            <span className="text-[11px] text-gray-400">
              Interactive facet boxes with live search &amp; keyboard navigation (↑↓ and Enter)
            </span>
          </div>

          {reportType === 'coa' || reportType === 'cash_bank' || reportType === 'expense' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Box 1: Primary Account Head */}
              <FacetCheckboxList
                title="1. Primary Account Head"
                items={primaryHeadItems}
                selectedIds={selectedHeads}
                onSelectionChange={setSelectedHeads}
                placeholder="Search account head..."
              />

              {/* Box 2: Sub-Control Group */}
              <FacetCheckboxList
                title="2. Sub-Control Group"
                items={subHeadItems}
                selectedIds={selectedSubHeads}
                onSelectionChange={setSelectedSubHeads}
                placeholder="Search sub-group..."
                disabled={selectedHeads.length === 0}
                disabledMessage="Select Primary Account Head first"
              />
            </div>
          ) : null}

          {/* Box 3: Specific Ledger Accounts / Parties */}
          <div className="pt-2">
            <FacetCheckboxList
              title={
                reportType === 'customer'
                  ? 'Active Customers Register'
                  : reportType === 'vendor'
                  ? 'Active Vendors Register'
                  : '3. Specific General Ledger Accounts'
              }
              items={specificAccountItems}
              selectedIds={
                reportType === 'customer' || reportType === 'vendor'
                  ? selectedParties
                  : selectedAccountCodes
              }
              onSelectionChange={
                reportType === 'customer' || reportType === 'vendor'
                  ? setSelectedParties
                  : setSelectedAccountCodes
              }
              extraHeaderContent={
                <div className="inline-flex items-center p-0.5 rounded-lg bg-gray-200/80 dark:bg-meta-4/80 text-[10px] font-bold ml-1.5">
                  <button
                    type="button"
                    onClick={() => setHideZeroBalances(false)}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      !hideZeroBalances
                        ? 'bg-white dark:bg-boxdark text-black dark:text-white shadow-xs font-extrabold'
                        : 'text-gray-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    All Accounts
                  </button>
                  <button
                    type="button"
                    onClick={() => setHideZeroBalances(true)}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      hideZeroBalances
                        ? 'bg-amber-500 text-white shadow-xs font-extrabold'
                        : 'text-gray-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    Hide Zero-Balance
                  </button>
                </div>
              }
              placeholder={
                reportType === 'customer'
                  ? 'Search customer by name, code, or area...'
                  : reportType === 'vendor'
                  ? 'Search vendor by name, code, or category...'
                  : 'Search ledger account by title or code...'
              }
              heightClass="h-56"
            />
          </div>
        </div>

        {/* 4. DATE FILTER & SORT ORDER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-stroke/60 dark:border-strokedark/60 items-end">
          {/* Date Filter */}
          <div className="lg:col-span-8 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <MdCalendarToday className="text-primary" size={15} />
                <span>Financial Period</span>
              </label>

              {/* Mode Switcher Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-meta-4/60 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDateMode('single')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                    dateMode === 'single'
                      ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                      : 'text-gray-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  As of Single Date
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('multi')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                    dateMode === 'multi'
                      ? 'bg-white dark:bg-boxdark text-primary shadow-xs'
                      : 'text-gray-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  Date Range
                </button>
              </div>
            </div>

            {/* Inputs */}
            {dateMode === 'single' ? (
              <div>
                <span className="text-[10px] text-gray-400 block mb-0.5">As of Date</span>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 py-2.5 px-3 text-xs font-medium text-black dark:text-white focus:border-primary focus:outline-none"
                />
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
          <div className="lg:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as BasicAccountFilterCriteria['sortBy'])}
              className="w-full rounded-xl border border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/20 py-2.5 px-3 text-xs font-medium text-black dark:text-white focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="balance_desc">Closing Balance (Highest First)</option>
              <option value="balance_asc">Closing Balance (Lowest First)</option>
              <option value="name_asc">Account / Party Name (A to Z)</option>
              <option value="name_desc">Account / Party Name (Z to A)</option>
              <option value="code_asc">Account Code (Ascending)</option>
              <option value="code_desc">Account Code (Descending)</option>
            </select>
          </div>
        </div>

        {/* 6. BOTTOM ACTION FOOTER */}
        <div className="pt-4 border-t border-stroke dark:border-strokedark flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Accounts criteria specified. Output renders with Modern and Classic audit layouts.
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

export default BasicAccountReport;
