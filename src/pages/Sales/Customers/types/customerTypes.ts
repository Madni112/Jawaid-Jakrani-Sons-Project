export interface CustomerFormValues {
  customerName: string;
  subArea: string;
  area: string;
  city?: string;
  customer_code: string;
  page_no: string;
  registrationType: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  province?: string;
  company?: string;
  website?: string;
  ntnNo?: string;
  cnicNo?: string;
  stRegNo?: string;
  notes?: string;
  followUpDate?: string;
  openingBalance: number | string;
  balanceNature: 'Debit' | 'Credit';
  openingBalanceDate: string;
  [key: string]: any;
}

export interface CustomerLocation {
  subArea: string;
  area: string;
}
