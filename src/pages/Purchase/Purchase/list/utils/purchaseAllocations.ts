import { PurchaseRecord, AllocationMapEntry } from '../types/purchaseListTypes';

// Smart Money Formatter (Hides .00 for whole numbers, shows decimals if fractional)
export const formatMoney = (val: number | string | undefined | null): string => {
  const num = Number(val) || 0;
  if (Number.isInteger(num)) {
    return num.toLocaleString('en-US');
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const calculatePurchaseAllocations = (
  purData: PurchaseRecord[],
  vouchersData: any[],
  pReturnsData: any[]
): Record<string, AllocationMapEntry> => {
  // Group purchases by vendor
  const purchasesByVendor: Record<string, PurchaseRecord[]> = {};
  (purData || []).forEach((p) => {
    const vKey = (p.supplier_name || p.vendor_name || 'General Vendor').trim().toLowerCase();
    if (!purchasesByVendor[vKey]) purchasesByVendor[vKey] = [];
    purchasesByVendor[vKey].push(p);
  });

  const allocMap: Record<string, AllocationMapEntry> = {};

  // For each vendor, allocate vouchers + returns (specific + general unallocated FIFO)
  Object.keys(purchasesByVendor).forEach((vKey) => {
    const vendorPurs = [...purchasesByVendor[vKey]].sort((a, b) => {
      const timeA = new Date(a.purchase_date || a.created_at || 0).getTime();
      const timeB = new Date(b.purchase_date || b.created_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;

      const createdA = new Date(a.created_at || 0).getTime();
      const createdB = new Date(b.created_at || 0).getTime();
      if (createdA !== createdB) return createdA - createdB;

      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });

    const vendorVouchers = (vouchersData || []).filter((v) => {
      const vName = (v.customer_name || v.customerName || v.vendor_name || v.vendorName || '').trim().toLowerCase();
      return vName === vKey || vName.includes(vKey) || vKey.includes(vName);
    });

    const vendorReturns = (pReturnsData || []).filter((r) => {
      const rName = (r.vendor_name || r.vendorName || r.supplier_name || '').trim().toLowerCase();
      return (rName === vKey || rName.includes(vKey) || vKey.includes(rName)) && String(r.status || '').toLowerCase() !== 'cancel';
    });

    const poAlloc: Record<string, {
      gross: number;
      upfront: number;
      specificVouchers: number;
      specificReturns: number;
      generalAllocated: number;
      totalPaid: number;
      due: number;
    }> = {};
    let unallocatedGeneral = 0;

    vendorPurs.forEach((p) => {
      const key = p.purchase_no || String(p.id);
      const rawId = String(p.id);
      const gross = Number(p.total_amount) || 0;
      const upfront = Number(p.cash_amount_paid || 0) + Number(p.bank_amount_paid || 0);

      const initObj = {
        gross,
        upfront,
        specificVouchers: 0,
        specificReturns: 0,
        generalAllocated: 0,
        totalPaid: upfront,
        due: Math.max(0, gross - upfront)
      };
      poAlloc[key] = initObj;
      poAlloc[rawId] = initObj;
    });

    // 1. Allocate Vouchers
    vendorVouchers.forEach((v) => {
      const vAmt = Number(v.total_amount) || 0;
      const vPoRef = v.original_invoice_no || v.metadata?.linkedPurchaseNo || '';
      if (vPoRef) {
        const cleanId = String(vPoRef).replace(/\D/g, '');
        const matched = vendorPurs.find((p) => p.purchase_no === vPoRef || String(p.id) === cleanId);
        if (matched && poAlloc[matched.purchase_no || String(matched.id)]) {
          poAlloc[matched.purchase_no || String(matched.id)].specificVouchers += vAmt;
        } else {
          unallocatedGeneral += vAmt;
        }
      } else {
        unallocatedGeneral += vAmt;
      }
    });

    // 2. Allocate Returns (Debit Notes) item-by-item
    vendorReturns.forEach((r) => {
      const matchedInvoices = r.metadata?.matchedInvoices;
      if (Array.isArray(matchedInvoices) && matchedInvoices.length > 0) {
        matchedInvoices.forEach((mi: any) => {
          const poTarget = mi.purchase_no;
          const val = Number(mi.deducted_value || (Number(mi.deducted_qty || 0) * Number(mi.invoice_rate || mi.entered_rate || 0)) || 0);
          const cleanId = String(poTarget).replace(/\D/g, '');
          const matched = vendorPurs.find((p) => p.purchase_no === poTarget || String(p.id) === cleanId);
          if (matched && poAlloc[matched.purchase_no || String(matched.id)]) {
            poAlloc[matched.purchase_no || String(matched.id)].specificReturns += val;
          } else {
            unallocatedGeneral += val;
          }
        });
      } else {
        const rAmt = Number(r.total_amount) || 0;
        const rPoRef = r.purchase_no || r.original_invoice_no || r.metadata?.linkedPurchaseNo || '';
        if (rPoRef) {
          const cleanId = String(rPoRef).replace(/\D/g, '');
          const matched = vendorPurs.find((p) => p.purchase_no === rPoRef || String(p.id) === cleanId);
          if (matched && poAlloc[matched.purchase_no || String(matched.id)]) {
            poAlloc[matched.purchase_no || String(matched.id)].specificReturns += rAmt;
          } else {
            unallocatedGeneral += rAmt;
          }
        } else {
          unallocatedGeneral += rAmt;
        }
      }
    });

    // 3. FIFO Distribute Unallocated General Vouchers & Returns across oldest open POs
    let genRemaining = unallocatedGeneral;
    vendorPurs.forEach((p) => {
      const key = p.purchase_no || String(p.id);
      const alloc = poAlloc[key];
      if (alloc) {
        const dueBeforeGen = Math.max(0, alloc.gross - alloc.upfront - alloc.specificVouchers - alloc.specificReturns);
        if (dueBeforeGen > 0 && genRemaining > 0) {
          const toDist = Math.min(dueBeforeGen, genRemaining);
          alloc.generalAllocated += toDist;
          genRemaining -= toDist;
        }
        alloc.totalPaid = alloc.upfront + alloc.specificVouchers + alloc.specificReturns + alloc.generalAllocated;
        alloc.due = Math.max(0, alloc.gross - alloc.totalPaid);

        const summary: AllocationMapEntry = {
          totalPaid: alloc.totalPaid,
          due: alloc.due,
          returned: alloc.specificReturns,
          generalAllocated: alloc.generalAllocated,
          specificVouchers: alloc.specificVouchers
        };

        allocMap[key] = summary;
        allocMap[String(p.id)] = summary;
        if (p.purchase_no) {
          allocMap[p.purchase_no] = summary;
        }
      }
    });
  });

  return allocMap;
};
