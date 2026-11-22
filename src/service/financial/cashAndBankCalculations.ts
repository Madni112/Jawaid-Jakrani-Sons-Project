import { BankBalanceItem } from './types';

interface CashAndBankParams {
  invoicesList: any[];
  purchasesList: any[];
  salesReturnsList: any[];
  salesReturnRecList: any[];
  purchaseReturnsList: any[];
  purchaseReturnRecList: any[];
  vouchersList: any[];
  banksList: any[];
  customerRecList: any[];
  isThisMonth: (dateStr?: string | null) => boolean;
}

export const calculateCashAndBankFlows = ({
  invoicesList,
  purchasesList,
  salesReturnRecList,
  purchaseReturnRecList,
  vouchersList,
  banksList,
  customerRecList,
  isThisMonth
}: CashAndBankParams) => {
  let cashInflow = 0;
  let cashOutflow = 0;
  let thisMonthCashInflow = 0;
  let thisMonthCashOutflow = 0;

  // 1. Upfront Cash Received on Sales Invoices
  const paidInvoicesMap = new Map<string, { total: number; cashPaid: number; isThisMonth: boolean }>();
  invoicesList.forEach((inv: any) => {
    const paid = Number(inv.cash_amount_paid || inv.amount_paid || 0);
    const tot = Number(inv.total_amount || 0);
    const invId = String(inv.id).trim().toLowerCase();
    const invDate = inv.created_at || inv.invoice_date;
    const invInThisMonth = isThisMonth(invDate);

    paidInvoicesMap.set(invId, { total: tot, cashPaid: paid, isThisMonth: invInThisMonth });
    paidInvoicesMap.set(`inv-${invId}`, { total: tot, cashPaid: paid, isThisMonth: invInThisMonth });

    if (inv.settlement_mode === 'Cash' || inv.payment_mode === 'Cash') {
      const receivedAmt = paid || tot;
      cashInflow += receivedAmt;
      if (invInThisMonth) thisMonthCashInflow += receivedAmt;
    } else if (paid > 0) {
      cashInflow += paid;
      if (invInThisMonth) thisMonthCashInflow += paid;
    }
  });

  // 2. Financial Vouchers (Subsequent Customer Receipts / General Cash Inflows)
  vouchersList.forEach((v: any) => {
    const amt = Number(v.total_amount || v.amount || 0);
    const mode = String(v.mode_of_payment || v.payment_mode || v.voucher_type || '');
    const isReceipt = String(v.voucher_type || '').toLowerCase().includes('receipt');
    const isPayment = String(v.voucher_type || '').toLowerCase().includes('payment');
    const vDate = v.created_at || v.voucher_date || v.date;
    const vInThisMonth = isThisMonth(vDate);

    if (!mode.toLowerCase().includes('bank')) {
      if (isReceipt) {
        const cleanRef = String(v.original_invoice_no || '').replace('INV-', '').trim().toLowerCase();
        const targetInv = cleanRef ? paidInvoicesMap.get(cleanRef) : null;
        if (targetInv && targetInv.cashPaid >= targetInv.total) {
          return;
        }
        cashInflow += amt;
        if (vInThisMonth) thisMonthCashInflow += amt;
      }
      if (isPayment) {
        cashOutflow += amt;
        if (vInThisMonth) thisMonthCashOutflow += amt;
      }
    }
  });

  // 3. Customer Cash Recoveries (Unlinked)
  customerRecList.forEach((rec: any) => {
    if (rec.deposit_mode === 'Cash' || rec.payment_mode === 'Cash' || !rec.deposit_mode) {
      const invRef = String(rec.invoice_id || rec.invoice_no || '').replace('INV-', '').trim().toLowerCase();
      const targetInv = invRef ? paidInvoicesMap.get(invRef) : null;
      if (targetInv && targetInv.cashPaid >= targetInv.total) {
        return;
      }
      const recAmt = Number(rec.net_collected_amount || rec.amount_paid || rec.amount || 0);
      cashInflow += recAmt;
      if (isThisMonth(rec.created_at || rec.recovery_date || rec.date)) {
        thisMonthCashInflow += recAmt;
      }
    }
  });

  // Cash Purchases Outflow (Voucher-Aware: skip if VPV voucher already posted)
  const voucherCoveredPurchases = new Set<string>();
  (vouchersList || []).forEach((v: any) => {
    const pNo = String(v.metadata?.linkedPurchaseNo || v.metadata?.purchase_no || v.original_invoice_no || '').trim().toLowerCase();
    if (pNo) voucherCoveredPurchases.add(pNo);
  });

  purchasesList.forEach((pur: any) => {
    const pNo = String(pur.purchase_no || pur.bill_number || pur.id || '').trim().toLowerCase();
    if (voucherCoveredPurchases.has(pNo)) {
      // VPV voucher already handles this cash outflow in section 2
      return;
    }

    const paid = Number(pur.amount_paid_now || pur.paid_amount || 0);
    const purDate = pur.created_at || pur.purchase_date;
    const purInThisMonth = isThisMonth(purDate);

    if (pur.payment_mode === 'Cash' || pur.settlement_mode === 'Cash') {
      const outAmt = paid || Number(pur.total_amount || 0);
      cashOutflow += outAmt;
      if (purInThisMonth) thisMonthCashOutflow += outAmt;
    } else if (paid > 0 && pur.payment_mode !== 'Bank') {
      cashOutflow += paid;
      if (purInThisMonth) thisMonthCashOutflow += paid;
    }
  });

  // Sales Return Receipts Cash Outflow
  salesReturnRecList.forEach((srec: any) => {
    if (srec.settlement_mode === 'Cash') {
      const sAmt = Number(srec.amount_paid || 0);
      cashOutflow += sAmt;
      if (isThisMonth(srec.created_at || srec.receipt_date || srec.date)) {
        thisMonthCashOutflow += sAmt;
      }
    }
  });

  // Purchase Return Receipts Cash Inflow
  purchaseReturnRecList.forEach((prec: any) => {
    if (prec.settlement_mode === 'Cash') {
      const pAmt = Number(prec.amount_received || prec.amount_paid || 0);
      cashInflow += pAmt;
      if (isThisMonth(prec.created_at || prec.receipt_date || prec.date)) {
        thisMonthCashInflow += pAmt;
      }
    }
  });

  // Check opening cash balances in vouchers
  (vouchersList || []).forEach((v: any) => {
    const amt = Number(v.total_amount || v.amount || 0);
    const isOB = Boolean(
      v.metadata?.isOpeningBalance ||
        String(v.voucher_no || '').startsWith('OB-') ||
        String(v.voucher_no || '').startsWith('OBV-') ||
        String(v.voucher_no || '').startsWith('OBC-')
    );
    const text = `${v.voucher_no || ''} ${v.account_title || ''} ${v.customer_name || ''} ${
      v.party_name || ''
    } ${v.narration || ''} ${v.voucher_type || ''}`.toLowerCase();
    if (isOB && text.includes('cash')) {
      cashInflow += amt;
      const vDate = v.voucher_date || v.created_at || v.date;
      if (isThisMonth(vDate)) {
        thisMonthCashInflow += amt;
      }
    }
  });

  const netCashBalance = cashInflow - cashOutflow;

  // --- Bank Balances per Corporate Bank Ledger ---
  const bankLedgerMap: Record<string, BankBalanceItem> = {};
  let thisMonthBankInflow = 0;
  let thisMonthBankOutflow = 0;

  banksList.forEach((b: any) => {
    const key = String(b.accountTitle || b.bankName || b.id).trim();
    bankLedgerMap[key] = {
      id: b.id,
      bankName: b.bankName || 'Bank',
      accountTitle: b.accountTitle || key,
      accountNumber: b.accountNumber || '',
      openingBalance: Number(b.openingBalance || 0),
      totalInflow: 0,
      totalOutflow: 0,
      netBalance: Number(b.openingBalance || 0)
    };
  });

  // Bank Invoices
  invoicesList.forEach((inv: any) => {
    if (inv.settlement_mode === 'Bank' && inv.selectedBankTitle) {
      const title = String(inv.selectedBankTitle).trim();
      const amt = Number(inv.cash_amount_paid || inv.total_amount || 0);
      if (!bankLedgerMap[title]) {
        bankLedgerMap[title] = {
          id: title,
          bankName: 'Bank',
          accountTitle: title,
          openingBalance: 0,
          totalInflow: 0,
          totalOutflow: 0,
          netBalance: 0
        };
      }
      bankLedgerMap[title].totalInflow += amt;
      if (isThisMonth(inv.created_at || inv.invoice_date)) {
        thisMonthBankInflow += amt;
      }
    }
  });

  // Bank Supplier Purchases
  purchasesList.forEach((pur: any) => {
    if ((pur.payment_mode === 'Bank' || pur.settlement_mode === 'Bank') && pur.selected_bank_title) {
      const title = String(pur.selected_bank_title).trim();
      const amt = Number(pur.amount_paid_now || pur.total_amount || 0);
      if (!bankLedgerMap[title]) {
        bankLedgerMap[title] = {
          id: title,
          bankName: 'Bank',
          accountTitle: title,
          openingBalance: 0,
          totalInflow: 0,
          totalOutflow: 0,
          netBalance: 0
        };
      }
      bankLedgerMap[title].totalOutflow += amt;
      if (isThisMonth(pur.created_at || pur.purchase_date)) {
        thisMonthBankOutflow += amt;
      }
    }
  });

  // Bank Vouchers
  vouchersList.forEach((v: any) => {
    const bankTitle = String(v.bank_account || v.bank_title || '').trim();
    const amt = Number(v.total_amount || 0);
    const isReceipt = String(v.voucher_type || '').toLowerCase().includes('receipt');
    const isPayment = String(v.voucher_type || '').toLowerCase().includes('payment');
    const vInThisMonth = isThisMonth(v.created_at || v.voucher_date || v.date);

    if (bankTitle) {
      if (!bankLedgerMap[bankTitle]) {
        bankLedgerMap[bankTitle] = {
          id: bankTitle,
          bankName: 'Bank',
          accountTitle: bankTitle,
          openingBalance: 0,
          totalInflow: 0,
          totalOutflow: 0,
          netBalance: 0
        };
      }
      if (isReceipt) {
        bankLedgerMap[bankTitle].totalInflow += amt;
        if (vInThisMonth) thisMonthBankInflow += amt;
      }
      if (isPayment) {
        bankLedgerMap[bankTitle].totalOutflow += amt;
        if (vInThisMonth) thisMonthBankOutflow += amt;
      }
    }
  });

  // Bank Sales Return Receipts Outflow
  salesReturnRecList.forEach((srec: any) => {
    if (srec.settlement_mode === 'Bank' && srec.bank_account_title) {
      const title = String(srec.bank_account_title).trim();
      const amt = Number(srec.amount_paid || 0);
      if (!bankLedgerMap[title]) {
        bankLedgerMap[title] = {
          id: title,
          bankName: 'Bank',
          accountTitle: title,
          openingBalance: 0,
          totalInflow: 0,
          totalOutflow: 0,
          netBalance: 0
        };
      }
      bankLedgerMap[title].totalOutflow += amt;
      if (isThisMonth(srec.created_at || srec.receipt_date || srec.date)) {
        thisMonthBankOutflow += amt;
      }
    }
  });

  const bankAccountsList = Object.values(bankLedgerMap).map((b) => {
    b.netBalance = b.openingBalance + b.totalInflow - b.totalOutflow;
    return b;
  });

  const totalBankBalance = bankAccountsList.reduce((acc, b) => acc + b.netBalance, 0);

  return {
    netCashBalance,
    cashInflow,
    cashOutflow,
    thisMonthCashInflow,
    thisMonthCashOutflow,
    totalBankBalance,
    thisMonthBankInflow,
    thisMonthBankOutflow,
    bankAccountsList,
    paidInvoicesMap
  };
};
