import { supabase } from '../../../../Context/supabaseClient';
import { CustomerItem, SalesInvoiceItem, BankAccountItem, CoaAccountItem, CalculatedReceiptBalances, InvoiceAllocation, ReceiptFormValues } from '../types/invoiceReceiptTypes';
import { formatMoney, resolveCustomerCoaAccount } from '../utils/invoiceReceiptHelpers';

export const calculateCustomerBalances = async (
  custName: string,
  invoiceRef: string,
  allInvoices: SalesInvoiceItem[],
  currentEditVoucherId: number | null = null,
  customerOpeningBalance: number = 0
): Promise<CalculatedReceiptBalances> => {
  if (!custName) {
    return {
      customerTotalOutstanding: 0,
      customerOpeningBalance: 0,
      invGrossBill: 0,
      invPaidUpfront: 0,
      invPastReceiptsPaid: 0,
      invReturnsDeducted: 0,
      effectiveDueForThisReceipt: 0,
      invAllocationsMap: {}
    };
  }

  try {
    // If opening balance was not passed in, fetch customer row directly
    let openingBalance = Number(customerOpeningBalance) || 0;
    if (!openingBalance) {
      const { data: cRow } = await supabase
        .from('customers')
        .select('opening_balance, balance, currentBalance')
        .ilike('customer_name', custName)
        .maybeSingle();
      if (cRow) {
        openingBalance = Number(cRow.opening_balance ?? cRow.balance ?? cRow.currentBalance ?? 0);
      }
    }

    // 1. Fetch customer's invoices sorted chronologically (oldest first for FIFO general clearing)
    const customerInvoices = allInvoices.filter(i =>
      (i.customer_name || i.customerName || '').toLowerCase() === custName.toLowerCase()
    );

    const sortedCustomerInvoices = [...customerInvoices].sort((a, b) => {
      const timeA = new Date(a.invoice_date || a.created_at || 0).getTime();
      const timeB = new Date(b.invoice_date || b.created_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;

      const createdA = new Date(a.created_at || 0).getTime();
      const createdB = new Date(b.created_at || 0).getTime();
      if (createdA !== createdB) return createdA - createdB;

      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });

    // 2. Fetch past receipt vouchers for this customer
    const { data: pastVouchers } = await supabase
      .from('financial_vouchers')
      .select('id, total_amount, original_invoice_no, metadata')
      .eq('customer_name', custName)
      .or('voucher_type.eq.Cash Receipt Voucher,voucher_type.eq.Bank Receipt Voucher,voucher_type.eq.Cash & Bank Receipt Voucher,voucher_type.eq.Customer Receive Voucher');

    // 3. Fetch sales returns and refund payout receipts for this customer
    const [returnsRes, returnReceiptsRes] = await Promise.all([
      supabase
        .from('sales_returns')
        .select('id, total_amount, original_invoice_no, customer_name, inward_status, metadata, payout_amount_paid')
        .ilike('customer_name', custName),
      supabase
        .from('sales_return_receipts')
        .select('id, amount_paid, sales_return_id, return_no, invoice_no, metadata')
        .ilike('customer_name', custName)
    ]);

    const customerReturns = returnsRes.data || [];
    const returnPayoutReceipts = returnReceiptsRes.data || [];

    // Gross invoices total and upfront paid
    let totalInvoicesGross = 0;
    let totalInvoicesUpfrontPaid = 0;
    let totalCustomerReturns = 0;

    customerReturns.forEach((r: any) => {
      const isQcVerified =
        r.inward_status === 'Received' ||
        r.inward_status === 'Partially Received' ||
        r.inward_status === 'Rejected';
      const hasAcceptedAmount = r.metadata?.accepted_amount !== undefined;
      const acceptedGross =
        isQcVerified && hasAcceptedAmount
          ? Number(r.metadata.accepted_amount)
          : Number(r.total_amount) || 0;

      const receiptsForReturn = (returnPayoutReceipts || []).filter(
        (rec: any) => rec.sales_return_id === r.id || rec.return_no === r.return_no
      );
      const cashPayout =
        receiptsForReturn.reduce((sum: number, rec: any) => sum + (Number(rec.amount_paid) || 0), 0) ||
        Number(r.payout_amount_paid) ||
        0;

      const netReturnCredit = Math.max(0, acceptedGross - cashPayout);
      r._netReturnCredit = netReturnCredit;
      totalCustomerReturns += netReturnCredit;
    });

    customerInvoices.forEach(i => {
      const gross = Number(i.total_amount) || 0;
      const paid = Number(i.cash_amount_paid || 0) + Number(i.bank_amount || 0);
      totalInvoicesGross += gross;
      totalInvoicesUpfrontPaid += paid;
    });

    // Track Invoice allocations
    const allocations: Record<string, InvoiceAllocation> = {};
    let totalVouchersPaid = 0;
    let unallocatedGeneralVouchers = 0;

    // Track opening balance allocation
    if (openingBalance > 0) {
      allocations['OPENING_BALANCE'] = {
        gross: openingBalance,
        upfront: 0,
        returns: 0,
        specificVouchers: 0,
        generalAllocated: 0,
        pastReceipts: 0,
        due: openingBalance
      };
    }

    // Initialize each Invoice allocation by unique invoice ID
    sortedCustomerInvoices.forEach(i => {
      const invId = String(i.id);
      const gross = Number(i.total_amount) || 0;
      const upfront = Number(i.cash_amount_paid || 0) + Number(i.bank_amount || 0);

      // Find returns for this specific invoice
      const invoiceReturns = customerReturns.filter((r: any) => {
        const rInv = String(r.original_invoice_no || '').replace(/\D/g, '').trim();
        return rInv === invId;
      }).reduce((sum: number, r: any) => sum + (Number(r._netReturnCredit !== undefined ? r._netReturnCredit : r.total_amount) || 0), 0);

      allocations[invId] = {
        gross,
        upfront,
        returns: invoiceReturns,
        specificVouchers: 0,
        generalAllocated: 0,
        pastReceipts: 0,
        due: Math.max(0, gross - upfront - invoiceReturns)
      };
    });

    // Assign Invoice-specific vouchers and accumulate general unallocated vouchers
    (pastVouchers || []).forEach((v: any) => {
      if (currentEditVoucherId && v.id === currentEditVoucherId) return;
      const vAmt = Number(v.total_amount) || 0;
      totalVouchersPaid += vAmt;

      const vInvRef = v.original_invoice_no || v.metadata?.linkedInvoiceNo || '';
      if (vInvRef) {
        if (String(vInvRef).toUpperCase() === 'OPENING_BALANCE' && allocations['OPENING_BALANCE']) {
          allocations['OPENING_BALANCE'].specificVouchers += vAmt;
        } else {
          const cleanInvId = String(vInvRef).replace(/\D/g, '');
          if (cleanInvId && allocations[cleanInvId]) {
            allocations[cleanInvId].specificVouchers += vAmt;
          } else {
            unallocatedGeneralVouchers += vAmt;
          }
        }
      } else {
        unallocatedGeneralVouchers += vAmt;
      }
    });

    // Allocate general unallocated vouchers across opening balance and open Invoices (FIFO order)
    let generalRemaining = unallocatedGeneralVouchers;

    // FIFO: opening balance is oldest, clear it first
    if (allocations['OPENING_BALANCE']) {
      const openBalDueBeforeGen = Math.max(0, allocations['OPENING_BALANCE'].gross - allocations['OPENING_BALANCE'].specificVouchers);
      if (openBalDueBeforeGen > 0 && generalRemaining > 0) {
        const toDistribute = Math.min(openBalDueBeforeGen, generalRemaining);
        allocations['OPENING_BALANCE'].generalAllocated += toDistribute;
        generalRemaining -= toDistribute;
      }
      allocations['OPENING_BALANCE'].pastReceipts = allocations['OPENING_BALANCE'].specificVouchers + allocations['OPENING_BALANCE'].generalAllocated;
      allocations['OPENING_BALANCE'].due = Math.max(0, allocations['OPENING_BALANCE'].gross - allocations['OPENING_BALANCE'].pastReceipts);
    }

    sortedCustomerInvoices.forEach(i => {
      const invId = String(i.id);
      const alloc = allocations[invId];
      if (alloc) {
        const dueBeforeGeneral = Math.max(0, alloc.gross - alloc.upfront - alloc.returns - alloc.specificVouchers);
        if (dueBeforeGeneral > 0 && generalRemaining > 0) {
          const toDistribute = Math.min(dueBeforeGeneral, generalRemaining);
          alloc.generalAllocated += toDistribute;
          generalRemaining -= toDistribute;
        }
        alloc.pastReceipts = alloc.specificVouchers + alloc.generalAllocated;
        alloc.due = Math.max(0, alloc.gross - alloc.upfront - alloc.returns - alloc.pastReceipts);
      }
    });

    // Create dual-key map for easy lookup by either '5' or 'INV-0005'
    const finalMap: Record<string, InvoiceAllocation> = {};
    if (allocations['OPENING_BALANCE']) {
      finalMap['OPENING_BALANCE'] = allocations['OPENING_BALANCE'];
    }
    sortedCustomerInvoices.forEach(i => {
      const invId = String(i.id);
      const formattedKey = `INV-${invId.padStart(4, '0')}`;
      finalMap[invId] = allocations[invId];
      finalMap[formattedKey] = allocations[invId];
    });

    const totalReceivableGross = totalInvoicesGross + openingBalance;
    const netCustomerReceivable = Math.max(0, totalReceivableGross - totalInvoicesUpfrontPaid - totalCustomerReturns - totalVouchersPaid);

    // If OPENING_BALANCE is explicitly selected
    if (String(invoiceRef).toUpperCase() === 'OPENING_BALANCE' && allocations['OPENING_BALANCE']) {
      return {
        customerTotalOutstanding: netCustomerReceivable,
        customerOpeningBalance: openingBalance,
        invGrossBill: allocations['OPENING_BALANCE'].gross,
        invPaidUpfront: 0,
        invReturnsDeducted: 0,
        invPastReceiptsPaid: allocations['OPENING_BALANCE'].pastReceipts,
        effectiveDueForThisReceipt: allocations['OPENING_BALANCE'].due,
        invAllocationsMap: finalMap
      };
    }

    // If a specific Invoice is selected
    const cleanRefId = String(invoiceRef).replace(/\D/g, '');
    const selectedAlloc = finalMap[invoiceRef] || (cleanRefId ? finalMap[cleanRefId] : null);

    if (invoiceRef && selectedAlloc) {
      return {
        customerTotalOutstanding: netCustomerReceivable,
        customerOpeningBalance: openingBalance,
        invGrossBill: selectedAlloc.gross,
        invPaidUpfront: selectedAlloc.upfront,
        invReturnsDeducted: selectedAlloc.returns,
        invPastReceiptsPaid: selectedAlloc.pastReceipts,
        effectiveDueForThisReceipt: selectedAlloc.due,
        invAllocationsMap: finalMap
      };
    } else {
      return {
        customerTotalOutstanding: netCustomerReceivable,
        customerOpeningBalance: openingBalance,
        invGrossBill: totalReceivableGross,
        invPaidUpfront: totalInvoicesUpfrontPaid,
        invReturnsDeducted: totalCustomerReturns,
        invPastReceiptsPaid: totalVouchersPaid,
        effectiveDueForThisReceipt: netCustomerReceivable,
        invAllocationsMap: finalMap
      };
    }
  } catch (err: any) {
    console.error('Balance calculation error:', err);
    return {
      customerTotalOutstanding: 0,
      customerOpeningBalance: 0,
      invGrossBill: 0,
      invPaidUpfront: 0,
      invPastReceiptsPaid: 0,
      invReturnsDeducted: 0,
      effectiveDueForThisReceipt: 0,
      invAllocationsMap: {}
    };
  }
};

export interface SubmitInvoiceReceiptParams {
  values: ReceiptFormValues;
  selectedCustomer: string;
  selectedInvoiceNo: string;
  customersList: CustomerItem[];
  bankAccounts: BankAccountItem[];
  coaAccounts: CoaAccountItem[];
  salesInvoicesList: SalesInvoiceItem[];
  invAllocationsMap: Record<string, InvoiceAllocation>;
  effectiveDueForThisReceipt: number;
  isEditMode: boolean;
  editData?: any;
}

export const submitInvoiceReceipt = async ({
  values,
  selectedCustomer,
  selectedInvoiceNo,
  customersList,
  bankAccounts,
  coaAccounts,
  salesInvoicesList,
  invAllocationsMap,
  effectiveDueForThisReceipt,
  isEditMode,
  editData
}: SubmitInvoiceReceiptParams) => {
  if (!selectedCustomer) {
    throw new Error('Please select a customer first!');
  }

  let finalAmount = 0;
  let cashPortion = 0;
  let bankPortion = 0;

  if (values.voucherType === 'By Cash') {
    cashPortion = Number(values.amount) || 0;
    finalAmount = cashPortion;
  } else if (values.voucherType === 'By Bank') {
    bankPortion = Number(values.amount) || 0;
    finalAmount = bankPortion;
    if (!values.selectedBankId) {
      throw new Error('Please select the target bank account.');
    }
  } else if (values.voucherType === 'Split') {
    cashPortion = Number(values.cashAmount) || 0;
    bankPortion = Number(values.bankAmount) || 0;
    finalAmount = cashPortion + bankPortion;
    if (!values.selectedBankId && bankPortion > 0) {
      throw new Error('Please select the target bank account for the bank transfer portion.');
    }
  }

  if (finalAmount <= 0) {
    throw new Error('Please enter a valid collection amount greater than 0.');
  }

  if (effectiveDueForThisReceipt > 0 && finalAmount > effectiveDueForThisReceipt + 1) {
    throw new Error(`Overpayment Warning: Total customer receivable due is Rs. ${formatMoney(effectiveDueForThisReceipt)}.`);
  }

  // 1. Resolve Chart of Accounts
  const resolvedCustomer = await resolveCustomerCoaAccount(selectedCustomer, customersList);
  const customerAccountCode = resolvedCustomer.code;
  const customerAccountTitle = resolvedCustomer.title;

  // Cash COA
  const cashAccountCode = '1010-001';
  const cashAccountTitle = 'Cash in Hand';

  // Bank COA
  const selectedBankObj = bankAccounts.find((b: any) =>
    String(b.id) === String(values.selectedBankId) || String(b.bankName) === String(values.selectedBankId)
  );
  let bankAccountCode = '1020-001';
  let bankAccountTitle = selectedBankObj ? `${selectedBankObj.bankName} - ${selectedBankObj.accountTitle}` : 'Bank Account';

  if (selectedBankObj) {
    const matchedBankCoa = coaAccounts.find((c: any) =>
      (selectedBankObj.bankName && c.account_title?.toLowerCase().includes(selectedBankObj.bankName.toLowerCase())) ||
      (selectedBankObj.accountTitle && c.account_title?.toLowerCase().includes(selectedBankObj.accountTitle.toLowerCase())) ||
      (c.notes && c.notes.includes(String(selectedBankObj.id)))
    );
    if (matchedBankCoa) {
      bankAccountCode = matchedBankCoa.account_code;
      bankAccountTitle = matchedBankCoa.account_title;
    }
  }

  let balancedJournalItems: any[] = [];
  const voucherTypeRecord = 'Customer Receive Voucher';

  if (values.voucherType === 'By Cash') {
    balancedJournalItems = [
      { accountCode: cashAccountCode, accountTitle: cashAccountTitle, description: `Cash received via ${values.voucherNo}`, debit: finalAmount, credit: 0 },
      { accountCode: customerAccountCode, accountTitle: customerAccountTitle, description: `Customer credit from ${selectedCustomer}`, debit: 0, credit: finalAmount }
    ];
  } else if (values.voucherType === 'By Bank') {
    balancedJournalItems = [
      { accountCode: bankAccountCode, accountTitle: bankAccountTitle, description: `Bank wire received via ${values.voucherNo}`, debit: finalAmount, credit: 0 },
      { accountCode: customerAccountCode, accountTitle: customerAccountTitle, description: `Customer credit from ${selectedCustomer}`, debit: 0, credit: finalAmount }
    ];
  } else {
    balancedJournalItems = [
      ...(cashPortion > 0 ? [{ accountCode: cashAccountCode, accountTitle: cashAccountTitle, description: `Cash portion via ${values.voucherNo}`, debit: cashPortion, credit: 0 }] : []),
      ...(bankPortion > 0 ? [{ accountCode: bankAccountCode, accountTitle: bankAccountTitle, description: `Bank portion via ${values.voucherNo} (${bankAccountTitle})`, debit: bankPortion, credit: 0 }] : []),
      { accountCode: customerAccountCode, accountTitle: customerAccountTitle, description: `Customer credit from ${selectedCustomer}`, debit: 0, credit: finalAmount }
    ];
  }

  const methodStr = values.voucherType === 'Split'
    ? ` | Split (Cash: Rs. ${formatMoney(cashPortion)} [1010-001] + Bank: Rs. ${formatMoney(bankPortion)} [${bankAccountCode} - ${bankAccountTitle}])`
    : (values.voucherType === 'By Bank' ? ` | Target Bank: ${bankAccountCode} - ${bankAccountTitle}` : ' | Mode: Cash Drawer (1010-001)');

  const invInfoStr = selectedInvoiceNo ? ` | Linked Invoice: ${selectedInvoiceNo}` : ' | General Customer Ledger Collection';
  const compositeNarration = `Received from Customer: ${selectedCustomer} (${customerAccountCode})${invInfoStr}${methodStr} | Remarks: ${values.notes.trim()}`.trim();

  const payload = {
    voucher_no: values.voucherNo,
    voucher_type: voucherTypeRecord,
    voucher_date: values.paymentDate,
    customerName: selectedCustomer,
    customer_name: selectedCustomer,
    account_code: customerAccountCode,
    account_title: customerAccountTitle,
    debit: 0,
    credit: finalAmount,
    original_invoice_no: selectedInvoiceNo || null,
    narration: compositeNarration,
    notes: compositeNarration,
    total_amount: finalAmount,
    items: balancedJournalItems,
    metadata: {
      preset: 'CRV',
      auto_generated: Boolean(selectedInvoiceNo),
      selectedBankId: (values.voucherType === 'By Bank' || values.voucherType === 'Split') ? values.selectedBankId : null,
      selectedBankTitle: bankAccountTitle,
      bank_coa_code: bankAccountCode,
      bank_coa_title: bankAccountTitle,
      linkedInvoiceNo: selectedInvoiceNo || null,
      cashAmount: values.voucherType === 'Split' ? cashPortion : (values.voucherType === 'By Cash' ? finalAmount : 0),
      bankAmount: values.voucherType === 'Split' ? bankPortion : (values.voucherType === 'By Bank' ? finalAmount : 0),
      paymentTerm: values.voucherType,
      moduleSource: 'sales_receipt'
    }
  };

  if (isEditMode && editData?.id) {
    const { error: updateErr } = await supabase
      .from('financial_vouchers')
      .update(payload)
      .eq('id', editData.id);
    if (updateErr) throw updateErr;
  } else {
    const { error: insertErr } = await supabase
      .from('financial_vouchers')
      .insert([payload]);
    if (insertErr) throw insertErr;
  }

  // Sync with sales_invoices status if specific invoice was selected
  if (selectedInvoiceNo) {
    const cleanId = String(selectedInvoiceNo).replace(/\D/g, '');
    const targetInv = salesInvoicesList.find(i => String(i.id) === cleanId || `INV-${String(i.id).padStart(4, '0')}` === selectedInvoiceNo);
    if (targetInv) {
      const targetAlloc = invAllocationsMap[selectedInvoiceNo] || invAllocationsMap[cleanId];
      const newRemainingDue = Math.max(0, (targetAlloc ? targetAlloc.due : 0) - finalAmount);
      if (newRemainingDue <= 0.01) {
        await supabase.from('sales_invoices').update({ receipt_status: 'SETTLED' }).eq('id', targetInv.id);
      }
    }
  }
};
