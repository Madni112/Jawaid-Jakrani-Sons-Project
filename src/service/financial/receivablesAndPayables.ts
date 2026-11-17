interface ReceivablesAndPayablesParams {
  invoicesList: any[];
  purchasesList: any[];
  salesReturnsList: any[];
  purchaseReturnsList: any[];
  vouchersList: any[];
  customersList: any[];
  isThisMonth: (dateStr?: string | null) => boolean;
}

export const calculateReceivablesAndPayables = ({
  invoicesList,
  purchasesList,
  salesReturnsList,
  purchaseReturnsList,
  vouchersList,
  customersList,
  isThisMonth
}: ReceivablesAndPayablesParams) => {
  let totalReceivables = 0;
  let thisMonthReceivables = 0;

  // 1. Customer opening balances from vouchers & customers table
  const customerOpeningMap: Record<string, number> = {};
  (vouchersList || []).forEach((v: any) => {
    const vNo = String(v.voucher_no || '');
    const isOB = Boolean(v.metadata?.isOpeningBalance || vNo.startsWith('OB-'));
    const isCustomerOB =
      isOB &&
      (v.metadata?.preset === 'SAV' ||
        (vNo.startsWith('OB-') && !vNo.startsWith('OBV-') && !vNo.startsWith('OBC-')));
    if (isCustomerOB && !v.metadata?.isCash) {
      const cName = (v.customer_name || v.customerName || v.party_name || '').trim().toLowerCase();
      if (cName && !cName.includes('cash')) {
        customerOpeningMap[cName] = (customerOpeningMap[cName] || 0) + Number(v.total_amount || v.debit || 0);
      }
    }
  });

  (customersList || []).forEach((c: any) => {
    const cName = (c.customerName || c.name || '').trim().toLowerCase();
    const rawBal = Number(
      c.currentBalance !== undefined && c.currentBalance !== null && c.currentBalance !== ''
        ? c.currentBalance
        : c.balance !== undefined && c.balance !== null && c.balance !== ''
        ? c.balance
        : c.opening_balance || 0
    );
    const nature = String(c.balance_nature || c.balanceNature || '').toLowerCase();
    const isCredit = nature.includes('cr') || nature.includes('credit');
    if (!isCredit && rawBal > 0 && !customerOpeningMap[cName]) {
      customerOpeningMap[cName] = rawBal;
    }
  });

  Object.values(customerOpeningMap).forEach((ob) => {
    totalReceivables += ob;
  });

  // 2. Add unpaid invoices deducting upfront and invoice-specific vouchers
  invoicesList.forEach((inv: any) => {
    const invIdStr = String(inv.id).trim().toLowerCase();
    const tot = Number(inv.total_amount || 0);
    const initialPaid = Number(inv.cash_amount_paid || inv.amount_paid || 0);
    const invInThisMonth = isThisMonth(inv.created_at || inv.invoice_date);

    // Sum returns for this specific invoice
    const matchedReturns = salesReturnsList.filter((r: any) => {
      const cleanRef = String(r.original_invoice_no || '').replace('INV-', '').trim().toLowerCase();
      return cleanRef === invIdStr;
    });
    const returnsSum = matchedReturns.reduce(
      (sum: number, r: any) => sum + Number(r.total_amount || r.total_net_amount || 0),
      0
    );

    // Sum vouchers for this specific invoice
    const matchedVouchers = vouchersList.filter((v: any) => {
      const cleanRef = String(v.original_invoice_no || '').replace('INV-', '').trim().toLowerCase();
      const isReceipt = String(v.voucher_type || '').toLowerCase().includes('receipt');
      return isReceipt && cleanRef === invIdStr;
    });
    const vouchersSum = matchedVouchers.reduce(
      (sum: number, v: any) => sum + Number(v.total_amount || 0),
      0
    );

    const netDue = Math.max(0, tot - initialPaid - vouchersSum - returnsSum);
    totalReceivables += netDue;
    if (invInThisMonth) {
      thisMonthReceivables += netDue;
    }
  });

  // 3. Deduct standalone/general customer receipt vouchers
  (vouchersList || []).forEach((v: any) => {
    const isReceipt =
      String(v.voucher_type || '').toLowerCase().includes('receipt') ||
      String(v.voucher_no || '').startsWith('CRV-');
    const isUpfront = Boolean(
      v.metadata?.auto_generated || v.metadata?.moduleSource === 'sales_invoice'
    );
    if (isReceipt && !isUpfront && !v.original_invoice_no) {
      const amt = Number(v.total_amount || 0);
      totalReceivables = Math.max(0, totalReceivables - amt);
      if (isThisMonth(v.created_at || v.voucher_date || v.date)) {
        thisMonthReceivables = Math.max(0, thisMonthReceivables - amt);
      }
    }
  });

  let totalPayables = 0;
  let thisMonthPayables = 0;

  // 1. Vendor opening balances from vouchers
  const vendorOpeningMap: Record<string, number> = {};
  (vouchersList || []).forEach((v: any) => {
    const isOB = Boolean(v.metadata?.isOpeningBalance || String(v.voucher_no || '').startsWith('OBV-'));
    if (
      isOB &&
      String(v.voucher_type || '').toLowerCase().includes('journal') &&
      v.metadata?.preset === 'PAV'
    ) {
      const vName = (v.customer_name || v.customerName || v.party_name || '').trim().toLowerCase();
      if (vName) {
        vendorOpeningMap[vName] = (vendorOpeningMap[vName] || 0) + Number(v.total_amount || 0);
      }
    }
  });

  Object.values(vendorOpeningMap).forEach((ob) => {
    totalPayables += ob;
  });

  // 2. Add unpaid purchases deducting upfront paid amounts
  purchasesList.forEach((pur: any) => {
    const purIdStr = String(pur.id).trim().toLowerCase();
    const purNoStr = String(pur.purchase_no || '').trim().toLowerCase();
    const tot = Number(pur.total_amount || 0);
    const upfrontPaid =
      Number(pur.cash_amount_paid || 0) + Number(pur.bank_amount_paid || 0) ||
      Number(pur.amount_paid || 0);
    const purInThisMonth = isThisMonth(pur.created_at || pur.purchase_date);

    // Sum purchase returns for this specific purchase
    const matchedPReturns = purchaseReturnsList.filter((pr: any) => {
      const cleanRef = String(pr.purchase_no || pr.original_purchase_no || '')
        .replace('PUR-', '')
        .trim()
        .toLowerCase();
      return cleanRef === purIdStr || cleanRef === purNoStr;
    });
    const pReturnsSum = matchedPReturns.reduce(
      (sum: number, pr: any) => sum + Number(pr.total_amount || 0),
      0
    );

    const netPayableDue = Math.max(0, tot - upfrontPaid - pReturnsSum);
    totalPayables += netPayableDue;
    if (purInThisMonth) {
      thisMonthPayables += netPayableDue;
    }
  });

  // 3. Deduct standalone/general payment vouchers
  (vouchersList || []).forEach((v: any) => {
    const isPayment = String(v.voucher_type || '').toLowerCase().includes('payment');
    const isUpfront = Boolean(
      v.metadata?.auto_generated || v.metadata?.moduleSource === 'purchase_bill'
    );
    if (isPayment && !isUpfront) {
      const amt = Number(v.total_amount || 0);
      totalPayables = Math.max(0, totalPayables - amt);
      thisMonthPayables = Math.max(0, thisMonthPayables - amt);
    }
  });

  // Calculate Total Gross Billed vs Settled for Customers (Receivables)
  let totalCustomerOpening = 0;
  Object.values(customerOpeningMap).forEach((ob) => {
    totalCustomerOpening += ob;
  });

  let totalInvoicesBilled = 0;
  invoicesList.forEach((inv: any) => {
    totalInvoicesBilled += Number(inv.total_amount || 0);
  });
  salesReturnsList.forEach((ret: any) => {
    totalInvoicesBilled = Math.max(
      0,
      totalInvoicesBilled - Number(ret.total_amount || ret.total_net_amount || 0)
    );
  });

  const totalGrossReceivables = Math.max(totalReceivables, totalCustomerOpening + totalInvoicesBilled);
  const totalCustomerRecovered = Math.max(0, totalGrossReceivables - totalReceivables);

  // Calculate Total Gross Billed vs Settled for Vendors (Payables)
  let totalVendorOpening = 0;
  Object.values(vendorOpeningMap).forEach((ob) => {
    totalVendorOpening += ob;
  });

  let totalPurchasesBilled = 0;
  purchasesList.forEach((pur: any) => {
    totalPurchasesBilled += Number(pur.total_amount || 0);
  });
  purchaseReturnsList.forEach((pret: any) => {
    totalPurchasesBilled = Math.max(
      0,
      totalPurchasesBilled - Number(pret.total_amount || pret.total_net_amount || 0)
    );
  });

  const totalGrossPayables = Math.max(totalPayables, totalVendorOpening + totalPurchasesBilled);
  const totalVendorDisbursed = Math.max(0, totalGrossPayables - totalPayables);

  return {
    totalReceivables,
    thisMonthReceivables,
    totalGrossReceivables,
    totalCustomerRecovered,
    totalPayables,
    thisMonthPayables,
    totalGrossPayables,
    totalVendorDisbursed
  };
};
