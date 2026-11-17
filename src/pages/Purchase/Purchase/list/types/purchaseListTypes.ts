export interface PurchaseItem {
  id?: string | number;
  skuCode?: string;
  itemCode?: string;
  item_sr_no?: string;
  itemName?: string;
  product_name?: string;
  pDescription?: string;
  qty?: number | string;
  quantity?: number | string;
  costPricePerBox?: number | string;
  cost_price?: number | string;
  rate?: number | string;
  purchase_price?: number | string;
  costPrice?: number | string;
  discountAmt?: number | string;
  disAmt?: number | string;
  totalAmount?: number | string;
  netTotal?: number | string;
  total?: number | string;
  warehouse?: string;
  location?: string;
  uom?: string;
}

export interface PurchaseRecord {
  id: string | number;
  purchase_no?: string;
  supplier_name?: string;
  vendor_name?: string;
  purchase_date?: string;
  payment_term?: string;
  total_amount?: number | string;
  cash_amount_paid?: number | string;
  bank_amount_paid?: number | string;
  amount_paid?: number | string;
  target_warehouse?: string;
  purchase_type?: string;
  freight_charges?: number | string;
  transport_charges?: number | string;
  created_at?: string;
  metadata?: Record<string, any>;
  items?: PurchaseItem[];
}

export interface AllocationMapEntry {
  totalPaid: number;
  due: number;
  returned?: number;
  generalAllocated?: number;
  specificVouchers?: number;
}

export interface UnbilledGRN {
  id: string | number;
  grn_no?: string;
  vendor_name?: string;
  receipt_date?: string;
  status?: string;
  grn_items?: any[];
  [key: string]: any;
}
