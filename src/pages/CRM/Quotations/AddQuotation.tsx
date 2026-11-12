import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../../../components/Breadcrumbs/Breadcrumb';
import { supabase } from '../../../Context/supabaseClient';
import { useAuth } from '../../../Context/Auth';
import CustomerCombobox, { CustomerComboboxItem } from '../../../components/CustomerCombobox';
import { fetchAllUomsSafe } from '../../../service/uomService';
import Spinner from '../../../ui/Spinner';
import { toast } from 'react-hot-toast';
import {
  MdAdd,
  MdDeleteOutline,
  MdSave,
  MdArrowBack,
  MdReceipt,
  MdPerson,
  MdOutlineNotes,
  MdInventory2,
  MdPrint,
  MdSearch,
  MdClose
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { QuotationItem } from './PrintQuotation';

// Clean Searchable SalesmanCombobox matching CustomerCombobox UX (not addable)
const SalesmanCombobox: React.FC<{
  salesmen: { id: string | number; name: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ salesmen = [], value = '', onChange, placeholder = 'Search or select salesman...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const valid = salesmen.filter(s => s && s.name && s.name.trim().length > 0);
    if (!query.trim()) return valid;
    const q = query.toLowerCase().trim();
    return valid.filter(s => (s.name || '').toLowerCase().includes(q));
  }, [salesmen, query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered.length, query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, filtered.length - 1)));
    } else if (e.key === 'Enter') {
      if (isOpen && filtered[highlightedIndex]) {
        e.preventDefault();
        setQuery(filtered[highlightedIndex].name);
        onChange(filtered[highlightedIndex].name);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-10.5 text-xs font-semibold px-3 py-2.5 pr-8 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:ring-1 focus:ring-[var(--color-primary,#800020)] outline-hidden shadow-2xs transition"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('');
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
            <MdClose size={15} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-99999 w-full max-h-56 overflow-y-auto rounded-xl border border-[var(--color-primary,#800020)]/30 dark:border-[var(--color-primary,#800020)]/50 bg-white dark:bg-boxdark shadow-2xl divide-y divide-stroke dark:divide-strokedark ring-1 ring-black/10">
          {filtered.length > 0 ? (
            filtered.map((s, idx) => {
              const isHighlighted = highlightedIndex === idx;
              return (
                <div
                  key={s.id || s.name}
                  onMouseDown={e => {
                    e.preventDefault();
                    setQuery(s.name);
                    onChange(s.name);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`p-2.5 cursor-pointer text-xs font-semibold flex items-center justify-between transition ${
                    isHighlighted
                      ? 'bg-[var(--color-primary,#800020)]/10 text-[var(--color-primary,#800020)] dark:text-rose-200 font-bold'
                      : value === s.name
                      ? 'bg-gray-100 dark:bg-meta-4/40 font-bold text-black dark:text-white'
                      : 'hover:bg-gray-50 dark:hover:bg-meta-4/20 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <span>{s.name}</span>
                  {value === s.name && <span className="text-[10px] text-[var(--color-primary,#800020)] dark:text-rose-300">✓</span>}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs text-gray-400 italic">No salesmen found</div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact Searchable UomCombobox powered by active inventory UOMs
const UomCombobox: React.FC<{
  value: string;
  onChange: (val: string) => void;
  activeUoms: string[];
}> = ({ value, onChange, activeUoms }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return activeUoms;
    const q = search.toLowerCase().trim();
    return activeUoms.filter(u => u.toLowerCase().includes(q));
  }, [activeUoms, search]);

  return (
    <div ref={ref} className="relative w-24 mx-auto">
      <div
        onClick={() => {
          setIsOpen(prev => !prev);
          setSearch('');
        }}
        className="w-full text-center text-xs font-bold font-mono px-2 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white hover:border-primary flex items-center justify-between cursor-pointer shadow-2xs select-none"
      >
        <span className="truncate flex-1">{value || 'PCS'}</span>
        <span className="text-[10px] text-gray-400 ml-1">▼</span>
      </div>

      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-[99999] w-36 max-h-48 overflow-y-auto rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-2xl p-1 divide-y divide-stroke dark:divide-strokedark ring-1 ring-black/10">
          <div className="p-1 pb-1.5">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search UOM..."
              className="w-full text-[11px] font-mono px-2 py-1 rounded border border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4 outline-hidden focus:border-primary"
            />
          </div>
          <div className="max-h-36 overflow-y-auto divide-y divide-stroke dark:divide-strokedark">
            {filtered.map(u => (
              <div
                key={u}
                onMouseDown={e => {
                  e.preventDefault();
                  onChange(u);
                  setIsOpen(false);
                }}
                className={`p-1.5 cursor-pointer text-xs font-mono font-bold flex items-center justify-between transition ${
                  value === u ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-meta-4/30'
                }`}
              >
                <span>{u}</span>
                {value === u && <span className="text-[10px] text-primary">✓</span>}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-2 text-center text-[11px] text-gray-400 italic">No UOM found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to identify Tile products based on category or name
export const isTileProduct = (p: any): boolean => {
  if (!p) return false;
  const cat = String(p?.category || '').toLowerCase().trim();
  const sub = String(p?.sub_category || '').toLowerCase().trim();
  const subsub = String(p?.sub_sub_category || '').toLowerCase().trim();
  const name = String(p?.product_name || '').toLowerCase().trim();
  const uom = String(p?.uom || '').toUpperCase().trim();

  // Exclude non-tile/sanitary items that might have dimension numbers in their names (e.g. Jalli 2x4, Waste Pipe 2x4)
  const isNonTileItem = /jalli|drain|grate|grating|waste|strainer|trap|pipe|pvc|sanitary|faucet|mixer|basin|commode|tap|sink|hardware|grout|bond/i.test(name) ||
                        /sanitary|plumbing|hardware|accessories|cp fittings/i.test(cat);
  if (isNonTileItem) return false;

  const isTileCat = cat.includes('tile') || sub.includes('tile') || subsub.includes('tile');
  const hasTileInName = name.includes('tile');
  const isBoxUom = uom === 'BOX' || uom === 'SQM' || uom === 'SQ.M';

  if (isTileCat || hasTileInName) return true;

  // Only consider dimensions if uom is BOX/SQM or has tile-related finish keywords like porcelain, ceramic, vitrified, matt, gloss
  if (isBoxUom || /porcelain|ceramic|vitrified|matt|gloss|granite|marble/i.test(name)) {
    if (/\b\d+(\.\d+)?\s*[xX×*]\s*\d+(\.\d+)?\b/.test(name)) {
      return true;
    }
  }

  return false;
};

export interface StandardItem {
  id: string;
  product_id?: string | number;
  product_name: string;
  sku_code?: string;
  category?: string;
  uom: string;
  unit: string;
  qty: number;
  bulk_qty: number;
  loose_qty: number;
  allow_loose_sales: boolean;
  loose_uom: string;
  loose_conversion_ratio: number;
  current_stock?: number;
  rate: number;
  discount_percent: number;
  discount_amount: number;
  amount: number;
  notes?: string;
  is_tile?: false;
}

export interface TileItem {
  id: string;
  product_id?: string | number;
  product_name: string;
  sku_code?: string;
  category?: string;
  sub_category?: string;
  box_qty: number;
  loose_pcs: number;
  total_sqm: number;
  sqm_per_box: number;
  pcs_per_box: number;
  rate_per_box: number;
  rate_per_sqm: number;
  rate_per_piece: number;
  discount_percent: number;
  discount_amount: number;
  amount: number;
  notes?: string;
  current_stock?: number;
  is_tile: true;
}

const AddQuotation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { tenantId, userName, businessName } = useAuth();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Catalogs
  const [customerDirectory, setCustomerDirectory] = useState<CustomerComboboxItem[]>([]);
  const [productsCatalog, setProductsCatalog] = useState<any[]>([]);
  const [salesmenList, setSalesmenList] = useState<any[]>([]);

  // Form State
  const [quoteNo, setQuoteNo] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | number>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [quoteDate, setQuoteDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [salesmanName, setSalesmanName] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Converted to Invoice'>('Draft');
  const [notes, setNotes] = useState('Prices quoted are valid for 15 days. Delivery charges extra if outside municipal limits.');

  // Toggle Tile Container (hidden by default)
  const [showTileSection, setShowTileSection] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [activeUomsList, setActiveUomsList] = useState<string[]>(['PCS', 'BOX', 'DOZ', 'MTR', 'KG', 'LTR', 'BAG', 'SQFT', 'SQM']);

  // Standard Items State
  const [standardItems, setStandardItems] = useState<StandardItem[]>([
    {
      id: `item-${Date.now()}-1`,
      product_name: '',
      uom: 'PCS',
      unit: 'PCS',
      qty: 1,
      bulk_qty: 1,
      loose_qty: 0,
      allow_loose_sales: false,
      loose_uom: 'PCS',
      loose_conversion_ratio: 1,
      rate: 0,
      discount_percent: 0,
      discount_amount: 0,
      amount: 0,
      notes: '',
      is_tile: false,
    }
  ]);

  // Dedicated Tile Items State
  const [tileItems, setTileItems] = useState<TileItem[]>([]);

  // Autocomplete UI dropdown states for standard items
  const [activeProdIndex, setActiveProdIndex] = useState<number | null>(null);
  const [highlightedProdIndex, setHighlightedProdIndex] = useState(0);

  // Autocomplete UI dropdown states for tile items
  const [activeTileProdIndex, setActiveTileProdIndex] = useState<number | null>(null);
  const [highlightedTileProdIndex, setHighlightedTileProdIndex] = useState(0);

  // Close popups on click outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.prod-dropdown-container')) {
        setActiveProdIndex(null);
      }
      if (!target.closest('.tile-dropdown-container')) {
        setActiveTileProdIndex(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  useEffect(() => {
    fetchCatalogs();
    if (isEditMode) {
      loadQuotationToEdit();
    } else {
      generateQuotationNumber();
    }
  }, [id]);

  const generateQuotationNumber = async () => {
    try {
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('crm_quotations')
        .select('*', { count: 'exact', head: true });

      const nextNum = (count || 0) + 1;
      setQuoteNo(`QT-${year}-${String(nextNum).padStart(3, '0')}`);
    } catch {
      setQuoteNo(`QT-${new Date().getFullYear()}-001`);
    }
  };

  const fetchCatalogs = async () => {
    try {
      // 1. Fetch Customers
      const { data: custData } = await supabase
        .from('customers')
        .select('id, customer_name, customername, phone, primaryphone, address, city')
        .order('customer_name');

      if (custData) {
        setCustomerDirectory(
          custData.map(c => ({
            id: c.id,
            name: c.customer_name || c.customername || '',
            phone: c.phone || c.primaryphone || '',
            address: c.address || c.city || ''
          }))
        );
      }

      // 2. Fetch Products
      let { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('id, product_name, item_sr_no, category, sub_category, sub_sub_category, uom, retail_price, sale_price, sales_price, mrp, price, current_stock, allow_loose_sales, loose_uom, loose_conversion_ratio, pieces_per_box, pcs_per_box, sqm_per_box')
        .order('product_name');

      if (prodErr) {
        // Fallback for minimal column schema
        const fallbackRes = await supabase
          .from('products')
          .select('id, product_name, item_sr_no, category, sub_category, sub_sub_category, uom, retail_price, sale_price, sales_price, mrp, price, current_stock')
          .order('product_name');
        prodData = fallbackRes.data || [];
      }

      if (prodData) {
        setProductsCatalog(prodData);
      }

      // 3. Fetch Salesmen
      const { data: smData } = await supabase
        .from('salesmen')
        .select('id, name')
        .order('name');

      if (smData) {
        setSalesmenList(smData);
      }

      // 4. Fetch Active UOMs
      try {
        const uoms = await fetchAllUomsSafe(tenantId);
        const active = (uoms || [])
          .filter(u => u.is_active)
          .map(u => u.short_code.toUpperCase());
        if (active.length > 0) {
          setActiveUomsList(active);
        }
      } catch (uErr) {
        console.warn('Failed to fetch active UOMs:', uErr);
      }
    } catch (err) {
      console.error('Error fetching catalogs:', err);
    }
  };

  const loadQuotationToEdit = async () => {
    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from('crm_quotations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setQuoteNo(data.quotation_number || data.quote_no || '');
        setCustomerName(data.customer_name || data.customer || '');
        setCustomerPhone(data.customer_phone || '');
        setCustomerAddress(data.customer_address || '');
        if (data.date) setQuoteDate(data.date);
        if (data.valid_until) setValidUntil(data.valid_until);
        if (data.salesman_name) setSalesmanName(data.salesman_name);
        if (data.status) setStatus(data.status);
        if (data.notes) setNotes(data.notes);
        const loadedRaw = Array.isArray(data.items) ? data.items : (typeof data.items === 'string' ? JSON.parse(data.items || '[]') : []);
        if (loadedRaw.some((it: any) => Number(it.discount_percent || 0) > 0 || Number(it.discount_amount || 0) > 0)) {
          setShowDiscount(true);
        }

        const loadedItems = Array.isArray(data.items)
          ? data.items
          : typeof data.items === 'string'
          ? JSON.parse(data.items || '[]')
          : [];

        if (loadedItems.length > 0) {
          const loadedStandard: StandardItem[] = [];
          const loadedTiles: TileItem[] = [];

          loadedItems.forEach((it: any, idx: number) => {
            if (it.is_tile) {
              const pcsPerBox = Number(it.pcs_per_box || 4);
              const sqmPerBox = Number(it.sqm_per_box || 1.44);
              const boxQty = Number(it.box_qty ?? it.qty ?? 1);
              const loosePcs = Number(it.loose_pcs ?? 0);
              const totalSqm = Number(it.total_sqm || ((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2));
              const ratePerBox = Number(it.rate_per_box ?? it.rate ?? 0);
              const ratePerSqm = Number(it.rate_per_sqm || (sqmPerBox > 0 ? (ratePerBox / sqmPerBox).toFixed(2) : 0));
              const ratePerPiece = Number(it.rate_per_piece || (pcsPerBox > 0 ? (ratePerBox / pcsPerBox).toFixed(2) : 0));

              loadedTiles.push({
                id: it.id || `tile-${Date.now()}-${idx}`,
                product_id: it.product_id,
                product_name: it.product_name,
                sku_code: it.sku_code || '',
                category: it.category || '',
                sub_category: it.sub_category || '',
                box_qty: boxQty,
                loose_pcs: loosePcs,
                total_sqm: totalSqm,
                sqm_per_box: sqmPerBox,
                pcs_per_box: pcsPerBox,
                rate_per_box: ratePerBox,
                rate_per_sqm: ratePerSqm,
                rate_per_piece: ratePerPiece,
                discount_percent: Number(it.discount_percent || 0),
                discount_amount: Number(it.discount_amount || 0),
                amount: Number(it.amount || 0),
                notes: it.notes || '',
                current_stock: it.current_stock,
                is_tile: true
              });
            } else {
              const rawRatio = Number(it.loose_conversion_ratio || 1);
              const qty = Number(it.qty || 1);
              const bulkQty = it.bulk_qty !== undefined ? Number(it.bulk_qty) : Math.floor(qty);
              const looseQty = it.loose_qty !== undefined ? Number(it.loose_qty) : (rawRatio > 1 ? Math.round((qty - bulkQty) * rawRatio) : 0);

              loadedStandard.push({
                id: it.id || `item-${Date.now()}-${idx}`,
                product_id: it.product_id,
                product_name: it.product_name,
                sku_code: it.sku_code || '',
                category: it.category || '',
                uom: it.uom || it.unit || 'PCS',
                unit: it.unit || it.uom || 'PCS',
                qty: qty,
                bulk_qty: bulkQty,
                loose_qty: looseQty,
                allow_loose_sales: Boolean(it.allow_loose_sales || rawRatio > 1),
                loose_uom: it.loose_uom || 'PCS',
                loose_conversion_ratio: rawRatio,
                current_stock: it.current_stock,
                rate: Number(it.rate || 0),
                discount_percent: Number(it.discount_percent || 0),
                discount_amount: Number(it.discount_amount || 0),
                amount: Number(it.amount || 0),
                notes: it.notes || '',
                is_tile: false
              });
            }
          });

          if (loadedStandard.length > 0) {
            setStandardItems(loadedStandard);
          }
          if (loadedTiles.length > 0) {
            setTileItems(loadedTiles);
            setShowTileSection(true);
          }
        }
      }
    } catch (err: any) {
      toast.error('Failed to load quotation details');
      navigate(`${tenantId ? `/${tenantId}` : ''}/crm/quotations`);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCustomerSelect = (cust: CustomerComboboxItem | null) => {
    if (cust) {
      setSelectedCustomerId(cust.id);
      setCustomerName(cust.name);
      if (cust.phone) setCustomerPhone(cust.phone);
      if (cust.address) setCustomerAddress(cust.address);
    }
  };

  const setValidityDays = (days: number) => {
    const base = quoteDate ? new Date(quoteDate) : new Date();
    base.setDate(base.getDate() + days);
    setValidUntil(base.toISOString().split('T')[0]);
  };

  // Helper: Automatically persist or update customer in Supabase database
  const syncCustomerToDatabase = async (name: string, phone: string, address: string) => {
    const cleanName = (name || '').trim();
    if (!cleanName) return null;

    try {
      // 1. Search existing customer by name
      const { data: existingList } = await supabase
        .from('customers')
        .select('id, customer_name, customername, phone, primaryphone, address, city, customer_code')
        .or(`customer_name.ilike."${cleanName}",customername.ilike."${cleanName}"`);

      const existing = existingList && existingList.length > 0 ? existingList[0] : null;

      if (existing) {
        // Update contact phone or address if provided
        const updates: any = {};
        if (phone.trim() && phone.trim() !== (existing.phone || existing.primaryphone)) {
          updates.phone = phone.trim();
          updates.primaryphone = phone.trim();
        }
        if (address.trim() && address.trim() !== existing.address) {
          updates.address = address.trim();
          if (!existing.city) {
            updates.city = address.trim();
          }
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('customers')
            .update(updates)
            .eq('id', existing.id);
        }
        return existing.id;
      } else {
        // Generate customer code 2020-XXX
        let nextCode = '2020-001';
        try {
          const { data: lastCust } = await supabase
            .from('customers')
            .select('customer_code')
            .order('id', { ascending: false })
            .limit(1);

          if (lastCust && lastCust[0]?.customer_code) {
            const parts = String(lastCust[0].customer_code).split('-');
            const lastNum = parseInt(parts[1] || '0', 10);
            nextCode = `2020-${String(lastNum + 1).padStart(3, '0')}`;
          }
        } catch (_) {}

        const newCustPayload = {
          customer_name: cleanName,
          customername: cleanName,
          phone: phone.trim(),
          primaryphone: phone.trim(),
          address: address.trim(),
          city: address.trim() || 'General',
          customer_code: nextCode,
          tenant_id: tenantId || null,
        };

        const { data: inserted } = await supabase
          .from('customers')
          .insert([newCustPayload])
          .select('id')
          .single();

        // Refresh local customer directory
        setCustomerDirectory(prev => [
          {
            id: inserted?.id || `cust-${Date.now()}`,
            name: cleanName,
            phone: phone.trim(),
            address: address.trim()
          },
          ...prev
        ]);

        return inserted?.id || null;
      }
    } catch (err) {
      console.warn('Customer auto-persist note:', err);
      return null;
    }
  };

  // -------------------------------------------------------------
  // Standard Line Items Handlers
  // -------------------------------------------------------------
  const handleSelectStandardProduct = (prod: any, index: number) => {
    setStandardItems(prev => {
      const updated = [...prev];
      const price = Number(prod.retail_price || prod.sale_price || prod.sales_price || prod.mrp || prod.price || 0);
      const ratio = Number(prod.loose_conversion_ratio || prod.pieces_per_box || prod.pcs_per_box || 1);
      const allowLoose = Boolean(prod.allow_loose_sales || ratio > 1);

      const item: StandardItem = {
        ...updated[index],
        product_id: prod.id,
        product_name: prod.product_name,
        sku_code: prod.item_sr_no || `SKU-${prod.id}`,
        category: prod.category || '',
        uom: prod.uom || 'PCS',
        unit: prod.uom || 'PCS',
        rate: price,
        allow_loose_sales: allowLoose,
        loose_uom: prod.loose_uom || 'PCS',
        loose_conversion_ratio: ratio,
        current_stock: Number(prod.current_stock || 0),
        bulk_qty: 1,
        loose_qty: 0,
        qty: 1,
      };

      const gross = item.qty * item.rate;
      item.discount_amount = (gross * (item.discount_percent || 0)) / 100;
      item.amount = Math.max(0, gross - item.discount_amount);

      updated[index] = item;
      return updated;
    });
    setActiveProdIndex(null);
  };

  const handleStandardItemChange = (index: number, field: keyof StandardItem, value: any) => {
    setStandardItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === 'bulk_qty' || field === 'loose_qty') {
        const ratio = Math.max(1, Number(item.loose_conversion_ratio || 1));
        const bulk = Math.max(0, Number(field === 'bulk_qty' ? value : item.bulk_qty) || 0);
        const loose = Math.max(0, Number(field === 'loose_qty' ? value : item.loose_qty) || 0);
        const total = Number((bulk + loose / ratio).toFixed(3));
        item.qty = total;
      } else if (field === 'qty') {
        const numQty = Math.max(0, Number(value) || 0);
        item.qty = numQty;
        if (item.allow_loose_sales && item.loose_conversion_ratio > 1) {
          const ratio = item.loose_conversion_ratio;
          item.bulk_qty = Math.floor(numQty);
          item.loose_qty = Math.round((numQty - item.bulk_qty) * ratio);
        }
      }

      const qty = Number(item.qty || 0);
      const rate = Number(item.rate || 0);
      const gross = qty * rate;

      if (field === 'discount_percent') {
        const perc = Number(value || 0);
        item.discount_amount = (gross * perc) / 100;
      } else if (field === 'discount_amount') {
        const amt = Number(value || 0);
        item.discount_percent = gross > 0 ? (amt / gross) * 100 : 0;
      } else {
        item.discount_amount = (gross * Number(item.discount_percent || 0)) / 100;
      }

      item.amount = Math.max(0, gross - Number(item.discount_amount || 0));
      updated[index] = item;
      return updated;
    });
  };

  const handleAddStandardItem = () => {
    setStandardItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        product_name: '',
        uom: 'PCS',
        unit: 'PCS',
        qty: 1,
        bulk_qty: 1,
        loose_qty: 0,
        allow_loose_sales: false,
        loose_uom: 'PCS',
        loose_conversion_ratio: 1,
        rate: 0,
        discount_percent: 0,
        discount_amount: 0,
        amount: 0,
        notes: '',
        is_tile: false,
      }
    ]);
  };

  const handleRemoveStandardItem = (index: number) => {
    if (standardItems.length === 1 && tileItems.length === 0) {
      toast.error('Quotation must contain at least 1 line item.');
      return;
    }
    setStandardItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // -------------------------------------------------------------
  // Dedicated Tile Line Items Handlers
  // -------------------------------------------------------------
  const handleSelectTileProduct = (prod: any, index: number) => {
    setTileItems(prev => {
      const updated = [...prev];
      const pcsPerBox = Math.max(1, Number(prod.pieces_per_box || prod.pcs_per_box || 4));
      const sqmPerBox = Math.max(0.01, Number(prod.sqm_per_box || (pcsPerBox * 0.36) || 1.44));
      const ratePerBox = Number(prod.retail_price || prod.sale_price || prod.sales_price || prod.mrp || prod.price || 0);
      const ratePerSqm = sqmPerBox > 0 ? Number((ratePerBox / sqmPerBox).toFixed(2)) : 0;
      const ratePerPiece = pcsPerBox > 0 ? Number((ratePerBox / pcsPerBox).toFixed(2)) : 0;

      const boxQty = 1;
      const loosePcs = 0;
      const totalSqm = Number(((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2));
      const lineGross = (boxQty * ratePerBox) + (loosePcs * ratePerPiece);

      const tileItem: TileItem = {
        id: updated[index]?.id || `tile-${Date.now()}-${index}`,
        product_id: prod.id,
        product_name: prod.product_name,
        sku_code: prod.item_sr_no || `SKU-${prod.id}`,
        category: prod.category || '',
        sub_category: prod.sub_category || '',
        box_qty: boxQty,
        loose_pcs: loosePcs,
        total_sqm: totalSqm,
        sqm_per_box: sqmPerBox,
        pcs_per_box: pcsPerBox,
        rate_per_box: ratePerBox,
        rate_per_sqm: ratePerSqm,
        rate_per_piece: ratePerPiece,
        discount_percent: 0,
        discount_amount: 0,
        amount: lineGross,
        notes: '',
        current_stock: Number(prod.current_stock || 0),
        is_tile: true
      };

      updated[index] = tileItem;
      return updated;
    });
    setActiveTileProdIndex(null);
  };

  const updateTileRowCalcs = (
    field: 'box_qty' | 'loose_pcs' | 'rate_per_box' | 'rate_per_sqm' | 'rate_per_piece' | 'discount_percent',
    val: number,
    tIdx: number
  ) => {
    setTileItems(prev => {
      const updated = [...prev];
      const item = { ...updated[tIdx] };

      const pcsPerBox = Math.max(1, Number(item.pcs_per_box) || 4);
      const sqmPerBox = Math.max(0.01, Number(item.sqm_per_box) || 1.44);

      let boxQty = Number(field === 'box_qty' ? val : item.box_qty || 0);
      let loosePcs = Number(field === 'loose_pcs' ? val : item.loose_pcs || 0);
      let rBox = Number(field === 'rate_per_box' ? val : item.rate_per_box || 0);
      let rSqm = Number(field === 'rate_per_sqm' ? val : item.rate_per_sqm || 0);
      let rPiece = Number(field === 'rate_per_piece' ? val : item.rate_per_piece || 0);
      let disc = Number(field === 'discount_percent' ? val : item.discount_percent || 0);

      if (field === 'rate_per_box') {
        rBox = val;
        rSqm = Number((val / sqmPerBox).toFixed(2));
        rPiece = Number((val / pcsPerBox).toFixed(2));
      } else if (field === 'rate_per_sqm') {
        rSqm = val;
        rBox = Number((val * sqmPerBox).toFixed(2));
        rPiece = Number((rBox / pcsPerBox).toFixed(2));
      } else if (field === 'rate_per_piece') {
        rPiece = val;
        rBox = Number((val * pcsPerBox).toFixed(2));
        rSqm = Number((rBox / sqmPerBox).toFixed(2));
      }

      const totalSqm = Number(((boxQty * sqmPerBox) + ((loosePcs / pcsPerBox) * sqmPerBox)).toFixed(2));
      const lineGross = (boxQty * rBox) + (loosePcs * rPiece);
      const discAmt = (lineGross * disc) / 100;
      const amount = Math.max(0, lineGross - discAmt);

      item.box_qty = boxQty;
      item.loose_pcs = loosePcs;
      item.total_sqm = totalSqm;
      item.rate_per_box = rBox;
      item.rate_per_sqm = rSqm;
      item.rate_per_piece = rPiece;
      item.discount_percent = disc;
      item.discount_amount = discAmt;
      item.amount = amount;

      updated[tIdx] = item;
      return updated;
    });
  };

  const handleAppendTileRow = () => {
    setTileItems(prev => [
      ...prev,
      {
        id: `tile-${Date.now()}-${prev.length + 1}`,
        product_name: '',
        box_qty: 1,
        loose_pcs: 0,
        total_sqm: 1.44,
        sqm_per_box: 1.44,
        pcs_per_box: 4,
        rate_per_box: 0,
        rate_per_sqm: 0,
        rate_per_piece: 0,
        discount_percent: 0,
        discount_amount: 0,
        amount: 0,
        notes: '',
        is_tile: true
      }
    ]);
  };

  const handleRemoveTileItem = (index: number) => {
    setTileItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Filtered product lists for dropdowns
  const nonTileProducts = useMemo(() => {
    return productsCatalog.filter(p => !isTileProduct(p));
  }, [productsCatalog]);

  const tileProducts = useMemo(() => {
    return productsCatalog.filter(p => isTileProduct(p));
  }, [productsCatalog]);

  // Combined totals
  const standardSubtotal = standardItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.rate || 0)), 0);
  const standardDiscount = standardItems.reduce((sum, item) => sum + Number(item.discount_amount || 0), 0);

  const tileSubtotal = tileItems.reduce((sum, item) => sum + ((Number(item.box_qty || 0) * Number(item.rate_per_box || 0)) + (Number(item.loose_pcs || 0) * Number(item.rate_per_piece || 0))), 0);
  const tileDiscount = tileItems.reduce((sum, item) => sum + Number(item.discount_amount || 0), 0);
  const tileTotalAmount = tileItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalTileBoxes = tileItems.reduce((sum, item) => sum + Number(item.box_qty || 0), 0);
  const totalTilePcs = tileItems.reduce((sum, item) => sum + Number(item.loose_pcs || 0), 0);
  const totalTileSqm = tileItems.reduce((sum, item) => sum + Number(item.total_sqm || 0), 0);

  const subtotal = standardSubtotal + tileSubtotal;
  const totalDiscount = standardDiscount + tileDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  // Form submission
  const handleSubmit = async (actionAfterSave: 'list' | 'print' | 'whatsapp') => {
    if (!customerName.trim()) {
      toast.error('Please enter or select a Customer name');
      return;
    }

    const allQuotationItems: any[] = [];

    // Validate standard items
    const validStandard = standardItems.filter(it => it.product_name.trim());
    validStandard.forEach(it => {
      allQuotationItems.push({
        id: it.id,
        product_id: it.product_id,
        product_name: it.product_name,
        sku_code: it.sku_code,
        category: it.category,
        unit: it.uom,
        uom: it.uom,
        qty: it.qty,
        bulk_qty: it.bulk_qty,
        loose_qty: it.loose_qty,
        allow_loose_sales: it.allow_loose_sales,
        loose_uom: it.loose_uom,
        loose_conversion_ratio: it.loose_conversion_ratio,
        rate: it.rate,
        discount_percent: it.discount_percent,
        discount_amount: it.discount_amount,
        amount: it.amount,
        notes: it.notes,
        is_tile: false,
      });
    });

    // Validate tile items
    const validTiles = tileItems.filter(it => it.product_name.trim());
    validTiles.forEach(it => {
      allQuotationItems.push({
        id: it.id,
        product_id: it.product_id,
        product_name: it.product_name,
        sku_code: it.sku_code,
        category: it.category,
        sub_category: it.sub_category,
        unit: 'Boxes',
        uom: 'Boxes',
        qty: it.box_qty + (it.loose_pcs / (it.pcs_per_box || 4)),
        box_qty: it.box_qty,
        loose_pcs: it.loose_pcs,
        total_sqm: it.total_sqm,
        sqm_per_box: it.sqm_per_box,
        pcs_per_box: it.pcs_per_box,
        rate: it.rate_per_box,
        rate_per_box: it.rate_per_box,
        rate_per_sqm: it.rate_per_sqm,
        rate_per_piece: it.rate_per_piece,
        discount_percent: it.discount_percent,
        discount_amount: it.discount_amount,
        amount: it.amount,
        notes: it.notes,
        is_tile: true,
      });
    });

    if (allQuotationItems.length === 0) {
      toast.error('Please enter at least 1 valid product item in your quotation');
      return;
    }

    try {
      setLoading(true);

      // Auto-save customer phone and address into customers table
      await syncCustomerToDatabase(customerName, customerPhone, customerAddress);

      const payload: any = {
        tenant_id: tenantId || null,
        quotation_number: quoteNo,
        quote_no: quoteNo,
        customer: customerName.trim(),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: customerAddress.trim(),
        date: quoteDate,
        valid_until: validUntil,
        salesman_name: salesmanName.trim(),
        amount: grandTotal,
        total_amount: grandTotal,
        status: status,
        items: allQuotationItems,
        notes: notes.trim(),
      };

      let savedId = id;

      if (isEditMode) {
        try {
          await supabase
            .from('crm_quotations')
            .update(payload)
            .eq('id', id);
        } catch (_) {}

        try {
          const cached = JSON.parse(localStorage.getItem('zac_quotations_records') || '[]');
          const updated = cached.map((q: any) => String(q.id) === String(id) ? { ...q, ...payload } : q);
          localStorage.setItem('zac_quotations_records', JSON.stringify(updated));
        } catch (_) {}

        toast.success('Quotation updated successfully!');
      } else {
        let cloudId = null;
        try {
          const { data, error } = await supabase
            .from('crm_quotations')
            .insert([payload])
            .select('id')
            .single();

          if (!error && data?.id) {
            cloudId = data.id;
          }
        } catch (_) {}

        savedId = cloudId || `LOCAL-${Date.now()}`;
        payload.id = savedId;

        try {
          const cached = JSON.parse(localStorage.getItem('zac_quotations_records') || '[]');
          localStorage.setItem('zac_quotations_records', JSON.stringify([payload, ...cached]));
        } catch (_) {}

        toast.success('Quotation generated successfully!');
      }

      if (actionAfterSave === 'print' && savedId) {
        navigate(`${tenantId ? `/${tenantId}` : ''}/crm/quotations/print/${savedId}`);
      } else if (actionAfterSave === 'whatsapp') {
        const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
        const companyLabel = businessName || 'our company';
        const greeting = `Hello *${customerName}*,\n\nHere is your official Price Quotation from *${companyLabel}*:\n\n` +
          `📄 *Quotation No:* ${quoteNo}\n` +
          `📅 *Date:* ${quoteDate}\n` +
          `⏳ *Valid Until:* ${validUntil}\n` +
          `💰 *Total Amount:* PKR ${grandTotal.toLocaleString()}\n\n` +
          `*Items Summary:*\n` +
          allQuotationItems.map((it, idx) => {
            if (it.is_tile) {
              return `${idx + 1}. ${it.product_name} - ${it.box_qty} Bxs + ${it.loose_pcs} Pcs (${it.total_sqm} m²) @ PKR ${Number(it.rate_per_box).toLocaleString()}/bx = PKR ${Number(it.amount).toLocaleString()}`;
            }
            return `${idx + 1}. ${it.product_name} - ${it.qty} ${it.uom || 'units'} @ PKR ${Number(it.rate).toLocaleString()} = PKR ${Number(it.amount).toLocaleString()}`;
          }).join('\n') +
          `\n\nThank you for considering us!`;

        const encoded = encodeURIComponent(greeting);
        const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
        window.open(url, '_blank');
        navigate(`${tenantId ? `/${tenantId}` : ''}/crm/quotations`);
      } else {
        navigate(`${tenantId ? `/${tenantId}` : ''}/crm/quotations`);
      }
    } catch (err: any) {
      console.error('Error saving quotation:', err);
      toast.error(err.message || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spinner size="w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 space-y-6">
      <Breadcrumb
        pageName={isEditMode ? `Edit Quotation (${quoteNo})` : 'New Price Quotation'}
      />

      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-boxdark p-5 rounded-2xl border border-stroke dark:border-strokedark shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/crm/quotations`)}
            className="p-2.5 rounded-xl border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer text-gray-600 dark:text-gray-300"
          >
            <MdArrowBack size={18} />
          </button>
          <div>
            <h2 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
              <MdReceipt className="text-emerald-600" />
              <span>{isEditMode ? 'Modify Quotation' : 'Create Customer Quotation'}</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Draft formal price estimates, auto-save customer contacts, and quote general or tile products.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Header Information Section */}
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-xs p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary,#800020)] dark:text-rose-400 flex items-center gap-1.5 pb-2 border-b border-stroke dark:border-strokedark">
          <MdPerson /> 1. Customer &amp; Quotation Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Row 1, Col 1: Quotation # */}
          <div>
            <div className="h-6 flex items-center mb-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Quotation # <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="text"
              required
              value={quoteNo}
              onChange={e => setQuoteNo(e.target.value)}
              placeholder="e.g. QT-2026-001"
              className="w-full h-10.5 text-xs font-bold font-mono px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden shadow-2xs transition"
            />
          </div>

          {/* Row 1, Col 2: Quotation Date */}
          <div>
            <div className="h-6 flex items-center mb-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Quotation Date
              </label>
            </div>
            <input
              type="date"
              value={quoteDate}
              onChange={e => setQuoteDate(e.target.value)}
              className="w-full h-10.5 text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden shadow-2xs transition font-semibold"
            />
          </div>

          {/* Row 1, Col 3: Valid Until */}
          <div>
            <div className="h-6 flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Valid Until
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setValidityDays(7)}
                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-meta-4 hover:bg-[var(--color-primary,#800020)]/10 hover:text-[var(--color-primary,#800020)] text-gray-600 dark:text-gray-300 font-semibold cursor-pointer transition text-[10px]"
                >
                  +7d
                </button>
                <button
                  type="button"
                  onClick={() => setValidityDays(15)}
                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-meta-4 hover:bg-[var(--color-primary,#800020)]/10 hover:text-[var(--color-primary,#800020)] text-gray-600 dark:text-gray-300 font-semibold cursor-pointer transition text-[10px]"
                >
                  +15d
                </button>
                <button
                  type="button"
                  onClick={() => setValidityDays(30)}
                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-meta-4 hover:bg-[var(--color-primary,#800020)]/10 hover:text-[var(--color-primary,#800020)] text-gray-600 dark:text-gray-300 font-semibold cursor-pointer transition text-[10px]"
                >
                  +30d
                </button>
              </div>
            </div>
            <input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="w-full h-10.5 text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden font-semibold shadow-2xs transition"
            />
          </div>

          {/* Row 2, Col 1: Customer Name / Business */}
          <div>
            <div className="h-6 flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Customer Name / Business <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                (Type name to select or auto-add)
              </span>
            </div>
            <CustomerCombobox
              customers={customerDirectory}
              value={customerName}
              onChange={name => setCustomerName(name)}
              onSelectCustomer={handleCustomerSelect}
              placeholder="Search or enter customer name..."
            />
          </div>

          {/* Row 2, Col 2: Contact Phone (WhatsApp) */}
          <div>
            <div className="h-6 flex items-center mb-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Contact Phone (WhatsApp)
              </label>
            </div>
            <input
              type="text"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              onBlur={() => {
                if (customerName.trim() && customerPhone.trim()) {
                  syncCustomerToDatabase(customerName, customerPhone, customerAddress);
                }
              }}
              placeholder="e.g. 03001234567"
              className="w-full h-10.5 text-xs px-3 py-2.5 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-hidden shadow-2xs transition"
            />
          </div>

          {/* Row 2, Col 3: Salesman / Assigned To */}
          <div>
            <div className="h-6 flex items-center mb-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Salesman / Assigned To
              </label>
            </div>
            <SalesmanCombobox
              salesmen={salesmenList}
              value={salesmanName}
              onChange={val => setSalesmanName(val)}
              placeholder="Search or select salesman..."
            />
          </div>
        </div>
      </div>

      {/* Action Toggles Bar: Discounts & Tile Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark rounded-2xl">
        <div className="flex items-center gap-3">
          {/* Discounts Pill Selector */}
          <button
            type="button"
            onClick={() => setShowDiscount(prev => !prev)}
            className={`cursor-pointer px-3.5 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center gap-1.5 border shadow-2xs ${
              showDiscount
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                : 'bg-white text-slate-600 border-stroke dark:bg-boxdark dark:text-slate-300 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4'
            }`}
          >
            <span>{showDiscount ? '✓ Discounts' : '+ Discounts'}</span>
          </button>

          {/* Tile Quotation Pill Selector */}
          <button
            type="button"
            onClick={() => {
              setShowTileSection(prev => {
                const next = !prev;
                if (next && tileItems.length === 0) {
                  handleAppendTileRow();
                }
                return next;
              });
            }}
            className={`cursor-pointer px-3.5 py-1.5 text-xs font-bold rounded-full transition select-none flex items-center gap-1.5 border shadow-2xs ${
              showTileSection
                ? 'bg-[var(--color-primary,#800020)] text-white border-[var(--color-primary,#800020)]'
                : 'bg-white text-slate-700 border-stroke dark:bg-boxdark dark:text-slate-200 dark:border-strokedark hover:border-[var(--color-primary,#800020)]/50 hover:text-[var(--color-primary,#800020)]'
            }`}
          >
            <span>{showTileSection ? '✓ Tiles Enabled' : '+ Add Tile Quotation'}</span>
          </button>
        </div>
      </div>

      {/* 3. Dedicated Tile Container (Themed with Current Site Primary Color) */}
      {showTileSection && (
        <div className="border border-[var(--color-primary,#800020)]/25 dark:border-[var(--color-primary,#800020)]/40 bg-[var(--color-primary,#800020)]/[0.03] dark:bg-[var(--color-primary,#800020)]/[0.08] rounded-2xl p-5 space-y-4">
          {/* Tile Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-primary,#800020)]/20">
            <div className="flex items-center gap-2">
              <span className="bg-[var(--color-primary,#800020)] text-white font-black text-[10px] tracking-wider px-2 py-0.5 rounded shadow-2xs uppercase">
                TILES
              </span>
              <span className="font-bold text-xs text-[var(--color-primary,#800020)] dark:text-rose-300">
                Tile Quotations (Boxes, Loose Pieces &amp; Sq. Mtr Quoted)
              </span>
            </div>

            {/* Tile Summary Pill */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold text-[var(--color-primary,#800020)] dark:text-rose-200 bg-[var(--color-primary,#800020)]/10 dark:bg-[var(--color-primary,#800020)]/20 px-3 py-1 rounded-xl border border-[var(--color-primary,#800020)]/20">
                <span>Boxes: <strong>{totalTileBoxes}</strong></span>
                <span className="opacity-40">|</span>
                <span>Pcs: <strong>{totalTilePcs}</strong></span>
                <span className="opacity-40">|</span>
                <span>Total Sq.M: <strong>{totalTileSqm.toFixed(2)} m²</strong></span>
                <span className="opacity-40">|</span>
                <span className="text-[var(--color-primary,#800020)] dark:text-rose-300">Total Tiles: PKR {tileTotalAmount.toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTileSection(false)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer border bg-white dark:bg-boxdark text-[var(--color-primary,#800020)] dark:text-rose-300 border-[var(--color-primary,#800020)]/30 hover:bg-[var(--color-primary,#800020)]/10 shadow-2xs"
              >
                <span>Hide Tile Section</span>
              </button>
            </div>
          </div>

          <div className="overflow-visible">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[var(--color-primary,#800020)]/10 dark:bg-[var(--color-primary,#800020)]/25 text-[var(--color-primary,#800020)] dark:text-rose-200 font-bold">
                  <th className="p-2 w-8 text-center">S#</th>
                  <th className="p-2 min-w-[170px]">Tile Code / Description</th>
                  <th className="p-2 w-18 min-w-[60px] text-center">Boxes</th>
                  <th className="p-2 w-18 min-w-[60px] text-center">Loose Pcs</th>
                  <th className="p-2 w-20 min-w-[70px] text-center">Total Sq.M</th>
                  <th className="p-2 w-24 min-w-[85px] text-right">Rate (Box)</th>
                  <th className="p-2 w-24 min-w-[85px] text-right">Rate (Sq.M)</th>
                  <th className="p-2 w-22 min-w-[80px] text-right">Rate (Per Pc)</th>
                  {showDiscount && <th className="p-2 w-16 min-w-[55px] text-right text-amber-700 dark:text-amber-400">Disc %</th>}
                  <th className="p-2 w-24 min-w-[95px] text-right">Line Total</th>
                  <th className="p-2 w-8 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-primary,#800020)]/15 dark:divide-[var(--color-primary,#800020)]/25">
                {tileItems.map((tItem, tIdx) => {
                  const isTileActive = activeTileProdIndex === tIdx;
                  const query = String(tItem.product_name || '').toLowerCase().trim();

                  const filteredTileProds = tileProducts.filter(p => {
                    if (!query) return true;
                    const name = String(p.product_name || '').toLowerCase();
                    const sku = String(p.item_sr_no || '').toLowerCase();
                    const cat = String(p.category || '').toLowerCase();
                    return name.includes(query) || sku.includes(query) || cat.includes(query);
                  });

                  return (
                    <tr key={tItem.id} className={`hover:bg-[var(--color-primary,#800020)]/[0.04] dark:hover:bg-[var(--color-primary,#800020)]/[0.1] ${isTileActive ? 'relative z-50' : ''}`}>
                      <td className="p-2 text-center font-bold text-[var(--color-primary,#800020)]/70 dark:text-rose-300">
                        {tIdx + 1}
                      </td>

                      {/* Merged Tile Code / Description Searchable Autocomplete */}
                      <td className={`p-2 relative tile-dropdown-container ${isTileActive ? 'z-50' : ''}`}>
                        <div className="relative">
                          <input
                            type="text"
                            value={tItem.product_name}
                            onFocus={() => {
                              setActiveTileProdIndex(tIdx);
                              setHighlightedTileProdIndex(0);
                            }}
                            onChange={e => {
                              const typed = e.target.value;
                              setTileItems(prev => {
                                const up = [...prev];
                                up[tIdx] = { ...up[tIdx], product_name: typed };
                                return up;
                              });
                              setActiveTileProdIndex(tIdx);
                              setHighlightedTileProdIndex(0);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setHighlightedTileProdIndex(prev => prev < filteredTileProds.length - 1 ? prev + 1 : 0);
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setHighlightedTileProdIndex(prev => prev > 0 ? prev - 1 : filteredTileProds.length - 1);
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (filteredTileProds[highlightedTileProdIndex]) {
                                  handleSelectTileProduct(filteredTileProds[highlightedTileProdIndex], tIdx);
                                }
                              } else if (e.key === 'Escape') {
                                setActiveTileProdIndex(null);
                              }
                            }}
                            placeholder="Search by code or tile description..."
                            className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden"
                          />

                          {isTileActive && filteredTileProds.length > 0 && (
                            <div className="absolute left-0 top-full mt-1 z-99999 w-full min-w-[340px] max-w-[460px] max-h-60 overflow-y-auto rounded-xl border border-[var(--color-primary,#800020)]/30 dark:border-[var(--color-primary,#800020)]/50 bg-white dark:bg-boxdark shadow-2xl divide-y divide-stroke dark:divide-strokedark ring-1 ring-black/10">
                              {filteredTileProds.map((p, pIdx) => {
                                const price = Number(p.retail_price || p.sale_price || p.sales_price || p.mrp || p.price || 0);
                                const isHighlighted = highlightedTileProdIndex === pIdx;
                                const pcsBox = p.pieces_per_box || p.pcs_per_box || 4;

                                return (
                                  <div
                                    key={p.id}
                                    onMouseDown={e => {
                                      e.preventDefault();
                                      handleSelectTileProduct(p, tIdx);
                                    }}
                                    onMouseEnter={() => setHighlightedTileProdIndex(pIdx)}
                                    className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                      isHighlighted
                                        ? 'bg-[var(--color-primary,#800020)]/10 text-[var(--color-primary,#800020)] dark:text-rose-200 font-bold'
                                        : 'hover:bg-gray-50 dark:hover:bg-meta-4/20 text-gray-700 dark:text-gray-200'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        {p.item_sr_no && (
                                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-meta-4 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-strokedark shrink-0">
                                            {p.item_sr_no}
                                          </span>
                                        )}
                                        <span className="font-bold truncate">{p.product_name}</span>
                                        {p.category && (
                                          <span className="text-[10px] bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 px-1.5 py-0.2 rounded font-normal">
                                            {p.category}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                        <span>Code: {p.item_sr_no || `SKU-${p.id}`}</span>
                                        <span className="text-[var(--color-primary,#800020)] dark:text-rose-300 font-semibold">{pcsBox} pcs/box</span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-mono font-bold text-[var(--color-primary,#800020)] dark:text-rose-300 block">
                                        PKR {price.toLocaleString()} / box
                                      </span>
                                      <span className="text-[10px] text-gray-400">
                                        Stock: {p.current_stock || 0} Boxes
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {tItem.sku_code && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                            <span className="font-bold text-gray-600 dark:text-gray-300">Code: {tItem.sku_code}</span>
                            {tItem.category && <span>• {tItem.category}</span>}
                          </div>
                        )}
                      </td>

                      {/* Quoted Boxes */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={tItem.box_qty}
                          onChange={e => updateTileRowCalcs('box_qty', Math.max(0, Number(e.target.value) || 0), tIdx)}
                          className="w-full text-center font-bold text-xs px-1.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* Loose Pieces */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={tItem.loose_pcs}
                          onChange={e => updateTileRowCalcs('loose_pcs', Math.max(0, Number(e.target.value) || 0), tIdx)}
                          className="w-full text-center font-bold text-xs px-1.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* Total Sq.M */}
                      <td className="p-2 text-center font-mono font-bold text-[var(--color-primary,#800020)] dark:text-rose-200 whitespace-nowrap">
                        {tItem.total_sqm} m²
                      </td>

                      {/* Rate Per Box */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={tItem.rate_per_box}
                          onChange={e => updateTileRowCalcs('rate_per_box', Math.max(0, Number(e.target.value) || 0), tIdx)}
                          className="w-full text-right font-bold text-xs px-1.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* Rate Per Sq.M */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={tItem.rate_per_sqm}
                          onChange={e => updateTileRowCalcs('rate_per_sqm', Math.max(0, Number(e.target.value) || 0), tIdx)}
                          className="w-full text-right font-bold text-xs px-1.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* Rate Per Pc */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={tItem.rate_per_piece}
                          onChange={e => updateTileRowCalcs('rate_per_piece', Math.max(0, Number(e.target.value) || 0), tIdx)}
                          className="w-full text-right font-bold text-xs px-1.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* Disc % */}
                      {showDiscount && (
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={tItem.discount_percent}
                            onChange={e => updateTileRowCalcs('discount_percent', Math.max(0, Number(e.target.value) || 0), tIdx)}
                            className="w-full text-right font-mono text-xs px-1.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-[var(--color-primary,#800020)] focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      )}

                      {/* Line Total */}
                      <td className="p-2 text-right font-black font-mono text-[var(--color-primary,#800020)] dark:text-rose-200 whitespace-nowrap">
                        PKR {tItem.amount.toLocaleString()}
                      </td>

                      {/* Delete */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTileItem(tIdx)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="Remove Tile Row"
                        >
                          <MdDeleteOutline size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {tileItems.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-4 text-center text-xs text-[var(--color-primary,#800020)]/70 dark:text-rose-300 italic">
                      No tile products added. Click &quot;Append Tile Row&quot; below to add tile specifications.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Append Tile Row Button & Specification Helper */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleAppendTileRow}
              className="inline-flex items-center gap-1.5 bg-[var(--color-primary,#800020)] hover:opacity-90 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              <MdAdd size={16} />
              <span>Append Tile Row</span>
            </button>
            <span className="text-[11px] text-amber-800/80 dark:text-amber-400/80 italic">
              * Cross-calculates boxes, loose pieces &amp; sq.m automatically with your tile box specifications
            </span>
          </div>
        </div>
      )}

      {/* 2. Standard Quoted Items & Pricing */}
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stroke dark:border-strokedark">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary,#800020)] dark:text-rose-400 flex items-center gap-1.5">
              <MdInventory2 /> 2. Quoted Items &amp; Pricing
            </h3>
            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500">
              ({standardItems.length} {standardItems.length === 1 ? 'item' : 'items'})
            </span>
          </div>
        </div>

        <div className="overflow-visible">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-meta-4/40 text-gray-700 dark:text-gray-300 font-bold">
                <th className="p-2.5 w-10 text-center">#</th>
                <th className="p-2.5 min-w-[260px]">Product Code / Description</th>
                <th className="p-2.5 min-w-[90px] text-center">UOM</th>
                <th className="p-2.5 min-w-[140px] text-center">Quantity</th>
                <th className="p-2.5 min-w-[130px] text-right">Rate (PKR)</th>
                {showDiscount && <th className="p-2.5 min-w-[90px] text-right text-amber-700 dark:text-amber-400">Disc %</th>}
                <th className="p-2.5 min-w-[140px] text-right">Total (PKR)</th>
                <th className="p-2.5 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {standardItems.map((item, idx) => {
                const isCurrentActive = activeProdIndex === idx;
                const query = String(item.product_name || '').toLowerCase().trim();

                const filteredProducts = nonTileProducts.filter(p => {
                  if (!query) return true;
                  const name = String(p.product_name || '').toLowerCase();
                  const sku = String(p.item_sr_no || '').toLowerCase();
                  const cat = String(p.category || '').toLowerCase();
                  return name.includes(query) || sku.includes(query) || cat.includes(query);
                });

                return (
                  <tr key={item.id} className={`hover:bg-gray-50/50 dark:hover:bg-meta-4/10 ${isCurrentActive ? 'relative z-50' : ''}`}>
                    <td className="p-2.5 text-center font-bold text-gray-400">{idx + 1}</td>

                    {/* Product Code / Description Searchable Autocomplete */}
                    <td className={`p-2.5 relative prod-dropdown-container ${isCurrentActive ? 'z-50' : ''}`}>
                      <div className="relative">
                        <input
                          type="text"
                          value={item.product_name}
                          onFocus={() => {
                            setActiveProdIndex(idx);
                            setHighlightedProdIndex(0);
                          }}
                          onChange={e => {
                            handleStandardItemChange(idx, 'product_name', e.target.value);
                            setActiveProdIndex(idx);
                            setHighlightedProdIndex(0);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedProdIndex(prev => prev < filteredProducts.length - 1 ? prev + 1 : 0);
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedProdIndex(prev => prev > 0 ? prev - 1 : filteredProducts.length - 1);
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              if (filteredProducts[highlightedProdIndex]) {
                                handleSelectStandardProduct(filteredProducts[highlightedProdIndex], idx);
                              }
                            } else if (e.key === 'Escape') {
                              setActiveProdIndex(null);
                            }
                          }}
                          placeholder="Search by code or product description..."
                          className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:border-emerald-500 focus:outline-hidden"
                        />

                        {isCurrentActive && filteredProducts.length > 0 && (
                          <div className="absolute left-0 top-full mt-1 z-99999 w-full min-w-[320px] max-w-[420px] max-h-56 overflow-y-auto rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-2xl divide-y divide-stroke dark:divide-strokedark ring-1 ring-black/10">
                            {filteredProducts.map((p, pIdx) => {
                              const price = Number(p.retail_price || p.sale_price || p.sales_price || p.mrp || p.price || 0);
                              const isHighlighted = highlightedProdIndex === pIdx;
                              const isLoose = Boolean(p.allow_loose_sales || (p.loose_conversion_ratio && p.loose_conversion_ratio > 1));

                              return (
                                <div
                                  key={p.id}
                                  onMouseDown={e => {
                                    e.preventDefault();
                                    handleSelectStandardProduct(p, idx);
                                  }}
                                  onMouseEnter={() => setHighlightedProdIndex(pIdx)}
                                  className={`p-2.5 cursor-pointer text-xs flex justify-between items-center transition ${
                                    isHighlighted
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-black dark:text-white font-bold'
                                      : 'hover:bg-gray-50 dark:hover:bg-meta-4/20 text-gray-700 dark:text-gray-200'
                                  }`}
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {p.item_sr_no && (
                                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-meta-4 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-strokedark shrink-0">
                                          {p.item_sr_no}
                                        </span>
                                      )}
                                      <span className="font-bold truncate">{p.product_name}</span>
                                      {p.category && (
                                        <span className="text-[10px] bg-gray-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300 px-1.5 py-0.2 rounded font-normal">
                                          {p.category}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                      <span>Code: {p.item_sr_no || `SKU-${p.id}`}</span>
                                      {isLoose && (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                          Loose Selling (1 {p.uom || 'Unit'} = {p.loose_conversion_ratio || 1} {p.loose_uom || 'Pcs'})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                      PKR {price.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      Stock: {p.current_stock || 0} {p.uom || 'Unit'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {item.sku_code && (
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                          <span className="font-bold text-gray-600 dark:text-gray-300">Code: {item.sku_code}</span>
                          {item.category && <span>• {item.category}</span>}
                        </div>
                      )}

                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={e => handleStandardItemChange(idx, 'notes', e.target.value)}
                        placeholder="Optional spec note (e.g. Master bath floor)"
                        className="w-full text-[11px] px-2 py-0.5 mt-1 rounded border border-transparent hover:border-stroke dark:hover:border-strokedark bg-transparent text-gray-500 italic focus:bg-white dark:focus:bg-boxdark focus:outline-hidden"
                      />
                    </td>

                    {/* UOM Column (Searchable & powered by active inventory UOMs) */}
                    <td className="p-2.5 text-center">
                      <UomCombobox
                        value={item.uom || item.unit || 'PCS'}
                        onChange={val => {
                          handleStandardItemChange(idx, 'uom', val);
                          handleStandardItemChange(idx, 'unit', val);
                        }}
                        activeUoms={activeUomsList}
                      />
                    </td>

                    {/* Quantity Column: Dual input for Allow Loose Selling items */}
                    <td className="p-2.5 min-w-[140px]">
                      {item.allow_loose_sales && item.loose_conversion_ratio > 1 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 justify-center">
                            {/* Bulk Input */}
                            <div className="flex items-center bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-md px-1.5 py-0.5 focus-within:border-primary shadow-xs">
                              <input
                                type="number"
                                min="0"
                                value={item.bulk_qty}
                                onChange={e => handleStandardItemChange(idx, 'bulk_qty', e.target.value)}
                                className="w-16 min-w-[50px] text-center font-bold text-xs bg-transparent text-black dark:text-white outline-hidden"
                              />
                              <span className="text-[10px] font-bold text-gray-500 pl-1 select-none">
                                {item.uom || 'DOZ'}
                              </span>
                            </div>

                            <span className="text-gray-400 font-black text-xs select-none">+</span>

                            {/* Loose Input */}
                            <div className="flex items-center bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-md px-1.5 py-0.5 focus-within:border-emerald-500 shadow-xs">
                              <input
                                type="number"
                                min="0"
                                max={item.loose_conversion_ratio - 1}
                                value={item.loose_qty}
                                onChange={e => handleStandardItemChange(idx, 'loose_qty', e.target.value)}
                                className="w-14 min-w-[45px] text-center font-bold text-xs bg-transparent text-emerald-600 dark:text-emerald-400 outline-hidden"
                              />
                              <span className="text-[10px] font-bold text-gray-500 pl-1 select-none">
                                {item.loose_uom || 'PCS'}
                              </span>
                            </div>
                          </div>

                          <div className="text-center font-mono text-[10px] text-gray-500 dark:text-gray-400">
                            Total: <strong>{item.qty}</strong> {item.uom} ({item.bulk_qty} {item.uom} + {item.loose_qty} {item.loose_uom})
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.qty}
                            onChange={e => handleStandardItemChange(idx, 'qty', e.target.value)}
                            className="w-full min-w-[90px] text-center font-bold text-xs px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:outline-hidden font-mono"
                          />
                        </div>
                      )}
                    </td>

                    {/* Rate */}
                    <td className="p-2.5 text-right min-w-[130px]">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={e => handleStandardItemChange(idx, 'rate', e.target.value)}
                        className="w-full min-w-[105px] text-xs text-right font-bold px-2.5 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:outline-hidden font-mono"
                      />
                    </td>

                    {/* Disc % */}
                    {showDiscount && (
                      <td className="p-2.5 text-right min-w-[90px]">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={item.discount_percent || 0}
                          onChange={e => handleStandardItemChange(idx, 'discount_percent', e.target.value)}
                          className="w-full min-w-[75px] text-xs text-right px-2 py-1.5 rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:outline-hidden font-mono"
                        />
                      </td>
                    )}

                    {/* Total */}
                    <td className="p-2.5 text-right font-black font-mono text-black dark:text-white min-w-[140px] whitespace-nowrap">
                      PKR {item.amount.toLocaleString()}
                    </td>

                    {/* Delete Action */}
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveStandardItem(idx)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        title="Remove Item"
                      >
                        <MdDeleteOutline size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Item Row Button (in same position as Append Tile Row) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleAddStandardItem}
            className="inline-flex items-center gap-1.5 bg-[var(--color-primary,#800020)] hover:opacity-90 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs transition cursor-pointer shadow-xs"
          >
            <MdAdd size={16} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* 4. Summary & Notes */}
      <div className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-xs p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <MdOutlineNotes />
              <span>Terms, Conditions &amp; Bank Transfer Details</span>
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-black dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="p-4 bg-gray-50 dark:bg-meta-4/20 rounded-2xl border border-stroke dark:border-strokedark space-y-2 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Standard Items Subtotal:</span>
              <span className="font-bold font-mono">PKR {standardSubtotal.toLocaleString()}</span>
            </div>

            {tileSubtotal > 0 && (
              <div className="flex justify-between text-amber-700 dark:text-amber-400">
                <span>Tile Items Subtotal:</span>
                <span className="font-bold font-mono">PKR {tileSubtotal.toLocaleString()}</span>
              </div>
            )}

            {totalDiscount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Total Discount:</span>
                <span className="font-bold font-mono">- PKR {totalDiscount.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t border-stroke dark:border-strokedark pt-2 flex justify-between text-base font-black text-black dark:text-white">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                PKR {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Submit Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`${tenantId ? `/${tenantId}` : ''}/crm/quotations`)}
            className="px-5 py-2.5 rounded-xl border border-stroke dark:border-strokedark text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('print')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <MdPrint size={16} />
            <span>Save &amp; Print</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('list')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary,#800020)] hover:opacity-90 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? <Spinner color="border-white" size="w-3.5 h-3.5" /> : <MdSave size={16} />}
            <span>{isEditMode ? 'Update Quotation' : 'Save Quotation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddQuotation;
