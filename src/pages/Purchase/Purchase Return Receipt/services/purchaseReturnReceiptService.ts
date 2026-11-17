import { supabase } from '../../../../Context/supabaseClient';
import { VendorReturnBalances } from '../types/purchaseReturnReceiptTypes';
import { formatMoney, resolveVendorCoaAccount } from '../utils/purchaseReturnReceiptHelpers';

export const calculateVendorReturnBalances = async (
  vendorName: string,
  returnNumber: string,
  allReturns: any[],
  currentEditReceiptId: number | null = null
): Promise<VendorReturnBalances> => {
  if (!vendorName) {
    return {
      vendorTotalOutstandingReceivable: 0,
      returnGrossBill: 0,
      returnCreditAdjusted: 0,
      returnPaidUpfront: 0,
      returnPastReceiptsPaid: 0,
      effectiveDueForThisReceipt: 0,
      returnAllocationsMap: {},
    };
  }

  try {
    // 1. Fetch vendor's purchases to determine available open payable capacity
    const { data: vendorPurchases } = await supabase
      .from('supplier_purchases')
      .select('total_amount, cash_amount_paid, bank_amount_paid, remaining_balance')
      .ilike('supplier_name', vendorName);

    const { data: vendorPaymentVouchers } = await supabase
      .from('financial_vouchers')
      .select('total_amount')
      .ilike('customer_name', vendorName)
      .or(
        'voucher_type.eq.Cash Payment Voucher,voucher_type.eq.Bank Payment Voucher,voucher_type.eq.Cash & Bank Payment Voucher'
      );

    let totalPurchasesGross = 0;
    let totalPurchasesUpfrontPaid = 0;
    (vendorPurchases || []).forEach((p: any) => {
      totalPurchasesGross += Number(p.total_amount) || 0;
      totalPurchasesUpfrontPaid += Number(p.cash_amount_paid || 0) + Number(p.bank_amount_paid || 0);
    });

    let totalVouchersPaid = 0;
    (vendorPaymentVouchers || []).forEach((v: any) => {
      totalVouchersPaid += Number(v.total_amount) || 0;
    });

    const openPayableCapacity = Math.max(0, totalPurchasesGross - totalPurchasesUpfrontPaid - totalVouchersPaid);

    // 2. Fetch vendor's returns sorted chronologically
    const vendorReturns = allReturns.filter(
      (r) => (r.vendor_name || r.supplier_name || '').toLowerCase() === vendorName.toLowerCase()
    );

    const sortedVendorReturns = [...vendorReturns].sort((a, b) => {
      const timeA = new Date(a.return_date || a.created_at || 0).getTime();
      const timeB = new Date(b.return_date || b.created_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;

      const createdA = new Date(a.created_at || 0).getTime();
      const createdB = new Date(b.created_at || 0).getTime();
      if (createdA !== createdB) return createdA - createdB;

      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });

    // 3. Fetch past refund receipts for this vendor
    const { data: pastReceipts } = await supabase
      .from('purchase_return_receipts')
      .select('id, amount_received, return_no, metadata')
      .ilike('vendor_name', vendorName);

    let totalReturnsGross = 0;
    let totalReturnsUpfrontCollected = 0;
    let totalReturnsCreditAdjusted = 0;

    const allocations: Record<
      string,
      {
        gross: number;
        upfront: number;
        creditAdjusted: number;
        specificReceipts: number;
        generalAllocated: number;
        pastReceipts: number;
        due: number;
      }
    > = {};
    let totalReceiptsCollected = 0;
    let unallocatedGeneralReceipts = 0;

    let remainingPayablePool = openPayableCapacity;

    sortedVendorReturns.forEach((r) => {
      const key = r.return_no;
      const gross = Number(r.total_amount) || 0;
      const upfront = Number(r.amount_paid) || 0;
      const returnNetAfterUpfront = Math.max(0, gross - upfront);

      const isCreditReturn =
        r.payment_term === 'On Credit' ||
        r.metadata?.paymentTerm === 'On Credit' ||
        (Array.isArray(r.metadata?.matchedInvoices) && r.metadata.matchedInvoices.length > 0);

      let creditAdjusted = 0;
      if (isCreditReturn) {
        creditAdjusted = Math.min(returnNetAfterUpfront, remainingPayablePool);
        remainingPayablePool -= creditAdjusted;
      }

      totalReturnsGross += gross;
      totalReturnsUpfrontCollected += upfront;
      totalReturnsCreditAdjusted += creditAdjusted;

      allocations[key] = {
        gross,
        upfront,
        creditAdjusted,
        specificReceipts: 0,
        generalAllocated: 0,
        pastReceipts: 0,
        due: 0,
      };
    });

    (pastReceipts || []).forEach((rec: any) => {
      if (currentEditReceiptId && rec.id === currentEditReceiptId) return;

      const amt = Number(rec.amount_received) || 0;
      totalReceiptsCollected += amt;

      const matchedKey = rec.return_no;
      if (matchedKey && allocations[matchedKey]) {
        allocations[matchedKey].specificReceipts += amt;
      } else {
        unallocatedGeneralReceipts += amt;
      }
    });

    let pool = unallocatedGeneralReceipts;
    sortedVendorReturns.forEach((r) => {
      const key = r.return_no;
      const item = allocations[key];
      if (item) {
        const netBeforeGeneral = Math.max(0, item.gross - item.upfront - item.creditAdjusted - item.specificReceipts);
        if (netBeforeGeneral > 0 && pool > 0) {
          const absorb = Math.min(netBeforeGeneral, pool);
          item.generalAllocated += absorb;
          pool -= absorb;
        }
      }
    });

    sortedVendorReturns.forEach((r) => {
      const key = r.return_no;
      const item = allocations[key];
      if (item) {
        item.pastReceipts = item.specificReceipts + item.generalAllocated;
        item.due = Math.max(0, item.gross - item.upfront - item.creditAdjusted - item.pastReceipts);
      }
    });

    const netOverallReceivableDebt = Math.max(
      0,
      totalReturnsGross - totalReturnsCreditAdjusted - totalReturnsUpfrontCollected - totalReceiptsCollected
    );

    let specificReturnGross = 0;
    let specificReturnCreditAdjusted = 0;
    let specificReturnUpfront = 0;
    let specificReturnPastReceipts = 0;
    let effectiveDue = netOverallReceivableDebt;

    if (returnNumber && allocations[returnNumber]) {
      const selectedAlloc = allocations[returnNumber];
      specificReturnGross = selectedAlloc.gross;
      specificReturnCreditAdjusted = selectedAlloc.creditAdjusted;
      specificReturnUpfront = selectedAlloc.upfront;
      specificReturnPastReceipts = selectedAlloc.pastReceipts;
      effectiveDue = selectedAlloc.due;
    }

    return {
      vendorTotalOutstandingReceivable: netOverallReceivableDebt,
      returnGrossBill: specificReturnGross,
      returnCreditAdjusted: specificReturnCreditAdjusted,
      returnPaidUpfront: specificReturnUpfront,
      returnPastReceiptsPaid: specificReturnPastReceipts,
      effectiveDueForThisReceipt: effectiveDue,
      returnAllocationsMap: allocations,
    };
  } catch (err: any) {
    console.error('Error in calculateVendorReturnBalances:', err);
    return {
      vendorTotalOutstandingReceivable: 0,
      returnGrossBill: 0,
      returnCreditAdjusted: 0,
      returnPaidUpfront: 0,
      returnPastReceiptsPaid: 0,
      effectiveDueForThisReceipt: 0,
      returnAllocationsMap: {},
    };
  }
};

export const submitPurchaseReturnReceipt = async ({
  values,
  selectedVendor,
  selectedReturnNo,
  vendorOptions,
  bankAccounts,
  coaAccounts,
  returnGrossBill,
  returnPaidUpfront,
  returnPastReceiptsPaid,
  effectiveDueForThisReceipt,
  isEditMode,
  editData,
}: {
  values: any;
  selectedVendor: string;
  selectedReturnNo: string;
  vendorOptions: any[];
  bankAccounts: any[];
  coaAccounts: any[];
  returnGrossBill: number;
  returnPaidUpfront: number;
  returnPastReceiptsPaid: number;
  effectiveDueForThisReceipt: number;
  isEditMode: boolean;
  editData?: any;
}) => {
  let finalAmount = 0;
  let cashPortion = 0;
  let bankPortion = 0;

  if (values.paymentMethod === 'By Cash') {
    cashPortion = Number(values.amount) || 0;
    finalAmount = cashPortion;
  } else if (values.paymentMethod === 'By Bank') {
    bankPortion = Number(values.amount) || 0;
    finalAmount = bankPortion;
  } else if (values.paymentMethod === 'Split') {
    cashPortion = Number(values.cashAmount) || 0;
    bankPortion = Number(values.bankAmount) || 0;
    finalAmount = cashPortion + bankPortion;
  }

  // 1. Resolve Chart of Accounts
  const vendorAcc = await resolveVendorCoaAccount(selectedVendor, vendorOptions);
  const vendorAccountCode = vendorAcc.code;
  const cashAccountCode = '1010-001';

  const selectedBankObj = bankAccounts.find(
    (b: any) => String(b.id) === String(values.selectedBankId) || String(b.bankName) === String(values.selectedBankId)
  );
  const bankCoa = coaAccounts.find(
    (c: any) =>
      (selectedBankObj &&
        (String(c.linked_bank_id) === String(selectedBankObj.id) ||
          String(c.account_code) === String(selectedBankObj.accountNumber) ||
          String(c.account_title || '')
            .toLowerCase()
            .includes(String(selectedBankObj.bankName || '').toLowerCase()))) ||
      String(c.control_code || '')
        .toLowerCase()
        .includes('bank')
  );
  const bankAccountCode = bankCoa ? String(bankCoa.account_code) : selectedBankObj?.accountNumber || '1020-001';

  // 2. Prepare receipt payload
  const receiptPayload = {
    receipt_no: values.receiptNo,
    return_no: selectedReturnNo || null,
    vendor_name: selectedVendor,
    payment_date: values.paymentDate,
    payment_method: values.paymentMethod,
    payment_mode: values.paymentMethod,
    amount_received: finalAmount,
    amount_paid: finalAmount,
    bank_name: selectedBankObj?.bankName || null,
    notes: values.notes.trim() || null,
    remarks: values.notes.trim() || null,
    metadata: {
      selectedBankId: values.paymentMethod === 'By Bank' || values.paymentMethod === 'Split' ? values.selectedBankId : null,
      selectedBankTitle: selectedBankObj
        ? `${selectedBankObj.bankName} - ${selectedBankObj.accountTitle || selectedBankObj.accountNumber}`
        : null,
      linkedReturnNo: selectedReturnNo || null,
      cashAmount: cashPortion,
      bankAmount: bankPortion,
      paymentMethod: values.paymentMethod,
      returnGross: returnGrossBill,
      previousCollected: returnPaidUpfront + returnPastReceiptsPaid,
      remainingDueAfterReceipt: Math.max(0, effectiveDueForThisReceipt - finalAmount),
    },
  };

  let savedReceiptId = editData?.id;

  if (isEditMode) {
    const { error: updateErr } = await supabase
      .from('purchase_return_receipts')
      .update(receiptPayload)
      .eq('id', editData.id);
    if (updateErr) throw updateErr;
  } else {
    const { data: insertedRec, error: insertErr } = await supabase
      .from('purchase_return_receipts')
      .insert([receiptPayload])
      .select('id')
      .single();
    if (insertErr) throw insertErr;
    savedReceiptId = insertedRec?.id;
  }

  // 3. Balanced Journal Entries in financial_vouchers (VRV)
  let balancedJournalItems: any[] = [];
  const voucherTypeRecord = 'Vendor Receive Voucher';

  if (values.paymentMethod === 'By Cash') {
    balancedJournalItems = [
      {
        accountCode: cashAccountCode,
        description: `Cash refund recovered from ${selectedVendor} (${vendorAcc.title}) via ${values.receiptNo}`,
        debit: finalAmount,
        credit: 0,
      },
      {
        accountCode: vendorAccountCode,
        description: `Debit note settlement for ${selectedReturnNo || 'General Returns'}`,
        debit: 0,
        credit: finalAmount,
      },
    ];
  } else if (values.paymentMethod === 'By Bank') {
    balancedJournalItems = [
      {
        accountCode: bankAccountCode,
        description: `Bank wire refund received from ${selectedVendor} (${vendorAcc.title}) via ${values.receiptNo}`,
        debit: finalAmount,
        credit: 0,
      },
      {
        accountCode: vendorAccountCode,
        description: `Debit note settlement for ${selectedReturnNo || 'General Returns'}`,
        debit: 0,
        credit: finalAmount,
      },
    ];
  } else {
    balancedJournalItems = [
      ...(cashPortion > 0
        ? [
            {
              accountCode: cashAccountCode,
              description: `Cash refund recovered via ${values.receiptNo}`,
              debit: cashPortion,
              credit: 0,
            },
          ]
        : []),
      ...(bankPortion > 0
        ? [
            {
              accountCode: bankAccountCode,
              description: `Bank wire refund received via ${values.receiptNo}`,
              debit: bankPortion,
              credit: 0,
            },
          ]
        : []),
      {
        accountCode: vendorAccountCode,
        description: `Debit note settlement for ${selectedReturnNo || 'General Returns'}`,
        debit: 0,
        credit: finalAmount,
      },
    ];
  }

  const methodStr =
    values.paymentMethod === 'Split'
      ? ` | Split (Cash: Rs. ${formatMoney(cashPortion)} + Bank: Rs. ${formatMoney(bankPortion)} via ${selectedBankObj?.bankName || values.selectedBankId})`
      : values.paymentMethod === 'By Bank'
      ? ` | Receiving Bank: ${selectedBankObj?.bankName || values.selectedBankId}`
      : ' | Mode: Cash Drawer';

  const rtnInfoStr = selectedReturnNo ? ` | Linked Return Note: ${selectedReturnNo}` : ' | General Return Balance Recovery';
  const compositeNarration = `Vendor Refund Collected: ${selectedVendor}${rtnInfoStr}${methodStr} | Remarks: ${values.notes.trim()}`.trim();

  const voucherPayload = {
    voucher_no: values.receiptNo,
    voucher_type: voucherTypeRecord,
    voucher_date: values.paymentDate,
    customerName: selectedVendor,
    customer_name: selectedVendor,
    original_invoice_no: selectedReturnNo || null,
    narration: compositeNarration,
    notes: compositeNarration,
    total_amount: finalAmount,
    items: balancedJournalItems,
    metadata: {
      preset: 'VRV',
      auto_generated: Boolean(selectedReturnNo),
      selectedBankId: values.paymentMethod === 'By Bank' || values.paymentMethod === 'Split' ? values.selectedBankId : null,
      selectedBankTitle: selectedBankObj ? `${selectedBankObj.bankName} - ${selectedBankObj.accountTitle}` : null,
      linkedReturnNo: selectedReturnNo || null,
      cashAmount: cashPortion,
      bankAmount: bankPortion,
      paymentTerm: values.paymentMethod,
      moduleSource: 'purchase_return_receipt',
    },
  };

  const { data: existingVoucher } = await supabase
    .from('financial_vouchers')
    .select('id')
    .eq('voucher_no', values.receiptNo)
    .maybeSingle();

  if (existingVoucher) {
    await supabase.from('financial_vouchers').update(voucherPayload).eq('id', existingVoucher.id);
  } else {
    await supabase.from('financial_vouchers').insert([voucherPayload]);
  }

  return { savedReceiptId, finalAmount };
};
