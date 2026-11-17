import { supabase } from '../../../../Context/supabaseClient';
import { resolveCustomerCoaAccount } from './returnReceiptCoaService';

interface SubmitReturnReceiptParams {
  values: any;
  selectedCustomer: string;
  customerOptions: any[];
  bankAccounts: any[];
  coaAccounts: any[];
  selectedReturnNo: string;
  selectedReturnObj: any;
  returnOptions: any[];
  returnGrossBill: number;
  returnPaidUpfront: number;
  returnPastReceiptsPaid: number;
  effectiveDueForThisReceipt: number;
  isEditMode: boolean;
  editData: any;
  formatMoney: (val: number | string | undefined | null) => string;
}

export const submitSalesReturnReceiptAction = async ({
  values,
  selectedCustomer,
  customerOptions,
  bankAccounts,
  coaAccounts,
  selectedReturnNo,
  selectedReturnObj,
  returnOptions,
  returnGrossBill,
  returnPaidUpfront,
  returnPastReceiptsPaid,
  effectiveDueForThisReceipt,
  isEditMode,
  editData,
  formatMoney
}: SubmitReturnReceiptParams): Promise<number | string> => {
  let finalAmount = 0;
  let cashPortion = 0;
  let bankPortion = 0;

  if (values.paymentMethod === 'By Cash') {
    cashPortion = Number(values.amount) || 0;
    finalAmount = cashPortion;
  } else if (values.paymentMethod === 'By Bank') {
    bankPortion = Number(values.amount) || 0;
    finalAmount = bankPortion;
    if (!values.selectedBankId) {
      throw new Error('Please select the disbursing bank account.');
    }
  } else if (values.paymentMethod === 'Split') {
    cashPortion = Number(values.cashAmount) || 0;
    bankPortion = Number(values.bankAmount) || 0;
    finalAmount = cashPortion + bankPortion;
    if (!values.selectedBankId && bankPortion > 0) {
      throw new Error('Please select the disbursing bank account for the bank transfer portion.');
    }
  } else if (values.paymentMethod === 'Adjust Ledger') {
    finalAmount = Number(values.amount) || effectiveDueForThisReceipt || 0;
  }

  const ledgerOffset = Math.max(0, effectiveDueForThisReceipt - finalAmount);
  if (finalAmount <= 0 && ledgerOffset <= 0) {
    throw new Error('Please enter a valid refund payout amount or select a return note to adjust.');
  }

  if (effectiveDueForThisReceipt > 0 && finalAmount > effectiveDueForThisReceipt + 1) {
    const confirmOver = window.confirm(
      `Disbursed refund amount (Rs. ${formatMoney(finalAmount)}) exceeds the pending customer refund balance (Rs. ${formatMoney(effectiveDueForThisReceipt)}). Proceed anyway?`
    );
    if (!confirmOver) throw new Error('Action cancelled by user.');
  }

  // 1. Resolve Chart of Accounts
  const resolvedCustomer = await resolveCustomerCoaAccount(selectedCustomer, customerOptions);
  const customerAccountCode = resolvedCustomer.code;
  const customerAccountTitle = resolvedCustomer.title;

  const cashAccountCode = '1010-001';
  const cashAccountTitle = 'Cash in Hand';

  const selectedBankObj = bankAccounts.find(
    (b: any) =>
      String(b.id) === String(values.selectedBankId) ||
      String(b.bankName) === String(values.selectedBankId)
  );
  let bankAccountCode = '1020-001';
  let bankAccountTitle = selectedBankObj
    ? `${selectedBankObj.bankName} - ${selectedBankObj.accountTitle}`
    : 'Bank Account';

  if (selectedBankObj) {
    const matchedBankCoa = coaAccounts.find(
      (c: any) =>
        (selectedBankObj.bankName &&
          c.account_title?.toLowerCase().includes(selectedBankObj.bankName.toLowerCase())) ||
        (selectedBankObj.accountTitle &&
          c.account_title?.toLowerCase().includes(selectedBankObj.accountTitle.toLowerCase())) ||
        (c.notes && c.notes.includes(String(selectedBankObj.id)))
    );
    if (matchedBankCoa) {
      bankAccountCode = matchedBankCoa.account_code;
      bankAccountTitle = matchedBankCoa.account_title;
    }
  }

  // 2. Prepare sales_return_receipts record
  const targetReturnId =
    selectedReturnObj?.id ||
    (selectedReturnNo
      ? returnOptions.find((r) => r.return_no === selectedReturnNo || r.invoice_no === selectedReturnNo)?.id
      : null);

  const receiptPayload = {
    receipt_no: values.receiptNo,
    sales_return_id: targetReturnId || null,
    invoice_no: selectedReturnNo || selectedReturnObj?.invoice_no || null,
    return_no: selectedReturnNo || selectedReturnObj?.return_no || null,
    customer_name: selectedCustomer,
    payment_date: values.paymentDate,
    payment_mode:
      values.paymentMethod === 'By Bank'
        ? 'Bank'
        : values.paymentMethod === 'Split'
        ? 'Split'
        : values.paymentMethod === 'Adjust Ledger'
        ? 'Credit Ledger'
        : 'Cash',
    settlement_mode:
      values.paymentMethod === 'By Bank'
        ? 'Bank'
        : values.paymentMethod === 'Split'
        ? 'Split'
        : values.paymentMethod === 'Adjust Ledger'
        ? 'On Credit'
        : 'Cash',
    payment_method: values.paymentMethod,
    bank_name: selectedBankObj?.bankName || null,
    amount_paid: finalAmount,
    notes: values.notes.trim() || null,
    remarks: values.notes.trim() || null,
    metadata: {
      selectedBankId:
        values.paymentMethod === 'By Bank' || values.paymentMethod === 'Split'
          ? values.selectedBankId
          : null,
      selectedBankTitle: bankAccountTitle,
      bank_coa_code: bankAccountCode,
      bank_coa_title: bankAccountTitle,
      linkedReturnNo: selectedReturnNo || null,
      cashAmount: cashPortion,
      bankAmount: bankPortion,
      ledgerAdjusted: ledgerOffset,
      totalSettled: finalAmount + ledgerOffset,
      paymentMethod: values.paymentMethod,
      returnGross: returnGrossBill,
      previousCollected: returnPaidUpfront + returnPastReceiptsPaid,
      remainingDueAfterReceipt: Math.max(0, effectiveDueForThisReceipt - finalAmount - ledgerOffset)
    }
  };

  let savedReceiptId = editData?.id;

  if (isEditMode) {
    const { error: updateErr } = await supabase
      .from('sales_return_receipts')
      .update(receiptPayload)
      .eq('id', editData.id);
    if (updateErr) throw updateErr;
  } else {
    const { data: insertedRec, error: insertErr } = await supabase
      .from('sales_return_receipts')
      .insert([receiptPayload])
      .select('id')
      .single();
    if (insertErr) throw insertErr;
    savedReceiptId = insertedRec?.id;
  }

  // 3. Balanced Journal Entries in financial_vouchers (CPV - Customer Payment Voucher)
  let balancedJournalItems: any[] = [];
  const voucherTypeRecord =
    values.paymentMethod === 'Adjust Ledger'
      ? 'Customer Return Credit Voucher'
      : 'Customer Payment Voucher';

  if (values.paymentMethod === 'By Cash') {
    balancedJournalItems = [
      {
        accountCode: customerAccountCode,
        accountTitle: customerAccountTitle,
        description: `Sales return refund paid to ${selectedCustomer} via ${values.receiptNo}`,
        debit: finalAmount,
        credit: 0
      },
      {
        accountCode: cashAccountCode,
        accountTitle: cashAccountTitle,
        description: `Cash payout from drawer via ${values.receiptNo}`,
        debit: 0,
        credit: finalAmount
      }
    ];
  } else if (values.paymentMethod === 'By Bank') {
    balancedJournalItems = [
      {
        accountCode: customerAccountCode,
        accountTitle: customerAccountTitle,
        description: `Sales return bank refund paid to ${selectedCustomer} via ${values.receiptNo}`,
        debit: finalAmount,
        credit: 0
      },
      {
        accountCode: bankAccountCode,
        accountTitle: bankAccountTitle,
        description: `Bank payout via ${values.receiptNo}`,
        debit: 0,
        credit: finalAmount
      }
    ];
  } else if (values.paymentMethod === 'Adjust Ledger') {
    balancedJournalItems = [
      {
        accountCode: customerAccountCode,
        accountTitle: customerAccountTitle,
        description: `Sales return credit ledger adjustment for ${selectedCustomer} via ${values.receiptNo}`,
        debit: 0,
        credit: finalAmount
      }
    ];
  } else {
    balancedJournalItems = [
      {
        accountCode: customerAccountCode,
        accountTitle: customerAccountTitle,
        description: `Sales return refund paid to ${selectedCustomer} via ${values.receiptNo}`,
        debit: finalAmount,
        credit: 0
      },
      ...(cashPortion > 0
        ? [
            {
              accountCode: cashAccountCode,
              accountTitle: cashAccountTitle,
              description: `Cash payout via ${values.receiptNo}`,
              debit: 0,
              credit: cashPortion
            }
          ]
        : []),
      ...(bankPortion > 0
        ? [
            {
              accountCode: bankAccountCode,
              accountTitle: bankAccountTitle,
              description: `Bank payout via ${values.receiptNo} (${bankAccountTitle})`,
              debit: 0,
              credit: bankPortion
            }
          ]
        : [])
    ];
  }

  const methodStr =
    values.paymentMethod === 'Split'
      ? ` | Split (Cash: Rs. ${formatMoney(cashPortion)} [1010-001] + Bank: Rs. ${formatMoney(
          bankPortion
        )} [${bankAccountCode} - ${bankAccountTitle}])`
      : values.paymentMethod === 'By Bank'
      ? ` | Source Bank: ${bankAccountCode} - ${bankAccountTitle}`
      : values.paymentMethod === 'Adjust Ledger'
      ? ' | Adjusted against Customer Ledger'
      : ' | Mode: Cash Drawer (1010-001)';

  const rtnInfoStr = selectedReturnNo ? ` | Linked Return: ${selectedReturnNo}` : ' | General Return Balance Payout';
  const compositeNarration = `Customer Sales Return Refund Disbursed: ${selectedCustomer} (${customerAccountCode})${rtnInfoStr}${methodStr} | Remarks: ${values.notes.trim()}`.trim();

  const voucherPayload = {
    voucher_no: values.receiptNo,
    voucher_type: voucherTypeRecord,
    voucher_date: values.paymentDate,
    customerName: selectedCustomer,
    customer_name: selectedCustomer,
    account_code: customerAccountCode,
    account_title: customerAccountTitle,
    debit: values.paymentMethod === 'Adjust Ledger' ? 0 : finalAmount,
    credit: values.paymentMethod === 'Adjust Ledger' ? finalAmount : 0,
    original_invoice_no: selectedReturnNo || null,
    narration: compositeNarration,
    notes: compositeNarration,
    total_amount: finalAmount,
    items: balancedJournalItems,
    metadata: {
      preset: 'CPV',
      auto_generated: Boolean(selectedReturnNo),
      selectedBankId:
        values.paymentMethod === 'By Bank' || values.paymentMethod === 'Split'
          ? values.selectedBankId
          : null,
      selectedBankTitle: bankAccountTitle,
      bank_coa_code: bankAccountCode,
      bank_coa_title: bankAccountTitle,
      linkedReturnNo: selectedReturnNo || null,
      cashAmount: cashPortion,
      bankAmount: bankPortion,
      paymentTerm: values.paymentMethod,
      moduleSource: 'sales_return_receipt'
    }
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

  // 4. Update specific sales_returns record if linked
  if (targetReturnId) {
    const { data: allReceiptsForReturn } = await supabase
      .from('sales_return_receipts')
      .select('id, amount_paid')
      .eq('sales_return_id', targetReturnId);

    const totalReceiptsSum = (allReceiptsForReturn || []).reduce(
      (acc: number, r: any) => acc + (Number(r.amount_paid) || 0),
      0
    );
    const targetReturn = returnOptions.find((r) => r.id === targetReturnId);
    const upfrontPaid = Number(
      targetReturn?.payout_amount_paid ||
        Number(targetReturn?.cash_amount_paid || 0) + Number(targetReturn?.bank_amount || 0) ||
        targetReturn?.amount_paid ||
        0
    );
    const newTotalPaid = upfrontPaid + totalReceiptsSum;
    const hasAcceptedAmount = targetReturn?.metadata?.accepted_amount !== undefined;
    const returnGross = hasAcceptedAmount
      ? Number(targetReturn.metadata.accepted_amount)
      : Number(targetReturn?.total_amount || targetReturn?.total_net_amount || 0);

    const isFullySettled = newTotalPaid + ledgerOffset >= returnGross - 1;
    await supabase
      .from('sales_returns')
      .update({
        payout_amount_paid: newTotalPaid,
        status:
          values.paymentMethod === 'Adjust Ledger' || isFullySettled
            ? 'Refunded'
            : 'Partial Refund'
      })
      .eq('id', targetReturnId);
  }

  return savedReceiptId;
};
