import { supabase } from '../../Context/supabaseClient';

/**
 * Automatically recalculates and synchronizes the receipt_status of an invoice
 * by comparing total bill amount with upfront payments, vouchers, and debit notes.
 */
export const recalculateInvoiceSettlementStatus = async (invoiceId: string | number) => {
  try {
    const rawInvId = String(invoiceId || '').replace(/\D/g, '');
    if (!rawInvId) return;

    const { data: inv } = await supabase
      .from('sales_invoices')
      .select('id, total_amount, cash_amount_paid, bank_amount')
      .eq('id', Number(rawInvId))
      .maybeSingle();

    if (!inv) return;

    // 1. Fetch all subsequent receipt vouchers for this invoice
    const { data: remVouchers } = await supabase
      .from('financial_vouchers')
      .select('total_amount')
      .or('voucher_type.eq.Cash Receipt Voucher,voucher_type.eq.Bank Receipt Voucher,voucher_type.eq.Cash & Bank Receipt Voucher')
      .or(`original_invoice_no.eq.${rawInvId},original_invoice_no.eq.INV-${rawInvId}`);

    const subsequentVoucherPaid = (remVouchers || []).reduce(
      (sum: number, v: any) => sum + (Number(v.total_amount) || 0),
      0
    );

    // 2. Fetch sales returns / debit notes against this invoice
    const { data: returns } = await supabase
      .from('sales_returns')
      .select('total_amount')
      .or(`original_invoice_no.eq.${rawInvId},original_invoice_no.eq.INV-${rawInvId}`);

    const totalReturned = (returns || []).reduce(
      (sum: number, r: any) => sum + (Number(r.total_amount) || 0),
      0
    );

    // 3. Upfront payments made at the time of sale
    const initialBankPaid = Number(inv.bank_amount || 0);
    const initialCashPaid = Number(inv.cash_amount_paid || 0);

    const totalPaidSoFar = initialCashPaid + initialBankPaid + subsequentVoucherPaid + totalReturned;
    const netTotal = Number(inv.total_amount || 0);
    const netOutstanding = netTotal - totalPaidSoFar;

    let targetStatus = 'Unpaid';
    if (netOutstanding <= 1) {
      targetStatus = 'Paid';
    } else if (totalPaidSoFar > 0) {
      targetStatus = 'Partial';
    }

    await supabase
      .from('sales_invoices')
      .update({ receipt_status: targetStatus })
      .eq('id', Number(rawInvId));

    return targetStatus;
  } catch (err) {
    console.error('Failed to recalculate invoice settlement status:', err);
  }
};
