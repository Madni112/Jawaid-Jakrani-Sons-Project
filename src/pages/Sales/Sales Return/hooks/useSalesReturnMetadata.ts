import { useState, useEffect } from 'react';
import { supabase, fetchAllPages } from '../../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import { fetchWorkflowSettings } from '../../../../service/workflowSettingsService';
import { fetchStockDataset } from '../../../../utils/stockCalculator';
import { enrichProductsWithCachedLoose } from '../../../../utils/looseUomHelpers';

export const useSalesReturnMetadata = (
  routeId?: string,
  rawStateData?: any,
  locationSearch?: string
) => {
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const [customers, setCustomers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [productList, setProductList] = useState<any[]>([]);
  const [bankAccountsList, setBankAccountsList] = useState<any[]>([]);
  const [salesInvoicesList, setSalesInvoicesList] = useState<any[]>([]);
  const [salesReturnsList, setSalesReturnsList] = useState<any[]>([]);
  const [workflowSettings, setWorkflowSettings] = useState<any>(null);
  const [stockDataset, setStockDataset] = useState<any>(null);
  const [fetchedEditRecord, setFetchedEditRecord] = useState<any>(null);

  // Autocomplete Queries & Objects
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [selectedInvNo, setSelectedInvNo] = useState('');
  const [selectedInvObj, setSelectedInvObj] = useState<any>(null);
  const [defaultReturnNo, setDefaultReturnNo] = useState('');

  const editData = rawStateData || fetchedEditRecord;
  const isEditMode = !!editData && (
    editData.hasOwnProperty('original_invoice_no') ||
    editData.hasOwnProperty('return_no') ||
    editData.hasOwnProperty('payout_amount_paid') ||
    editData.hasOwnProperty('total_amount') ||
    !!rawStateData?.returnData ||
    !!rawStateData?.editData ||
    !!rawStateData?.returnRecord ||
    !!fetchedEditRecord
  );

  useEffect(() => {
    const fetchReturnMetadata = async () => {
      try {
        setMetadataLoading(true);
        fetchWorkflowSettings().then(setWorkflowSettings).catch(() => {});
        fetchStockDataset().then(setStockDataset).catch(() => setStockDataset(null));

        let currentEdit = rawStateData;
        const targetId = routeId || new URLSearchParams(locationSearch || '').get('id');
        if (!currentEdit && targetId) {
          const { data: rtnRecord } = await supabase
            .from('sales_returns')
            .select('*')
            .eq('id', targetId)
            .maybeSingle();
          if (rtnRecord) {
            currentEdit = rtnRecord;
            setFetchedEditRecord(rtnRecord);
          }
        }

        if (currentEdit?.id) {
          const formatted = currentEdit.return_no && !currentEdit.return_no.match(/^RTN-\d{6}$/)
            ? currentEdit.return_no
            : `RTN-${String(currentEdit.id).padStart(4, '0')}`;
          setDefaultReturnNo(formatted);
        } else {
          const { data: latestReturn } = await supabase
            .from('sales_returns')
            .select('id')
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle();

          let nextId = 1;
          if (latestReturn?.id) {
            nextId = Number(latestReturn.id) + 1;
          }
          setDefaultReturnNo(`RTN-${String(nextId).padStart(4, '0')}`);
        }

        const [cRes, invRes, rtnRes, locRes, prodRes, bankRes] = await Promise.all([
          fetchAllPages(supabase.from('customers').select('*')),
          fetchAllPages(supabase.from('sales_invoices').select('*').order('id', { ascending: false })),
          fetchAllPages(supabase.from('sales_returns').select('id, return_no, customer_name, original_invoice_no, invoice_no, items, metadata')),
          fetchAllPages(supabase.from('inventory_locations').select('*')),
          fetchAllPages(supabase.from('products').select('*').order('product_name', { ascending: true })),
          fetchAllPages(supabase.from('banks').select('id, bankName, accountTitle, accountNumber'))
        ]);

        if (invRes.data) setSalesInvoicesList(invRes.data);
        if (rtnRes.data) setSalesReturnsList(rtnRes.data);

        const customerMap = new Map<string, any>();
        (cRes.data || []).forEach((c: any) => {
          const name = (c.customername || c.customerName || c.customer_name || c.name || '').trim();
          if (name) {
            customerMap.set(name.toLowerCase(), {
              id: c.id,
              customer_name: name,
              customer_code: c.customer_code || c.customerCode || '',
              contact_name: c.company || c.contact_name || '',
              phone: c.phone || c.primaryPhone || c.cell_no || '',
              city: c.city || '',
              address: c.address || ''
            });
          }
        });

        (invRes.data || []).forEach((inv: any) => {
          const name = (inv.customer_name || inv.customerName || '').trim();
          if (name && !customerMap.has(name.toLowerCase())) {
            customerMap.set(name.toLowerCase(), {
              id: `inv-${inv.id}`,
              customer_name: name,
              contact_name: '',
              phone: '',
              city: '',
              address: ''
            });
          }
        });

        const normalizedCustomers = Array.from(customerMap.values()).sort((a, b) => a.customer_name.localeCompare(b.customer_name));
        setCustomers(normalizedCustomers);

        const normalizedLocs = (locRes.data || []).map((l: any) => ({
          id: l.id,
          name: l.name || 'Main Warehouse',
          code: l.code || '',
          address: l.address || ''
        }));
        setLocations(normalizedLocs.length > 0 ? normalizedLocs : [{ id: 1, name: 'Main Warehouse', code: 'MW' }]);

        setProductList(enrichProductsWithCachedLoose(prodRes.data || []));
        if (bankRes.data) setBankAccountsList(bankRes.data);

        if (currentEdit) {
          const cName = currentEdit.customer_name || '';
          setCustomerSearchQuery(cName);

          const whName = currentEdit.warehouse_name || currentEdit.source_warehouse || '';
          if (whName) setWarehouseSearchQuery(whName);

          const invRef = currentEdit.original_invoice_no || currentEdit.invoice_no || currentEdit.metadata?.linkedInvoiceNo || '';
          if (invRef) {
            setSelectedInvNo(invRef);
            setInvSearchQuery(invRef);
            const cleanId = String(invRef).replace(/\D/g, '');
            const matchedInv = (invRes.data || []).find(i => (i.invoice_no || `INV-${String(i.id).padStart(4, '0')}`) === invRef || String(i.id) === cleanId);
            if (matchedInv) setSelectedInvObj(matchedInv);
          } else {
            setInvSearchQuery('-- General Return (All Invoices FIFO) --');
          }
        }
      } catch (err: any) {
        toast.error('Failed to load sales return metadata: ' + err.message);
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchReturnMetadata();
  }, [routeId, rawStateData]);

  // Filtered lists
  const filteredCustomers = customers.filter(c =>
    (c.customer_name || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (c.customer_code || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (c.contact_name || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  const filteredWarehouses = locations.filter(l =>
    (l.name || '').toLowerCase().includes(warehouseSearchQuery.toLowerCase()) ||
    (l.code || '').toLowerCase().includes(warehouseSearchQuery.toLowerCase()) ||
    (l.address || '').toLowerCase().includes(warehouseSearchQuery.toLowerCase())
  );

  const customerInvoices = salesInvoicesList.filter(inv =>
    customerSearchQuery && (inv.customer_name || '').toLowerCase() === customerSearchQuery.toLowerCase()
  );

  const filteredInvoices = customerInvoices.filter(inv => {
    if (!invSearchQuery || invSearchQuery.startsWith('-- General')) return true;
    const invFormatted = inv.invoice_no || `INV-${String(inv.id).padStart(4, '0')}`;
    return (
      invFormatted.toLowerCase().includes(invSearchQuery.toLowerCase()) ||
      (inv.invoice_date || '').toLowerCase().includes(invSearchQuery.toLowerCase()) ||
      (inv.dispatch_warehouse || '').toLowerCase().includes(invSearchQuery.toLowerCase())
    );
  });

  return {
    loading,
    setLoading,
    metadataLoading,
    customers,
    locations,
    productList,
    bankAccountsList,
    salesInvoicesList,
    salesReturnsList,
    workflowSettings,
    stockDataset,
    editData,
    isEditMode,
    defaultReturnNo,
    customerSearchQuery,
    setCustomerSearchQuery,
    warehouseSearchQuery,
    setWarehouseSearchQuery,
    invSearchQuery,
    setInvSearchQuery,
    selectedInvNo,
    setSelectedInvNo,
    selectedInvObj,
    setSelectedInvObj,
    filteredCustomers,
    filteredWarehouses,
    filteredInvoices,
    customerInvoices
  };
};
