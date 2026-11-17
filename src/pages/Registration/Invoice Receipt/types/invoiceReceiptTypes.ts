export interface CustomerItem {
  id: string | number;
  customer_name: string;
  customerName?: string;
  customername?: string;
  name?: string;
  customer_code?: string;
  customerCode?: string;
  coa_code?: string;
  contact_name?: string;
  contact_person?: string;
  company?: string;
  phone?: string;
  cell_no?: string;
  phone_no?: string;
  primaryPhone?: string;
  city?: string;
  address?: string;
  opening_balance?: number;
  balance?: number;
  currentBalance?: number;
}

export interface BankAccountItem {
  id: string | number;
  bankName: string;
  accountTitle: string;
  accountNumber?: string;
}

export interface CoaAccountItem {
  account_code: string;
  account_title: string;
  control_code?: string;
  category_code?: string;
  notes?: string;
}

export interface SalesInvoiceItem {
  id: string | number;
  total_amount?: number | string;
  cash_amount_paid?: number | string;
  bank_amount?: number | string;
  customer_name?: string;
  customerName?: string;
  invoice_date?: string;
  created_at?: string;
  dispatch_warehouse?: string;
  receipt_status?: string;
}

export interface InvoiceAllocation {
  gross: number;
  upfront: number;
  returns: number;
  specificVouchers: number;
  generalAllocated: number;
  pastReceipts: number;
  due: number;
}

export interface ReceiptFormValues {
  voucherNo: string;
  voucherType: 'By Cash' | 'By Bank' | 'Split' | string;
  selectedBankId: string;
  paymentDate: string;
  amount: number | string;
  cashAmount: number | string;
  bankAmount: number | string;
  notes: string;
}

export interface CalculatedReceiptBalances {
  customerTotalOutstanding: number;
  customerOpeningBalance: number;
  invGrossBill: number;
  invPaidUpfront: number;
  invPastReceiptsPaid: number;
  invReturnsDeducted: number;
  effectiveDueForThisReceipt: number;
  invAllocationsMap: Record<string, InvoiceAllocation>;
}
