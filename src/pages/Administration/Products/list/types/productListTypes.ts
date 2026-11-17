export interface StockBreakdownDetails {
  opening: number;
  purchased: number;
  purchaseHold?: number;
  sold: number;
  salesReturned: number;
  purchaseReturned: number;
  hold: number;
  rejected: number;
  transferredIn?: number;
  transferredOut?: number;
  onHand: number;
  available: number;
}

export interface ProductCatalogItem {
  id: string | number;
  product_name: string;
  item_sr_no?: string;
  category?: string;
  sub_category?: string;
  sub_sub_category?: string;
  bin?: string;
  uom?: string;
  retail_price?: number;
  purchase_price?: number;
  mrp?: number;
  min_stock_alert?: number;
  min_stock?: number;
  product_description?: string;
  item_type?: string;
  pieces_per_box?: number;
  pcs_per_box?: number;
  pieces_per_packing?: number;
  loose_conversion_ratio?: number;
  allow_loose_sales?: boolean;
  loose_uom?: string;
  scenario_name?: string;
  service_charges?: number;
  current_stock?: number;
  dimensions?: string;
  weight?: string;
  breakdown?: StockBreakdownDetails;
  warehouseBreakdowns?: Record<string, any>;
  _loading?: boolean;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}
