import { supabase, fetchAllPages } from '../../../../Context/supabaseClient';
import { HoldingItemRow } from '../types/holdingReportTypes';

export const fetchHoldingPrintRows = async (
  rawFilters: any,
  setCustomerLookupMap: React.Dispatch<React.SetStateAction<Record<string, { code: string; pageNo: string }>>>
): Promise<HoldingItemRow[]> => {
  const [dcRes, invRes, smRes, custRes] = await Promise.all([
    fetchAllPages(supabase.from('delivery_challans').select('*').order('created_at', { ascending: false })),
    fetchAllPages(supabase.from('sales_invoices').select('*')),
    supabase.from('salesmen').select('id, name'),
    fetchAllPages(supabase.from('customers').select('id, customerName, customer_code, customerCode, page_no, pageNo')),
  ]);

  const dcs = dcRes.data || [];
  const invoices = invRes.data || [];

  if (custRes.data) {
    const map: Record<string, { code: string; pageNo: string }> = {};
    custRes.data.forEach((c: any) => {
      const code = c.customer_code || c.customerCode || (c.id ? `CUST-${String(c.id).padStart(3, '0')}` : '');
      const pageNo = c.page_no || c.pageNo || '';
      if (c.customerName) map[c.customerName.trim().toLowerCase()] = { code, pageNo };
    });
    setCustomerLookupMap((prev) => ({ ...map, ...prev }));
  }

  // Create lookup map for invoices
  const invMap: Record<string, any> = {};
  invoices.forEach((inv) => {
    const key1 = String(inv.id).trim().toLowerCase();
    const key2 = `inv-${key1}`;
    invMap[key1] = inv;
    invMap[key2] = inv;
  });

  const extractedRows: HoldingItemRow[] = [];

  dcs.forEach((dc) => {
    const rawInvCode = String(dc.invoice_no || '').trim().replace(/^inv-/i, '').toLowerCase();
    const linkedInv = invMap[rawInvCode] || invMap[String(dc.invoice_no || '').trim().toLowerCase()];

    const gatepassCode = dc.challan_no || `DC-${String(dc.id).padStart(4, '0')}`;
    const invoiceCode =
      dc.invoice_no || (linkedInv?.id ? `INV-${String(linkedInv.id).padStart(4, '0')}` : 'Direct');
    const custName = dc.customer_name || linkedInv?.customer_name || 'Counter Buyer';
    const smName = linkedInv?.salesman || dc.salesman || 'Direct';
    const docDate =
      dc.challan_date || dc.dc_date || linkedInv?.sale_date || String(dc.created_at || '').split('T')[0];

    let items: any[] = [];
    if (Array.isArray(dc.items)) {
      items = dc.items;
    } else if (typeof dc.items === 'string') {
      try {
        items = JSON.parse(dc.items);
      } catch (_) {
        items = [];
      }
    }

    items.forEach((item, idx) => {
      const orderQty = Number(item.orderQty ?? item.qty ?? 0);
      const dispatchedQty = Number(
        item.dispatchedQty ?? (dc.status === 'Approved' || dc.status === 'Dispatched' ? orderQty : 0)
      );
      const holdQty = Number(item.holdQty !== undefined ? item.holdQty : Math.max(0, orderQty - dispatchedQty));
      const rate = Number(item.rate || item.rp || 0);
      const totalOrderAmt = orderQty * rate;
      const heldAmt = holdQty * rate;

      extractedRows.push({
        id: `${dc.id}-${idx}`,
        dcId: dc.id,
        gatepassNo: gatepassCode,
        invoiceNo: invoiceCode,
        customerName: custName,
        salesman: smName,
        productName: item.pDescription || item.itemName || item.product_name || 'Item',
        skuCode: item.skuCode || item.sku || '',
        warehouse: item.location || dc.dispatch_warehouse || 'Main Warehouse',
        orderQty,
        dispatchedQty,
        holdQty,
        rate,
        totalOrderAmount: totalOrderAmt,
        heldAmount: heldAmt,
        date: docDate,
        status: dc.status || (holdQty > 0 ? 'Holding' : 'Completed'),
        uom: item.uom || item.unit || '',
      });
    });
  });

  // Apply filters from criteria
  return extractedRows.filter((row) => {
    if (rawFilters.dateFrom && row.date < rawFilters.dateFrom) return false;
    if (rawFilters.dateTo && row.date > rawFilters.dateTo) return false;

    if (rawFilters.customer && rawFilters.customer.length > 0) {
      const custArr = Array.isArray(rawFilters.customer) ? rawFilters.customer : [rawFilters.customer];
      if (!custArr.includes('All') && custArr.length > 0) {
        const matches = custArr.some((c: string) => {
          const cleanC = c.replace(/^\[.*?\]\s*/, '').trim().toLowerCase();
          return row.customerName.toLowerCase().includes(cleanC);
        });
        if (!matches) return false;
      }
    }

    if (rawFilters.location && rawFilters.location.length > 0) {
      const locArr = Array.isArray(rawFilters.location) ? rawFilters.location : [rawFilters.location];
      if (!locArr.includes('All') && locArr.length > 0) {
        const matches = locArr.some((l: string) => row.warehouse.toLowerCase().includes(l.toLowerCase()));
        if (!matches) return false;
      }
    }

    if (rawFilters.salesman && rawFilters.salesman.length > 0) {
      const smArr = Array.isArray(rawFilters.salesman) ? rawFilters.salesman : [rawFilters.salesman];
      if (!smArr.includes('All') && smArr.length > 0) {
        const matches = smArr.some((s: string) => row.salesman.toLowerCase().includes(s.toLowerCase()));
        if (!matches) return false;
      }
    }

    if (row.holdQty <= 0) return false;

    return true;
  });
};
