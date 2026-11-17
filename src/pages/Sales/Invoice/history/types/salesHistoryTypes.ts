export interface InvoiceBalanceInfo {
  upfront: number;
  receipts: number;
  returns: number;
  received: number;
  remaining: number;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface SaleTypeInfo {
  isExchange: boolean;
  label: string;
  shortLabel: string;
  tooltip: string;
  className: string;
}
