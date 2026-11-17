import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../../../components/Breadcrumbs/Breadcrumb';
import { supabase } from '../../../Context/supabaseClient';
import { useAuth } from '../../../Context/Auth';
import { CustomerComboboxItem } from '../../../components/CustomerCombobox';
import { fetchAllUomsSafe } from '../../../service/uomService';
import Spinner from '../../../ui/Spinner';
import { toast } from 'react-hot-toast';
import { MdArrowBack, MdReceipt } from 'react-icons/md';

// Extracted types & utilities
import { StandardItem, TileItem } from './types/quotationTypes';
import {
  isTileProduct,
  createBlankStandardItem,
  createBlankTileItem
} from './utils/quotationUtils';

// Extracted UI sections
import { QuotationHeaderDetails } from './components/QuotationHeaderDetails';
import { QuotationActionToolbar } from './components/QuotationActionToolbar';
import { QuotationTileSection } from './components/QuotationTileSection';
import { QuotationStandardSection } from './components/QuotationStandardSection';
import { QuotationSummaryFooter } from './components/QuotationSummaryFooter';

// Re-export for external consumers
export { isTileProduct };
export type { StandardItem, TileItem };

const AddQuotation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { tenantId, businessName } = useAuth();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Catalogs
  const [customerDirectory, setCustomerDirectory] = useState<CustomerComboboxItem[]>([]);
  const [productsCatalog, setProductsCatalog] = useState<any[]>([]);
  const [salesmenList, setSalesmenList] = useState<any[]>([]);

  // Form State
  const [quoteNo, setQuoteNo] = useState('');
  const [, setSelectedCustomerId] = useState<string | number>('');
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
  const [activeUomsList, setActiveUomsList] = useState<string[]>([
    'PCS', 'BOX', 'DOZ', 'MTR', 'KG', 'LTR', 'BAG', 'SQFT', 'SQM'
  ]);

  // Standard Items State
  const [standardItems, setStandardItems] = useState<StandardItem[]>([
    createBlankStandardItem(1)
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
          custData
            .filter(c => (c.customer_name || c.customername || '').trim().length > 0)
            .map(c => ({
              id: c.id,
              name: (c.customer_name || c.customername || '').trim(),
              phone: (c.phone || c.primaryphone || '').trim(),
              address: (c.address || c.city || '').trim()
            }))
        );
      }

      // 2. Fetch Products
      let { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('id, product_name, item_sr_no, category, sub_category, sub_sub_category, uom, retail_price, sale_price, sales_price, mrp, price, current_stock, allow_loose_sales, loose_uom, loose_conversion_ratio, pieces_per_box, pcs_per_box, sqm_per_box')
        .order('product_name');

      if (prodErr) {
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

  const syncCustomerToDatabase = async (name: string, phone: string, address: string) => {
    const cleanName = (name || '').trim();
    if (!cleanName) return null;

    try {
      const { data: existingList } = await supabase
        .from('customers')
        .select('id, customer_name, customername, phone, primaryphone, address, city, customer_code')
        .or(`customer_name.ilike."${cleanName}",customername.ilike."${cleanName}"`);

      const existing = existingList && existingList.length > 0 ? existingList[0] : null;

      if (existing) {
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

  // Standard Line Items Handlers
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
      createBlankStandardItem(prev.length + 1)
    ]);
  };

  const handleRemoveStandardItem = (index: number) => {
    if (standardItems.length === 1 && tileItems.length === 0) {
      toast.error('Quotation must contain at least 1 line item.');
      return;
    }
    setStandardItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Dedicated Tile Line Items Handlers
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
      createBlankTileItem(prev.length + 1)
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
      <QuotationHeaderDetails
        quoteNo={quoteNo}
        setQuoteNo={setQuoteNo}
        quoteDate={quoteDate}
        setQuoteDate={setQuoteDate}
        validUntil={validUntil}
        setValidUntil={setValidUntil}
        setValidityDays={setValidityDays}
        customerDirectory={customerDirectory}
        customerName={customerName}
        setCustomerName={setCustomerName}
        handleCustomerSelect={handleCustomerSelect}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        customerAddress={customerAddress}
        syncCustomerToDatabase={syncCustomerToDatabase}
        salesmenList={salesmenList}
        salesmanName={salesmanName}
        setSalesmanName={setSalesmanName}
      />

      {/* Action Toggles Bar: Discounts & Tile Selector */}
      <QuotationActionToolbar
        showDiscount={showDiscount}
        setShowDiscount={setShowDiscount}
        showTileSection={showTileSection}
        setShowTileSection={setShowTileSection}
        tileItemsCount={tileItems.length}
        onAppendTileRow={handleAppendTileRow}
      />

      {/* 3. Dedicated Tile Container */}
      {showTileSection && (
        <QuotationTileSection
          tileItems={tileItems}
          setTileItems={setTileItems}
          tileProducts={tileProducts}
          showDiscount={showDiscount}
          totalTileBoxes={totalTileBoxes}
          totalTilePcs={totalTilePcs}
          totalTileSqm={totalTileSqm}
          tileTotalAmount={tileTotalAmount}
          onHideSection={() => setShowTileSection(false)}
          handleAppendTileRow={handleAppendTileRow}
          handleRemoveTileItem={handleRemoveTileItem}
          handleSelectTileProduct={handleSelectTileProduct}
          updateTileRowCalcs={updateTileRowCalcs}
          activeTileProdIndex={activeTileProdIndex}
          setActiveTileProdIndex={setActiveTileProdIndex}
          highlightedTileProdIndex={highlightedTileProdIndex}
          setHighlightedTileProdIndex={setHighlightedTileProdIndex}
        />
      )}

      {/* 2. Standard Quoted Items & Pricing */}
      <QuotationStandardSection
        standardItems={standardItems}
        nonTileProducts={nonTileProducts}
        activeUomsList={activeUomsList}
        showDiscount={showDiscount}
        handleAddStandardItem={handleAddStandardItem}
        handleRemoveStandardItem={handleRemoveStandardItem}
        handleSelectStandardProduct={handleSelectStandardProduct}
        handleStandardItemChange={handleStandardItemChange}
        activeProdIndex={activeProdIndex}
        setActiveProdIndex={setActiveProdIndex}
        highlightedProdIndex={highlightedProdIndex}
        setHighlightedProdIndex={setHighlightedProdIndex}
      />

      {/* 4. Summary & Notes + Footer Actions */}
      <QuotationSummaryFooter
        notes={notes}
        setNotes={setNotes}
        standardSubtotal={standardSubtotal}
        tileSubtotal={tileSubtotal}
        totalDiscount={totalDiscount}
        grandTotal={grandTotal}
        loading={loading}
        isEditMode={isEditMode}
        onCancel={() => navigate(`${tenantId ? `/${tenantId}` : ''}/crm/quotations`)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AddQuotation;
