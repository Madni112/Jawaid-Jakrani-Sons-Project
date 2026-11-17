import { useState, useEffect } from 'react';
import { supabase } from '../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { fetchWorkflowSettings } from '../../../../service/workflowSettingsService';
import { fetchStockDataset, getTotalAvailableStock } from '../../../../utils/stockCalculator';

export const usePurchaseMetadata = (
  id?: string,
  locationState?: any,
  onApplyGrn?: (grn: any, prods: any[], locs: any[]) => void
) => {
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [productList, setProductList] = useState<any[]>([]);
  const [bankAccountsList, setBankAccountsList] = useState<any[]>([]);
  const [defaultPurchaseNo, setDefaultPurchaseNo] = useState('');
  const [stockDataset, setStockDataset] = useState<any>(null);
  const [totalStockMap, setTotalStockMap] = useState<Record<string, number>>({});
  const [workflowSettings, setWorkflowSettings] = useState<any>(null);
  const [pendingGrns, setPendingGrns] = useState<any[]>([]);
  const [fetchedRecord, setFetchedRecord] = useState<any | null>(null);
  const [importedGrnData, setImportedGrnData] = useState<any>(locationState?.importGrn || null);

  const editData = locationState?.purchaseRecord || fetchedRecord;
  const isEditMode = Boolean(id || locationState?.purchaseRecord);

  // Fetch purchase by ID if editing
  useEffect(() => {
    if (id && !locationState?.purchaseRecord) {
      const fetchPurchaseById = async () => {
        try {
          const { data, error } = await supabase
            .from('supplier_purchases')
            .select('*')
            .eq('id', id)
            .single();
          if (error) throw error;
          if (data) setFetchedRecord(data);
        } catch (err: any) {
          toast.error('Failed to load purchase record: ' + err.message);
        }
      };
      fetchPurchaseById();
    }
  }, [id, locationState]);

  // Load metadata
  useEffect(() => {
    const fetchPurchaseMetadata = async () => {
      try {
        setMetadataLoading(true);

        const [vendorRes, countRes, locRes, bankRes] = await Promise.all([
          supabase.from('vendors').select('*'),
          supabase.from('supplier_purchases').select('*', { count: 'exact', head: true }),
          supabase.from('inventory_locations').select('id, name').order('name', { ascending: true }),
          supabase.from('banks').select('id, bankName, accountTitle, accountNumber')
        ]);

        if (countRes.count !== null && countRes.count !== undefined) {
          setDefaultPurchaseNo(String((countRes.count || 0) + 1).padStart(2, '0'));
        }

        const normalizedVendors = (vendorRes.data || []).map((v: any) => ({
          id: v.id,
          vendor_name: v.vendor_name || v.name || 'Unnamed Vendor',
          contact_person: v.contact_person || v.contact || '',
          phone: v.phone || v.mobile || '',
          city: v.city || ''
        })).sort((a: any, b: any) => a.vendor_name.localeCompare(b.vendor_name));
        setSuppliers(normalizedVendors);

        const locData = locRes.data || [];
        if (locRes.data) setLocations(locRes.data);
        if (bankRes.data) setBankAccountsList(bankRes.data);

        let { data: prodData, error: prodErr } = await supabase.from('products').select(
          'id, product_name, purchase_price, uom, current_stock, item_sr_no, pieces_per_box, pcs_per_box, pieces_per_packing, category, sub_category, sub_sub_category, scenario_name, product_description, allow_loose_sales, loose_uom, loose_conversion_ratio, loose_sale_price, loose_purchase_price'
        );
        if (prodErr && (prodErr.message?.includes('allow_loose_sales') || prodErr.code === '42703')) {
          const fallbackRes = await supabase.from('products').select(
            'id, product_name, purchase_price, uom, current_stock, item_sr_no, pieces_per_box, pcs_per_box, pieces_per_packing, category, sub_category, sub_sub_category, scenario_name, product_description'
          );
          prodData = fallbackRes.data;
        }
        if (prodData) setProductList(prodData);

        fetchStockDataset().then(ds => {
          if (ds) setStockDataset(ds);
        }).catch(() => {});
        fetchWorkflowSettings().then(setWorkflowSettings).catch(() => {});

        try {
          const [receiptsRes, itemsRes] = await Promise.all([
            supabase.from('grn_receipts').select('*').in('status', ['Confirm', 'Partially Received']).order('created_at', { ascending: false }),
            supabase.from('grn_items').select('*')
          ]);
          const itemsByGrn: Record<string, any[]> = {};
          (itemsRes.data || []).forEach((it: any) => {
            const gId = String(it.grn_id || '');
            if (!itemsByGrn[gId]) itemsByGrn[gId] = [];
            itemsByGrn[gId].push(it);
          });
          const combinedGrns = (receiptsRes.data || []).map((g: any) => ({
            ...g,
            grn_items: itemsByGrn[String(g.id)] || []
          }));
          setPendingGrns(combinedGrns);

          const importId = locationState?.importGrnId;
          const passedGrn = locationState?.importGrn;
          let matchedGrn = (passedGrn && (!importId || passedGrn.id === importId))
            ? passedGrn
            : (importId ? combinedGrns.find((g: any) => g.id === importId) : null);

          if (!matchedGrn && importId) {
            try {
              const { data: directGrn } = await supabase.from('grn_receipts').select('*').eq('id', importId).single();
              if (directGrn) {
                const { data: directItems } = await supabase.from('grn_items').select('*').eq('grn_id', importId);
                matchedGrn = { ...directGrn, grn_items: directItems || [] };
              }
            } catch (fallbackErr) {
              console.warn('Fallback direct GRN fetch failed:', fallbackErr);
            }
          }

          if (matchedGrn) {
            if (!matchedGrn.grn_items || matchedGrn.grn_items.length === 0) {
              try {
                const { data: directItems } = await supabase.from('grn_items').select('*').eq('grn_id', matchedGrn.id);
                if (directItems && directItems.length > 0) {
                  matchedGrn = { ...matchedGrn, grn_items: directItems };
                }
              } catch (e) {
                console.warn('Could not fetch direct items for GRN:', e);
              }
            }
            setImportedGrnData(matchedGrn);
            if (onApplyGrn) {
              setTimeout(() => {
                onApplyGrn(matchedGrn, prodData || [], locData);
              }, 60);
            }
          }
        } catch (grnErr) {
          console.warn('Error fetching GRNs:', grnErr);
        }

      } catch (err: any) {
        toast.error('Failed to load system procurement metadata: ' + err.message);
      } finally {
        setMetadataLoading(false);
      }
    };
    fetchPurchaseMetadata();
  }, []);

  // Stock Map Calculation
  useEffect(() => {
    let isCancelled = false;
    const calculateStock = async () => {
      if (!productList || productList.length === 0) return;
      const map: Record<string, number> = {};
      if (stockDataset) {
        if (stockDataset.balancesMode && Array.isArray(stockDataset.balances)) {
          stockDataset.balances.forEach((r: any) => {
            const name = String(r.product_name || '').toLowerCase().trim();
            map[name] = (map[name] || 0) + (Number(r.quantity) || 0);
          });
        } else {
          for (const p of productList) {
            const name = (p.product_name || '').toLowerCase().trim();
            try {
              const val = await getTotalAvailableStock(p.product_name, stockDataset);
              map[name] = val;
            } catch {
              map[name] = Number(p.current_stock || 0);
            }
          }
        }
      }
      productList.forEach(p => {
        const name = (p.product_name || '').toLowerCase().trim();
        if (map[name] === undefined) {
          map[name] = Number(p.current_stock || 0);
        }
      });
      if (!isCancelled) {
        setTotalStockMap(map);
      }
    };
    calculateStock();
    return () => { isCancelled = true; };
  }, [stockDataset, productList]);

  return {
    loading,
    setLoading,
    metadataLoading,
    suppliers,
    locations,
    productList,
    bankAccountsList,
    defaultPurchaseNo,
    stockDataset,
    totalStockMap,
    workflowSettings,
    pendingGrns,
    editData,
    isEditMode,
    importedGrnData,
    setImportedGrnData
  };
};
