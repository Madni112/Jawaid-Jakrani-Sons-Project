export type FilterFieldType =
  | 'customerCategory'
  | 'invoice'
  | 'customer'
  | 'salesman'
  | 'transport'
  | 'supplier'
  | 'location'
  | 'parentCategory'
  | 'subCategory'
  | 'subSubCategory'
  | 'product'
  | 'brand'
  | 'uom'
  | 'saleType'
  | 'saleMethod'
  | 'taxScenario'
  | 'accountType'
  | 'city'
  | 'area'
  | 'voucherType';

export interface ReportConfig {
  id: string;
  title: string;
  categoryName: string;
  subtitle: string;
  badge?: string;
  badgeType?: 'new' | 'audited' | 'accrual';
  createdAt?: string;
  icon: any;
  targetPrintPath: string;
  printType: string;
  tab?: number;
  hideDateFilter?: boolean;
  singleDateFilter?: boolean;
  fields: FilterFieldType[];
}

export interface FilterCriteria {
  city: string[];
  area: string[];
  customer: string[];
  supplier: string[];
  salesman: string[];
  transport: string[];
  parentCategory: string[];
  subCategory: string[];
  subSubCategory: string[];
  uom: string[];
  bin: string[];
  product: string[];
  location: string[];
  customerCategory?: string[];
  saleType: string;
  saleMethod: string;
  invoiceNo: string;
  taxScenario: string;
  accountType: string;
  voucherType: string[] | string;
  sortBy: string;
  dateFrom: string;
  dateTo: string;
  showZeroSales: boolean;
  showZeroValues: boolean;
  showOnlyTransacted: boolean;
  viewMode?: 'summary' | 'detailed';
  [key: string]: any;
}

export interface FilterPreset {
  id: string;
  name: string;
  criteria: FilterCriteria;
}
