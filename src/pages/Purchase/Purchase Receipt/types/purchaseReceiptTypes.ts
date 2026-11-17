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

export interface PoAllocation {
  gross: number;
  upfront: number;
  pastReceipts: number;
  due: number;
}

export interface PoAllocationsMap {
  [poNo: string]: PoAllocation;
}

export interface VendorOption {
  id: number | string;
  vendor_name: string;
  name?: string;
  contact_name?: string;
  contact_person?: string;
  cell_no?: string;
  phone_no?: string;
  phone?: string;
  city?: string;
  address?: string;
  opening_balance?: number;
  openingBalance?: number;
  balance?: number;
  balance_nature?: 'Credit' | 'Debit' | string;
  [key: string]: any;
}

export interface BankAccount {
  id: number | string;
  bankName: string;
  accountTitle: string;
  accountNumber?: string;
}

export interface CoaAccount {
  account_code: string;
  account_title: string;
  control_code?: string;
  category_code?: string;
  linked_bank_id?: string | number;
}
