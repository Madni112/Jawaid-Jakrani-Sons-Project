import { InvoiceBalanceInfo } from '../types/salesHistoryTypes';

export const computeInvoiceBalances = (
  invoicesData: any[],
  vouchersData: any[],
  returnsData: any[]
): Record<string, InvoiceBalanceInfo> => {
  // Group invoices by normalized customer name
  const customerInvoicesMap: Record<string, any[]> = {};
  (invoicesData || []).forEach((inv: any) => {
    const cKey = String(inv.customer_name || inv.customerName || 'walk-in').trim().toLowerCase();
    if (!customerInvoicesMap[cKey]) customerInvoicesMap[cKey] = [];
    customerInvoicesMap[cKey].push(inv);
  });

  // Group vouchers by normalized customer name
  const customerVouchersMap: Record<string, any[]> = {};
  (vouchersData || []).forEach((v: any) => {
    const cKey = String(
      v.customer_name || v.customerName || v.metadata?.customerName || v.metadata?.customer_name || ''
    ).trim().toLowerCase();
    if (cKey) {
      if (!customerVouchersMap[cKey]) customerVouchersMap[cKey] = [];
      customerVouchersMap[cKey].push(v);
    }
  });

  // Compute Real-time (Live) Received and Remaining Balances per Invoice (FIFO)
  const balanceMap: Record<string, InvoiceBalanceInfo> = {};

  Object.keys(customerInvoicesMap).forEach((cKey) => {
    const custInvs = customerInvoicesMap[cKey] || [];
    // Sort chronologically oldest first for FIFO general clearing
    const sortedInvs = [...custInvs].sort((a, b) => {
      const tA = new Date(a.sale_date || a.invoice_date || a.created_at || 0).getTime();
      const tB = new Date(b.sale_date || b.invoice_date || b.created_at || 0).getTime();
      return tA - tB || Number(a.id) - Number(b.id);
    });

    const custVouchers = customerVouchersMap[cKey] || [];

    // Allocations structure for each invoice
    const invAlloc: Record<
      string,
      {
        gross: number;
        upfront: number;
        specificVouchers: number;
        generalAllocated: number;
        specificReturns: number;
      }
    > = {};

    sortedInvs.forEach((inv) => {
      const invId = String(inv.id);
      const gross = Number(inv.total_amount || 0);
      const upfront = Number(inv.cash_amount_paid || 0) + Number(inv.bank_amount || 0);
      invAlloc[invId] = {
        gross,
        upfront,
        specificVouchers: 0,
        generalAllocated: 0,
        specificReturns: 0,
      };
    });

    let unallocatedGeneralVouchers = 0;

    // 1. Assign specific vouchers or accumulate general
    custVouchers.forEach((v) => {
      const vAmt = Number(v.total_amount || 0);
      const vRef = String(v.original_invoice_no || v.metadata?.linkedInvoiceNo || '').trim().toLowerCase();

      if (Array.isArray(v.metadata?.invoices) && v.metadata.invoices.length > 0) {
        v.metadata.invoices.forEach((mi: any) => {
          const miRef = String(mi.invoice_id || mi.invoice_no || '').trim().toLowerCase();
          const matched = sortedInvs.find(
            (i) =>
              String(i.id) === miRef ||
              String(i.invoice_no || '').trim().toLowerCase() === miRef ||
              `inv-${String(i.id).padStart(4, '0')}`.toLowerCase() === miRef
          );
          if (matched && invAlloc[String(matched.id)]) {
            invAlloc[String(matched.id)].specificVouchers += Number(
              mi.amount_paid || mi.received_amount || mi.amountToAllocate || 0
            );
          }
        });
      } else if (Array.isArray(v.metadata?.allocations) && v.metadata.allocations.length > 0) {
        v.metadata.allocations.forEach((al: any) => {
          const alRef = String(al.invoiceId || al.invoiceNo || '').trim().toLowerCase();
          const matched = sortedInvs.find(
            (i) =>
              String(i.id) === alRef ||
              String(i.invoice_no || '').trim().toLowerCase() === alRef ||
              `inv-${String(i.id).padStart(4, '0')}`.toLowerCase() === alRef
          );
          if (matched && invAlloc[String(matched.id)]) {
            invAlloc[String(matched.id)].specificVouchers += Number(al.amountToAllocate || al.amount || 0);
          }
        });
      } else if (vRef && !vRef.includes('general')) {
        const cleanRef = vRef.replace(/\D/g, '');
        const matched = sortedInvs.find(
          (i) =>
            String(i.invoice_no || '').trim().toLowerCase() === vRef ||
            String(i.id) === vRef ||
            (cleanRef && String(i.id) === cleanRef) ||
            `inv-${String(i.id).padStart(4, '0')}`.toLowerCase() === vRef
        );
        if (matched && invAlloc[String(matched.id)]) {
          invAlloc[String(matched.id)].specificVouchers += vAmt;
        } else {
          unallocatedGeneralVouchers += vAmt;
        }
      } else {
        unallocatedGeneralVouchers += vAmt;
      }
    });

    // 2. Assign specific returns
    (returnsData || []).forEach((r: any) => {
      const rRef = String(r.original_invoice_no || '').trim().toLowerCase();
      if (rRef) {
        const cleanRef = rRef.replace(/\D/g, '');
        const matched = sortedInvs.find(
          (i) =>
            String(i.invoice_no || '').trim().toLowerCase() === rRef ||
            String(i.id) === rRef ||
            (cleanRef && String(i.id) === cleanRef) ||
            `inv-${String(i.id).padStart(4, '0')}`.toLowerCase() === rRef
        );
        if (matched && invAlloc[String(matched.id)]) {
          invAlloc[String(matched.id)].specificReturns += Number(r.total_amount || 0);
        }
      }
    });

    // 3. FIFO distribution of general unallocated vouchers
    let pool = unallocatedGeneralVouchers;
    sortedInvs.forEach((inv) => {
      const invId = String(inv.id);
      const alloc = invAlloc[invId];
      if (alloc && pool > 0) {
        const dueBeforeGen = Math.max(0, alloc.gross - alloc.upfront - alloc.specificReturns - alloc.specificVouchers);
        if (dueBeforeGen > 0) {
          const take = Math.min(dueBeforeGen, pool);
          alloc.generalAllocated += take;
          pool -= take;
        }
      }
    });

    // 4. Save to balanceMap
    sortedInvs.forEach((inv) => {
      const invId = String(inv.id);
      const alloc = invAlloc[invId];
      const totalReceived = alloc.upfront + alloc.specificVouchers + alloc.generalAllocated;
      const remaining = Math.max(0, alloc.gross - totalReceived - alloc.specificReturns);
      balanceMap[invId] = {
        upfront: alloc.upfront,
        receipts: alloc.specificVouchers + alloc.generalAllocated,
        returns: alloc.specificReturns,
        received: totalReceived,
        remaining: remaining,
      };
    });
  });

  return balanceMap;
};
