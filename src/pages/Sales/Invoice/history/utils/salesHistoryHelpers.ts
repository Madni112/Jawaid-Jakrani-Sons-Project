import { SaleTypeInfo } from '../types/salesHistoryTypes';

// Helper to dynamically resolve exchange vs standard sale types
export const getInvoiceSaleTypeInfo = (inv: any): SaleTypeInfo => {
  const items = Array.isArray(inv?.items) ? inv.items : [];

  // Identify exchange items and return credits
  const exchangeItem = items.find((it: any) =>
    Number(it._tileReturnAmount || 0) > 0 ||
    Number(it._returnAmount || 0) > 0 ||
    Number(it._totalReturnCredit || 0) > 0 ||
    (Array.isArray(it._tileReturnItems) && it._tileReturnItems.length > 0) ||
    (Array.isArray(it._returnItems) && it._returnItems.length > 0)
  );

  const isExchange = !!exchangeItem || String(inv?.receipt_status || '').toLowerCase() === 'credit adjusted';

  if (isExchange) {
    const returnCredit = Number(
      exchangeItem?._totalReturnCredit ||
      exchangeItem?._tileReturnAmount ||
      exchangeItem?._returnAmount ||
      0
    );
    const refundAmt = Number(exchangeItem?._excessRefundAmount || 0);
    const refundMethod = String(exchangeItem?._excessRefundMethod || 'Cash').trim();
    const action = String(exchangeItem?._excessCreditAction || '').toLowerCase();
    const newTotal = Number(inv?.total_amount || 0);

    // Case 1: Cash/Bank paid to customer
    if (refundAmt > 0 && action === 'refund') {
      const isBank = refundMethod.toLowerCase() === 'bank';
      return {
        isExchange: true,
        label: `Exchange: ${isBank ? 'Bank' : 'Cash'} Paid (Rs. ${refundAmt.toLocaleString()})`,
        shortLabel: `Exch: ${isBank ? 'Bank' : 'Cash'} Paid`,
        tooltip: `Customer returned Rs. ${returnCredit.toLocaleString()} goods. Purchased Rs. ${newTotal.toLocaleString()}. We paid Rs. ${refundAmt.toLocaleString()} via ${refundMethod} to customer.`,
        className: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 font-bold'
      };
    }

    // Case 2: Excess credit retained on customer ledger (Credit on Us)
    if (refundAmt > 0 && action === 'credit') {
      return {
        isExchange: true,
        label: `Exchange: Customer Credit (Rs. ${refundAmt.toLocaleString()})`,
        shortLabel: 'Exch: Customer Credit',
        tooltip: `Customer returned Rs. ${returnCredit.toLocaleString()} goods. Purchased Rs. ${newTotal.toLocaleString()}. Rs. ${refundAmt.toLocaleString()} retained as customer balance.`,
        className: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40 font-bold'
      };
    }

    // Case 3: Return credit exceeded new purchase without explicit refund flag
    if (returnCredit > newTotal) {
      const diff = returnCredit - newTotal;
      return {
        isExchange: true,
        label: `Exchange: Cash Paid (Rs. ${diff.toLocaleString()})`,
        shortLabel: 'Exch: Cash Paid',
        tooltip: `Customer return credit (Rs. ${returnCredit.toLocaleString()}) exceeded new purchase (Rs. ${newTotal.toLocaleString()}) by Rs. ${diff.toLocaleString()}.`,
        className: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 font-bold'
      };
    }

    // Case 4: Equal exchange
    if (returnCredit > 0 && returnCredit === newTotal) {
      return {
        isExchange: true,
        label: 'Exchange: Even Swap',
        shortLabel: 'Exch: Even',
        tooltip: `Returned items (Rs. ${returnCredit.toLocaleString()}) exactly matched new purchase (Rs. ${newTotal.toLocaleString()}).`,
        className: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40 font-bold'
      };
    }

    // Case 5: New purchase was greater than return credit (Customer owes or paid difference)
    if (newTotal > returnCredit && returnCredit > 0) {
      const remainingDiff = newTotal - returnCredit;
      const rec = Number(inv?.cash_amount_paid || 0) + Number(inv?.bank_amount || 0);
      if (rec >= remainingDiff) {
        return {
          isExchange: true,
          label: `Exchange: Diff Paid (Rs. ${remainingDiff.toLocaleString()})`,
          shortLabel: 'Exch: Diff Paid',
          tooltip: `New purchase Rs. ${newTotal.toLocaleString()} minus return Rs. ${returnCredit.toLocaleString()}. Customer paid difference Rs. ${remainingDiff.toLocaleString()}.`,
          className: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40 font-bold'
        };
      } else {
        const debt = remainingDiff - rec;
        return {
          isExchange: true,
          label: `Exchange: Diff on Credit (Rs. ${debt.toLocaleString()})`,
          shortLabel: 'Exch: On Credit',
          tooltip: `New purchase Rs. ${newTotal.toLocaleString()} minus return Rs. ${returnCredit.toLocaleString()}. Customer owes Rs. ${debt.toLocaleString()}.`,
          className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold'
        };
      }
    }

    return {
      isExchange: true,
      label: 'Exchange Sale',
      shortLabel: 'Exchange',
      tooltip: 'Sale covered by return credit adjustments.',
      className: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 font-bold'
    };
  }

  // Standard non-exchange sales
  const term = String(inv?.payment_term || '').toLowerCase();
  const isCashOrBank = term.includes('cash') || term.includes('bank');

  if (isCashOrBank) {
    return {
      isExchange: false,
      label: 'Regular Cash Sale',
      shortLabel: 'Cash Sale',
      tooltip: 'Standard sale settled immediately via cash or bank transaction.',
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
    };
  }

  return {
    isExchange: false,
    label: 'Credit Sale',
    shortLabel: 'Credit',
    tooltip: 'Account receivable invoice billed to customer ledger balance.',
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
  };
};
