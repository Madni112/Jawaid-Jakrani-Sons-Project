export interface CustomerRecord {
  id: string | number;
  customerName?: string;
  customername?: string;
  customer_name?: string;
  name?: string;
  company?: string;
  primaryPhone?: string;
  phone?: string;
  secondaryPhone?: string;
  city?: string;
  sub_area?: string;
  subArea?: string;
  area?: string;
  address?: string;
  province?: string;
  customer_code?: string;
  customerCode?: string;
  customercode?: string;
  coa_code?: string;
  account_code?: string;
  opening_balance?: number | string;
  openingBalance?: number | string;
  balance?: number | string;
  currentBalance?: number | string;
  balance_nature?: 'Debit' | 'Credit';
  balanceNature?: 'Debit' | 'Credit';
  page_no?: string | number;
  pageNo?: string | number;
  notes?: string;
  ntnNo?: string;
  created_at?: string;
}

export interface COAAccount {
  id?: string | number;
  account_code: string;
  account_title: string;
  category_code?: string;
  sub_category_code?: string;
  control_code?: string;
  opening_balance?: number;
  balance_nature?: 'Debit' | 'Credit';
  notes?: string;
}
