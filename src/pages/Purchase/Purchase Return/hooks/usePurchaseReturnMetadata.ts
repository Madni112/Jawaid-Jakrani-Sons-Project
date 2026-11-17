import { useState, useEffect } from 'react';
import { supabase } from '../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { fetchWorkflowSettings } from '../../../../service/workflowSettingsService';
import { fetchStockDataset, getTotalAvailableStock } from '../../../../utils/stockCalculator';

export const usePurchaseReturnMetadata = (
  editData: any,
  isEditMode: boolean
) => {
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const [vendors, setVendors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [productList, setProductList] = useState<any[]>([]);
  const [stockDataset, setStockDataset] = useState<any>(null);
  const [totalStockMap, setTotalStockMap] = useState<Record<string, number>>({});
  const [bankAccountsList, setBankAccountsList] = useState<any[]>([]);
  const [purchaseOrdersList, setPurchaseOrdersList] = useState<any[]>([]);
  const [pastPurchaseReturnsList, setPastPurchaseReturnsList] = useState<any[]>([]);
  const [workflowSettings, setWorkflowSettings] = useState<any>(null);

  // Autocomplete queries
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [poSearchQuery, setPoSearchQuery] = useState('');
  const [selectedPoNo, setSelectedPoNo] = useState('');
  const [selectedPoObj, setSelectedPoObj] = useState<any>(null);

  useEffect(() => {
    const fetchReturnMetadata = async () => {
      try {
        setMetadataLoading(true);
        fetchWorkflowSettings().then(setWorkflowSettings).catch(() => {});

        const [vRes, locRes, prodRes, bankRes, purRes, pastPrRes] = await Promise.all([
          supabase.from('vendors').select('*').order('vendor_name', { ascending: true }),
          supabase.from('inventory_locations').select('*').order('name', { ascending: true }),
          supabase.from('products').select('*').order('product_name', { ascending: true }),
          supabase.from('banks').select('id, bankName, accountTitle, accountNumber'),
          supabase.from('supplier_purchases').select('*').order('id', { ascending: false }),
          supabase.from('purchase_returns').select('id, return_no, vendor_name, purchase_no, items, metadata')
        ]);

        const normalizedVendors = (vRes.data || []).map((v: any) => ({
          id: v.id,
          vendor_name: v.vendor_name || v.name || 'Unnamed Vendor',
          contact_name: v.contact_name || v.contact_person || '',
          phone: v.cell_no || v.phone_no || v.phone || '',
          city: v.city || '',
          address: v.address || ''
        }));
        setVendors(normalizedVendors);

        const normalizedLocs = (locRes.data || []).map((l: any) => ({
          id: l.id,
          name: l.name || 'Warehouse',
          code: l.code || '',
          address: l.address || ''
        }));
        setLocations(normalizedLocs);

        setProductList(prodRes.data || []);
        if (bankRes.data) setBankAccountsList(bankRes.data);
        if (purRes.data) setPurchaseOrdersList(purRes.data);
        if (pastPrRes.data) setPastPurchaseReturnsList(pastPrRes.data);

        fetchStockDataset().then(setStockDataset).catch(() => setStockDataset(null));

        if (isEditMode && editData) {
          const vName = editData.vendor_name || '';
          setVendorSearchQuery(vName);

          const whName = editData.source_warehouse || '';
          setWarehouseSearchQuery(whName);

          const poRef = editData.purchase_no || editData.original_purchase_no || editData.metadata?.linkedPurchaseNo || '';
          if (poRef) {
            setSelectedPoNo(poRef);
            setPoSearchQuery(poRef);
            const cleanId = String(poRef).replace(/\D/g, '');
            const matchedPo = (purRes.data || []).find(p => p.purchase_no === poRef || String(p.id) === cleanId);
            if (matchedPo) setSelectedPoObj(matchedPo);
          }
        }
      } catch (err: any) {
        toast.error('Failed to load return metadata: ' + err.message);
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchReturnMetadata();
  }, [isEditMode, editData]);

  // Stock Map
  useEffect(() => {
    let isCancelled = false;
    const calculateAllStocks = async () => {
      if (!productList || productList.length === 0) return;
      const map: Record<string, number> = {};

      if (stockDataset) {
        if (stockDataset.balancesMode && Array.isArray(stockDataset.balances)) {
          (stockDataset.balances || []).forEach((r: any) => {
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
    calculateAllStocks();
    return () => { isCancelled = true; };
  }, [stockDataset, productList]);

  // Filtered lists
  const filteredVendors = vendors.filter(v =>
    (v.vendor_name || '').toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
    (v.contact_name || '').toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
    (v.phone || '').toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
    (v.city || '').toLowerCase().includes(vendorSearchQuery.toLowerCase())
  );

  const filteredWarehouses = locations.filter(l =>
    (l.name || '').toLowerCase().includes(warehouseSearchQuery.toLowerCase()) ||
    (l.code || '').toLowerCase().includes(warehouseSearchQuery.toLowerCase()) ||
    (l.address || '').toLowerCase().includes(warehouseSearchQuery.toLowerCase())
  );

  const vendorPurchases = purchaseOrdersList.filter(p =>
    vendorSearchQuery && (p.supplier_name || p.vendor_name || '').toLowerCase() === vendorSearchQuery.toLowerCase()
  );

  const filteredPurchases = vendorPurchases.filter(p => {
    if (!poSearchQuery) return true;
    return (
      (p.purchase_no || '').toLowerCase().includes(poSearchQuery.toLowerCase()) ||
      (p.purchase_date || '').toLowerCase().includes(poSearchQuery.toLowerCase()) ||
      (p.target_warehouse || '').toLowerCase().includes(poSearchQuery.toLowerCase())
    );
  });

  return {
    loading,
    setLoading,
    metadataLoading,
    vendors,
    locations,
    productList,
    stockDataset,
    totalStockMap,
    bankAccountsList,
    purchaseOrdersList,
    pastPurchaseReturnsList,
    workflowSettings,
    vendorSearchQuery,
    setVendorSearchQuery,
    warehouseSearchQuery,
    setWarehouseSearchQuery,
    poSearchQuery,
    setPoSearchQuery,
    selectedPoNo,
    setSelectedPoNo,
    selectedPoObj,
    setSelectedPoObj,
    filteredVendors,
    filteredWarehouses,
    filteredPurchases
  };
};
