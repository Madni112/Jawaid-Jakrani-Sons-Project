import { supabase } from '../../../../Context/supabaseClient';

export interface ReturnReceiptBalanceResult {
  customerOpeningBalance: number;
  customerInvoiceUnpaidDebt: number;
  customerReceivableBalance: number;
  customerTotalOutstandingReceivable: number;
  returnGrossBill: number;
  returnCreditAdjusted: number;
  returnPaidUpfront: number;
  returnPastReceiptsPaid: number;
  effectiveDueForThisReceipt: number;
  returnAllocationsMap: Record<string, any>;
}

export const calculateCustomerReturnBalances = async (
  customerName: string,
  returnNumber: string,
  allReturns: any[],
  currentEditReceiptId: number | null = null
): Promise<ReturnReceiptBalanceResult> => {
  if (!customerName) {
    return {
      customerOpeningBalance: 0,
      customerInvoiceUnpaidDebt: 0,
      customerReceivableBalance: 0,
      customerTotalOutstandingReceivable: 0,
      returnGrossBill: 0,
      returnCreditAdjusted: 0,
      returnPaidUpfront: 0,
      returnPastReceiptsPaid: 0,
      effectiveDueForThisReceipt: 0,
      returnAllocationsMap: {}
    };
  }

  try {
    // 0. Fetch customer's opening balance from customers table
    const { data: customerRow } = await supabase
      .from('customers')
      .select('opening_balance, balance, currentBalance')
      .ilike('customer_name', customerName)
      .maybeSingle();

    const customerOpeningBalance = Number(
      customerRow?.opening_balance ?? customerRow?.balance ?? customerRow?.currentBalance ?? 0
    );

    // 1. Fetch customer's sales invoices to determine available open receivable capacity
    const { data: customerInvoices } = await supabase
      .from('sales_invoices')
      .select('total_amount, cash_amount_paid, bank_amount')
      .ilike('customer_name', customerName);

    const { data: customerReceiptVouchers } = await supabase
      .from('financial_vouchers')
      .select('total_amount, voucher_no')
      .ilike('customer_name', customerName)
      .or('voucher_type.eq.Cash Receipt Voucher,voucher_type.eq.Bank Receipt Voucher,voucher_type.eq.Cash & Bank Receipt Voucher,voucher_type.eq.Customer Receive Voucher');

    let totalInvoicesGross = 0;
    let totalInvoicesUpfrontPaid = 0;
    (customerInvoices || []).forEach((inv: any) => {
      totalInvoicesGross += Number(inv.total_amount) || 0;
      totalInvoicesUpfrontPaid += Number(inv.cash_amount_paid || 0) + Number(inv.bank_amount || 0);
    });

    let totalReceiptsCollected = 0;
    (customerReceiptVouchers || []).forEach((v: any) => {
      const vNo = String(v.voucher_no || '');
      if (vNo.startsWith('OB-')) return; // Avoid double-counting opening balance vouchers
      totalReceiptsCollected += Number(v.total_amount) || 0;
    });

    const customerInvoiceUnpaidDebt = Math.max(0, totalInvoicesGross - totalInvoicesUpfrontPaid - totalReceiptsCollected);
    const openReceivableDebt = Math.max(0, customerOpeningBalance + customerInvoiceUnpaidDebt);

    // 2. Fetch customer's sales returns sorted chronologically
    const custReturns = allReturns.filter(
      (r) => (r.customer_name || '').toLowerCase() === customerName.toLowerCase()
    );

    const sortedCustReturns = [...custReturns].sort((a, b) => {
      const timeA = new Date(a.return_date || a.created_at || 0).getTime();
      const timeB = new Date(b.return_date || b.created_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;

      const createdA = new Date(a.created_at || 0).getTime();
      const createdB = new Date(b.created_at || 0).getTime();
      if (createdA !== createdB) return createdA - createdB;

      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });

    // 3. Fetch past refund payout receipts for this customer
    const { data: pastPayoutReceipts } = await supabase
      .from('sales_return_receipts')
      .select('id, amount_paid, sales_return_id, invoice_no, return_no, metadata, payment_mode, settlement_mode')
      .ilike('customer_name', customerName);

    let totalReturnsGross = 0;
    let totalReturnsUpfrontDisbursed = 0;
    let totalPastSettledCreditAdjusted = 0;

    const allocations: Record<string, any> = {};
    let totalPayoutsDisbursed = 0;
    let unallocatedGeneralPayouts = 0;

    // Initialize all returns chronologically
    sortedCustReturns.forEach((r) => {
      const key = r.return_no || r.invoice_no || `SRTN-${r.id}`;
      const originalGross = Number(r.total_amount || r.total_net_amount) || 0;
      const isQcVerified =
        r.inward_status === 'Received' ||
        r.inward_status === 'Partially Received' ||
        r.inward_status === 'Rejected';
      const hasAcceptedAmount = r.metadata?.accepted_amount !== undefined;
      const gross =
        isQcVerified && hasAcceptedAmount ? Number(r.metadata.accepted_amount) : originalGross;

      const upfront =
        Number(
          Number(r.cash_amount_paid || 0) + Number(r.bank_amount || 0) ||
            r.amount_paid
        ) || 0;

      totalReturnsGross += gross;
      totalReturnsUpfrontDisbursed += upfront;

      allocations[key] = {
        gross,
        originalGross,
        upfront,
        specificReceipts: 0,
        generalAllocated: 0,
        pastReceipts: 0,
        pastCreditAdjusted: 0,
        due: Math.max(0, gross - upfront),
        qcStatus: r.inward_status || 'Pending Inward',
        rejectedAmount: Number(r.metadata?.rejected_amount || 0)
      };
    });

    // Assign Return-specific payout receipts and accumulate general payouts
    (pastPayoutReceipts || []).forEach((rec: any) => {
      if (currentEditReceiptId && rec.id === currentEditReceiptId) return;
      const rAmt = Number(rec.amount_paid) || 0;
      const rLedgerAdj = Number(rec.metadata?.ledgerAdjusted) || 0;
      totalPayoutsDisbursed += rAmt;

      const rRef =
        rec.return_no ||
        rec.invoice_no ||
        (rec.sales_return_id ? `SRTN-${rec.sales_return_id}` : '');
      if (rRef && allocations[rRef]) {
        allocations[rRef].specificReceipts += rAmt;
        allocations[rRef].pastCreditAdjusted = (allocations[rRef].pastCreditAdjusted || 0) + rLedgerAdj;
      } else {
        unallocatedGeneralPayouts += rAmt;
      }

      totalPastSettledCreditAdjusted += rLedgerAdj;
      if (rec.payment_mode === 'Credit Ledger' || rec.settlement_mode === 'On Credit') {
        totalPastSettledCreditAdjusted += rAmt;
      }
    });

    // Allocate general unallocated payouts across open return notes (FIFO order)
    let generalRemaining = unallocatedGeneralPayouts;
    sortedCustReturns.forEach((r) => {
      const key = r.return_no || r.invoice_no || `SRTN-${r.id}`;
      const alloc = allocations[key];
      if (alloc) {
        const dueBeforeGeneral = Math.max(
          0,
          alloc.gross - alloc.upfront - alloc.specificReceipts - (alloc.pastCreditAdjusted || 0)
        );
        if (dueBeforeGeneral > 0 && generalRemaining > 0) {
          const toDistribute = Math.min(dueBeforeGeneral, generalRemaining);
          alloc.generalAllocated += toDistribute;
          generalRemaining -= toDistribute;
        }
        alloc.pastReceipts = alloc.specificReceipts + alloc.generalAllocated;
        const pastCredit = alloc.pastCreditAdjusted || 0;
        alloc.due = Math.max(
          0,
          alloc.gross - alloc.upfront - alloc.pastReceipts - pastCredit
        );
      }
    });

    const customerReceivableBalance = Math.max(0, openReceivableDebt - totalPastSettledCreditAdjusted);
    const netCustomerRefundPayable = Math.max(
      0,
      totalReturnsGross - totalReturnsUpfrontDisbursed - totalPayoutsDisbursed - totalPastSettledCreditAdjusted
    );

    if (returnNumber && allocations[returnNumber]) {
      const currentAlloc = allocations[returnNumber];
      return {
        customerOpeningBalance,
        customerInvoiceUnpaidDebt,
        customerReceivableBalance,
        customerTotalOutstandingReceivable: currentAlloc.due,
        returnGrossBill: currentAlloc.gross,
        returnCreditAdjusted: currentAlloc.pastCreditAdjusted || 0,
        returnPaidUpfront: currentAlloc.upfront,
        returnPastReceiptsPaid: currentAlloc.pastReceipts,
        effectiveDueForThisReceipt: currentAlloc.due,
        returnAllocationsMap: allocations
      };
    }

    return {
      customerOpeningBalance,
      customerInvoiceUnpaidDebt,
      customerReceivableBalance,
      customerTotalOutstandingReceivable: netCustomerRefundPayable,
      returnGrossBill: totalReturnsGross,
      returnCreditAdjusted: totalPastSettledCreditAdjusted,
      returnPaidUpfront: totalReturnsUpfrontDisbursed,
      returnPastReceiptsPaid: totalPayoutsDisbursed,
      effectiveDueForThisReceipt: netCustomerRefundPayable,
      returnAllocationsMap: allocations
    };
  } catch (err: any) {
    console.error('Customer return balance calculation error:', err);
    return {
      customerOpeningBalance: 0,
      customerInvoiceUnpaidDebt: 0,
      customerReceivableBalance: 0,
      customerTotalOutstandingReceivable: 0,
      returnGrossBill: 0,
      returnCreditAdjusted: 0,
      returnPaidUpfront: 0,
      returnPastReceiptsPaid: 0,
      effectiveDueForThisReceipt: 0,
      returnAllocationsMap: {}
    };
  }
};
