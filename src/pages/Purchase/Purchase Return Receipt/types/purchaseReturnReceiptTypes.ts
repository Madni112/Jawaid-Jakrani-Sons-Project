export interface ReceiptFormValues {
  receiptNo: string;
  paymentMethod: 'By Cash' | 'By Bank' | 'Split';
  selectedBankId: string;
  paymentDate: string;
  amount: number | string;
  cashAmount: number | string;
  bankAmount: number | string;
  notes: string;
}

export interface ReturnAllocation {
  gross: number;
  upfront: number;
  creditAdjusted: number;
  pastReceipts: number;
  due: number;
}

export interface VendorReturnBalances {
  vendorTotalOutstandingReceivable: number;
  returnGrossBill: number;
  returnCreditAdjusted: number;
  returnPaidUpfront: number;
  returnPastReceiptsPaid: number;
  effectiveDueForThisReceipt: number;
  returnAllocationsMap: Record<string, ReturnAllocation>;
}
