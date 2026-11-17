export interface PurchaseReportFilters {
  supplier?: any;
  vendor?: any;
  location?: any;
  parentCategory?: any;
  category?: any;
  subCategory?: any;
  subSubCategory?: any;
  product?: any;
  brand?: any;
  bin?: any;
  uom?: any;
  purchaseType?: any;
  saleType?: any;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

export interface PurchaseReportSummaryMetrics {
  count: number;
  totalSpend?: number;
  totalUnits?: number;
  grossSpend?: number;
  retSpend?: number;
  netSpend?: number;
}

export type PurchaseReportType =
  | 'purchase'
  | 'return'
  | 'purchase-query'
  | 'category-purchases'
  | 'product-purchase-history'
  | 'purchase-invoice-detail';

export type PurchaseViewMode = 'summary' | 'detailed';
